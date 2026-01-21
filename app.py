from functools import wraps
import os
import secrets
from datetime import timedelta
import time
import json
import logging
from flask import Flask, request, jsonify, session, redirect, url_for, render_template
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS
from dotenv import load_dotenv # Used for local development
import google.generativeai as genai
from werkzeug.security import generate_password_hash, check_password_hash

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')

app = Flask(__name__)

# Enable Cross-Origin Resource Sharing
CORS(app, supports_credentials=True) # supports_credentials=True is needed for session cookies

# Load environment variables from .env file
load_dotenv()

# --- Configuration from Environment Variables ---
app.secret_key = os.getenv('FLASK_SECRET_KEY', secrets.token_hex(16))
if app.secret_key == 'your_flask_secret_key_here':
    logging.warning("FLASK_SECRET_KEY is not set or is default. Please set a strong secret key in your environment.")

# Database configuration
app.config['SQLALCHEMY_DATABASE_URI'] = os.getenv('DATABASE_URL', 'sqlite:///davechatbot.db')
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
db = SQLAlchemy(app)

# Set session to be permanent for 30 days
app.permanent_session_lifetime = timedelta(days=30)

# --- Configure Google Gemini API ---
GOOGLE_API_KEY = os.getenv('GOOGLE_API_KEY')
if not GOOGLE_API_KEY:
    logging.error("FATAL: GOOGLE_API_KEY environment variable not set.")
else:
    genai.configure(api_key=GOOGLE_API_KEY)

# --- Guest Message Limit ---
MAX_GUEST_MESSAGES = 10 # Define the maximum number of messages for guest users

# --- Verify Environment Variables are Loaded (for debugging) ---
logging.info(f"FLASK_SECRET_KEY loaded: {'*' * len(app.secret_key) if app.secret_key else 'None'}")
logging.info(f"DATABASE_URL loaded: {app.config['SQLALCHEMY_DATABASE_URI']}")
logging.info(f"GOOGLE_API_KEY loaded: {'Set' if GOOGLE_API_KEY else 'Not Set'}")
logging.info(f"MAX_GUEST_MESSAGES set to: {MAX_GUEST_MESSAGES}")

# --- Database Models ---
class User(db.Model):
    id = db.Column(db.String(32), primary_key=True, unique=True, default=lambda: secrets.token_hex(16))
    username = db.Column(db.String(80), unique=True, nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(128), nullable=False)

class ChatHistory(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.String(32), db.ForeignKey('user.id'), nullable=False)
    history = db.Column(db.Text, nullable=False) # Storing history as a JSON string
    last_updated = db.Column(db.Integer, default=lambda: int(time.time()))

# Create database tables if they don't exist
with app.app_context():
    db.create_all()
    logging.info("Database tables checked/created.")

def load_user_chat_history(user_id):
    """
    Loads chat history for a given user from the SQLite database.
    Returns the chat history as a list of dictionaries, or an empty list if not found.
    """
    try:
        history_record = ChatHistory.query.filter_by(user_id=user_id).first()
        if history_record:
            history = json.loads(history_record.history)
            logging.info(f"Successfully loaded chat history for user: {user_id}. History length: {len(history)}")
            return history
        logging.info(f"No chat history found for user: {user_id}")
        return []
    except json.JSONDecodeError as e:
        logging.error(f"Error decoding chat history JSON for user {user_id}: {e}")
        return []
    except Exception as e:
        logging.error(f"Database error loading chat history for user {user_id}: {e}")
        return []

def save_user_chat_history(user_id, history):
    """
    Saves chat history for a given user to the SQLite database.
    History is stored as a JSON string.
    """
    try:
        history_record = ChatHistory.query.filter_by(user_id=user_id).first()
        chat_history_json = json.dumps(history)
        if history_record:
            history_record.history = chat_history_json
            history_record.last_updated = int(time.time())
        else:
            history_record = ChatHistory(user_id=user_id, history=chat_history_json)
            db.session.add(history_record)
        db.session.commit()
        logging.info(f"Successfully saved chat history for user: {user_id}. History length: {len(history)}")
        return True
    except Exception as e:
        logging.error(f"Database error saving chat history for user {user_id}: {e}")
        db.session.rollback()
        return False

# Function to load persona from local file
def load_persona_from_local():
    try:
        with open('persona.json', 'r', encoding='utf-8') as f:
            persona_data = json.load(f)
        logging.info("Successfully loaded persona from local file: persona.json")
        return persona_data
    except FileNotFoundError:
        logging.warning("Persona file 'persona.json' not found in the project directory.")
        return None
    except json.JSONDecodeError as e:
        logging.error(f"Failed to decode persona.json: {e}")
        return None
    except Exception as e:
        logging.error(f"An unexpected error occurred while loading persona from local file: {e}")
        return None

# Load persona on app startup
persona = load_persona_from_local()
if persona:
    logging.info("Persona loaded successfully.")
else:
    logging.warning("Failed to load persona. Chatbot might not function as expected without a persona.")

# Initialize the Generative Model (using 1.5 Flash as it's efficient for chat)
model = genai.GenerativeModel('gemini-1.5-flash-latest')

# --- Persona instruction moved into the beginning of the history ---
# This serves as a base for the chatbot's identity and behavior
initial_persona_prompt = [
    {
        "role": "user",
        "parts": [{"text": "You are Dave, a helpful chat assistant created by Raphael Daveal. You will always respond as Dave and adhere to the persona provided in your training data."}],
    },
    {
        "role": "model",
        "parts": [{"text": "Okay, I understand. I am Dave, and I will respond as a helpful chat assistant created by Raphael Daveal, adhering to my defined persona."}]
    }
]

# Helper function to get/initialize chat session history for a user
def get_gemini_chat_session_history():
    """
    Retrieves or initializes the chat history for the current user session.
    For logged-in users, it attempts to load history from the database.
    """
    user_id = session.get('user_id')

    # Try to load from database if user is logged in
    if user_id and session.get('logged_in'):
        user_chat_history = load_user_chat_history(user_id)
        if user_chat_history:
            logging.info(f"Loaded chat session from DB for user: {session.get('username')}")
            return user_chat_history

    # If no history in DB or not logged in, initialize a new history
    new_history = list(initial_persona_prompt) # Start with base instructions

    # Add examples from persona.json if available
    if persona and 'examples' in persona and persona['examples']:
        for example in persona['examples']:
            if 'user' in example and 'bot' in example:
                new_history.append({"role": "user", "parts": [{"text": example['user']}]})
                new_history.append({"role": "model", "parts": [{"text": example['bot']}]})
    
    logging.info(f"Initialized new chat session for user: {session.get('username', 'Anonymous/Guest')}")
    return new_history

# --- Authentication Decorator and Routes with DynamoDB ---
def login_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if 'logged_in' not in session or not session['logged_in']:
            logging.warning("Unauthorized access attempt (not logged in).")
            return jsonify({"error": "Unauthorized. Please log in."}), 401
        return f(*args, **kwargs)
    return decorated_function

@app.route('/')
def index():
    # Render the single index.html file, which now contains all modal HTML
    return render_template('index.html')

@app.route('/register', methods=['POST'])
def register():
    username = request.json.get('username')
    email = request.json.get('email') # Get email from request
    password = request.json.get('password')

    if not username or not email or not password: # Ensure email is also required for registration
        logging.warning("Registration attempt with missing username, email, or password.")
        return jsonify({"error": "Username, email, and password are required"}), 400

    try:
        # Check if username already exists
        if User.query.filter_by(username=username).first():
            logging.warning(f"Registration attempt for existing username: {username}.")
            return jsonify({"error": "Username already exists"}), 409 # 409 Conflict
        
        # Check if email already exists
        if User.query.filter_by(email=email).first():
            logging.warning(f"Registration attempt for existing email: {email}.")
            return jsonify({"error": "Email address already in use"}), 409

        # Hash password
        password_hash = generate_password_hash(password)

        # Create new user and add to database
        new_user = User(username=username, email=email, password_hash=password_hash)
        db.session.add(new_user)
        db.session.commit()

        logging.info(f"User '{username}' registered successfully with user_id: {new_user.id}")
        return jsonify({"message": "Registration successful"}), 201 # 201 Created
    except Exception as e:
        db.session.rollback()
        logging.error(f"Error during registration for user '{username}': {e}", exc_info=True)
        return jsonify({"error": "Registration failed due to server error."}), 500


@app.route('/login', methods=['POST'])
def login():
    username = request.json.get('username')
    password = request.json.get('password')

    try:
        user = User.query.filter_by(username=username).first()

        if user and check_password_hash(user.password_hash, password):
            session['logged_in'] = True
            session['username'] = user.username
            session['user_id'] = user.id # Use the user_id from the User model
            session['email'] = user.email # Store email in session
            session.permanent = True

            # Load chat history for the logged-in user into session
            session['user_chat_history'] = get_gemini_chat_session_history()
            
            logging.info(f"User '{username}' logged in. Chat history initialized/loaded.")
            return jsonify({"message": "Login successful", "username": user.username, "email": user.email}), 200
        else:
            logging.warning(f"Login failed for user '{username}'. Invalid credentials.")
            session.pop('logged_in', None)
            session.pop('username', None)
            session.pop('user_id', None)
            session.pop('user_chat_history', None)
            session.permanent = False
            return jsonify({"error": "Invalid credentials"}), 401
    except Exception as e:
        logging.error(f"Error during login for user '{username}': {e}", exc_info=True)
        return jsonify({"error": "Login failed due to server error."}), 500

@app.route('/logout', methods=['POST'])
@login_required
def logout():
    user_id = session.get('user_id')
    if user_id and 'user_chat_history' in session:
        # Save current chat history to database before logging out
        save_user_chat_history(user_id, session['user_chat_history'])

    session.pop('logged_in', None)
    session.pop('username', None)
    session.pop('user_id', None)
    session.pop('user_chat_history', None)
    session.pop('guest_message_count', None) # Clear guest count on logout
    session.permanent = False
    logging.info(f"User '{session.get('username', 'Anonymous')}' logged out. Chat history cleared/saved.")
    return jsonify({"message": "Logged out"}), 200

@app.route('/check_login_status', methods=['GET'])
def check_login_status():
    if 'user_id' in session and session.get('logged_in'):
        user_id = session['user_id']
        username = session['username'] # Get username directly from session

        # Ensure chat history is loaded into session if not already present (e.g., on first page load or session restore)
        if 'user_chat_history' not in session:
            session['user_chat_history'] = get_gemini_chat_session_history()
            logging.info(f"Chat history re-initialized/loaded into session for user {user_id}.")
            
        # Filter out persona prompts from the history sent to the frontend for display
        display_chat_history = []
        for msg in session['user_chat_history']:
            # Get the text content safely, handling both dict {'text': '...'} and raw string formats
            message_text = ""
            if msg['parts'] and isinstance(msg['parts'], list) and len(msg['parts']) > 0:
                first_part = msg['parts'][0]
                if isinstance(first_part, dict) and 'text' in first_part:
                    message_text = first_part['text']
                elif isinstance(first_part, str):
                    message_text = first_part
            
            # Check if the message's text matches either of the initial persona prompts
            is_persona_message = False
            if msg['role'] == 'user' and message_text == initial_persona_prompt[0]['parts'][0]['text']:
                is_persona_message = True
            elif msg['role'] == 'model' and message_text == initial_persona_prompt[1]['parts'][0]['text']:
                is_persona_message = True
            
            if not is_persona_message: # Only add if it's NOT a persona message
                # Append to display_chat_history ensuring the correct format: {'role': ..., 'parts': ['text_content']}
                display_chat_history.append({'role': msg['role'], 'parts': [message_text]})
        
        logging.info(f"Login status check: User '{username}' is logged in. History length for display: {len(display_chat_history)}")
        return jsonify({
            "logged_in": True, 
            "username": username,
            "user_id": user_id, # Frontend might need user_id for client-side distinctions
            "email": session.get('email', None), # Get email from session, if available
            "chat_history": display_chat_history # Send cleaned history for display
        }), 200 # Always return 200 OK if the check itself was successful
    else:
        logging.info("Login status check: User is not logged in.")
        # Return the actual guest message count from the session
        guest_msg_count = session.get('guest_message_count', 0)
        return jsonify({
            "logged_in": False, 
            "guest_message_count": guest_msg_count
        }), 200

@app.route('/chat', methods=['POST'])
# @login_required # REMOVED: No longer required, logic handled inside for guests
def chat_endpoint():
    user_message = request.json.get('message')
    if not user_message:
        logging.warning("Chat attempt with no message provided.")
        return jsonify({"error": "No message provided"}), 400

    logged_in = session.get('logged_in', False)
    user_id = session.get('user_id')
    username = session.get('username', 'Anonymous')
    
    # --- Persona & Guest Message Limit Logic ---
    # Ensure user_chat_history is initialized with persona for all users (especially guests)
    if 'user_chat_history' not in session:
        session['user_chat_history'] = get_gemini_chat_session_history()
        logging.info(f"chat_endpoint: user_chat_history initialized for new session (user: {username}).")

    if not logged_in:
        guest_message_count = session.get('guest_message_count', 0)
        logging.info(f"Guest user attempt. Current messages: {guest_message_count}")
        if guest_message_count >= MAX_GUEST_MESSAGES:
            logging.warning(f"Guest user {username} exceeded message limit.")
            return jsonify({
                "error": f"You've reached your limit of {MAX_GUEST_MESSAGES} free messages. Please log in for unlimited access.",
                "code": "LIMIT_EXCEEDED"
            }), 403 # 403 Forbidden
        session['guest_message_count'] = guest_message_count + 1
        session.modified = True # Ensure session updates are saved
        logging.info(f"Guest user {username} sent message. New count: {session['guest_message_count']}")
    # --- End Guest Message Limit Logic ---

    logging.info(f"User '{username}' (ID: {user_id or 'Guest'}) message: {user_message}")
    
    # Get the chat history from the session (which includes persona and previous turns)
    # This `current_chat_history` will now correctly contain the persona thanks to the `if` block above
    current_chat_history = session.get('user_chat_history', [])
    
    try:
        # Start a chat session with the full history up to this point
        chat_session = model.start_chat(history=current_chat_history)
        
        # Send the user's current message to the active chat session
        response = chat_session.send_message(user_message)
        bot_response = response.text
        
        # Update the session history with the new user message and bot response
        current_chat_history.append({"role": "user", "parts": [{"text": user_message}]})
        current_chat_history.append({"role": "model", "parts": [{"text": bot_response}]})
        session['user_chat_history'] = current_chat_history # Update the session
        session.modified = True # Tell Flask the session data has been modified

        # Save updated history to database if logged in
        if logged_in and user_id:
            save_user_chat_history(user_id, session['user_chat_history'])

        logging.info(f"Bot response for user '{username}': {bot_response}")

        return jsonify({"response": bot_response})

    except Exception as e:
        logging.error(f"Error during chat for user '{username}' (ID: {user_id or 'Guest'}): {e}", exc_info=True)
        return jsonify({"error": str(e)}), 500

@app.route('/new_chat', methods=['GET', 'POST'])
# @login_required # REMOVED: Logic handled inside for guests
def new_chat():
    logged_in = session.get('logged_in', False)
    user_id = session.get('user_id')
    username = session.get('username', 'Anonymous')

    # Save current history before clearing for new chat (for logged-in users)
    if logged_in and user_id and 'user_chat_history' in session:
        save_user_chat_history(user_id, session['user_chat_history'])

    # For all users, just reset their message count and re-initialize chat history
    session['guest_message_count'] = 0
    session['user_chat_history'] = get_gemini_chat_session_history()
    session.modified = True
    logging.info(f"User '{username}' started a new chat. Message count reset.")

    return jsonify({"message": "New chat started"}) # Return JSON for frontend to handle message clearing

# --- Profile/Settings/About routes still redirect to main page ---
@app.route('/profile')
@login_required
def profile_redirect():
    logging.info(f"User '{session.get('username', 'Anonymous')}' accessed /profile, redirecting to index (modal handled).")
    return redirect(url_for('index'))

@app.route('/settings')
@login_required
def settings_redirect():
    logging.info(f"User '{session.get('username', 'Anonymous')}' accessed /settings, redirecting to index (modal handled).")
    return redirect(url_for('index'))

@app.route('/about')
@login_required
def about_redirect():
    logging.info(f"User '{session.get('username', 'Anonymous')}' accessed /about, redirecting to index (modal handled).")
    return redirect(url_for('index'))


if __name__ == '__main__':
    logging.info("WARNING: Running Flask locally.")
    app.run(debug=False, host='0.0.0.0', port=5000)
