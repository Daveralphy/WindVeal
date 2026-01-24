# WindVeal AI Assistant

WindVeal (formerly Dave Chatbot) is a modern AI assistant built with **Next.js** and deployed on **Vercel**. It features a unique "Hybrid Intelligence" system that handles simple queries locally in the browser for instant responses, while leveraging **HuggingFace's Zephyr-7B** model for complex reasoning and creative tasks.

[![WindVeal Chatbot](images/homepage.png)](https://windvealchatbot.vercel.app)

Click the image above to visit the live application.
---

## 🚀 Features

- **Hybrid Intelligence:**
  - **Local Brain:** Instantly answers common questions (Math, Identity, Definitions) directly in the browser using a customizable `intents.json` file. Zero latency, zero API costs.
  - **Cloud Brain:** Seamlessly hands off complex queries to WindVeal Mini (HuggingFace Mistral-7B) for deep understanding.
- **Modern Tech Stack:** Built with Next.js (React), Tailwind CSS, and Vercel Serverless Functions.
- **Secure Authentication:** Custom authentication using password hashing (pbkdf2).
- **Persistent History:** Chat history is stored securely in a cloud PostgreSQL database (Supabase).
- **Serverless Architecture:** No servers to manage. Scales automatically on Vercel's edge network.
- **Professional Tiering:** WindVeal Mini, Pro, and Premium tiers for future scalability.

---

## 📁 Project Structure

```
WindVeal/
├── public/
│   ├── index.html                    # Welcome landing page
│   ├── styles/
│   │   └── styles.css               # Welcome page styles
│   ├── scripts/
│   │   └── scripts.js               # Welcome page interactions
│   └── favicon.ico
├── app/                             # Next.js App Router (Main Chat App)
│   ├── api/
│   │   ├── auth/
│   │   │   ├── login/route.js       # Login endpoint
│   │   │   └── register/route.js    # Registration endpoint
│   │   ├── chat/route.js            # Chat API (HuggingFace Zephyr integration)
│   │   └── history/route.js         # Chat history storage
│   ├── lib/
│   │   └── db.js                    # Database connection pool
│   ├── globals.css                  # Global Tailwind styles
│   ├── layout.js                    # Root layout
│   └── page.js                      # Main chat interface
├── components/                      # React Components
│   ├── AuthModal.js                 # Login/Register Modal
│   └── Settings.js                  # Theme & Font Size Settings
├── data/
│   ├── intents.json                 # Local Brain knowledge base
│   └── persona.json                 # Cloud Brain personality
├── .env                             # Environment variables
├── jsconfig.json                    # JavaScript config
├── tailwind.config.js               # Tailwind CSS configuration
├── postcss.config.js                # PostCSS configuration
├── package.json                     # Dependencies
└── README.md                        # This file
```

## 📱 Multi-Platform Deployment

- **Web App:** Hosted on Vercel - Full-featured chat interface
- **Mobile Apps:** Coming soon for iOS (App Store) and Android (Google Play)
- **Landing Page:** `public/index.html` - Marketing website for the project

---

## 🛠️ Setup Instructions

### Prerequisites
- Node.js 18+ installed.
- A HuggingFace API token.
- A Supabase account for PostgreSQL database.
- A Vercel account (optional, for deployment).

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/Daveralphy/WindVeal.git
   cd WindVeal
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure Environment Variables:**
   Create a `.env.local` file in the root directory:
   ```env
   HF_TOKEN=your_huggingface_token_here
   POSTGRES_URL_NON_POOLING=your_supabase_connection_string
   ```

4. **Run Locally:**
   ```bash
   npm run dev
   ```
   Access the app at `http://localhost:3000`.

## 🧠 Customizing the Brain

WindVeal is designed to be easily extensible.

### Adding Instant Answers (Local Brain)
Edit `data/intents.json` to add new patterns. No coding required!
```json
{
  "patterns": ["what is your version", "version"],
  "response": "I am WindVeal version 2.0, running on Next.js."
}
```

### Changing Personality (Cloud Brain)
Edit `data/persona.json` to change how the AI behaves during complex conversations.

## 🚀 Deployment to Vercel

1. Push your code to GitHub.
2. Go to Vercel.com and click **"Add New Project"**.
3. Import your WindVeal repository.
4. In the **Environment Variables** section, add:
   - `HF_TOKEN`: Your HuggingFace API token
   - `POSTGRES_URL_NON_POOLING`: Your Supabase connection string
5. Click **Deploy**.

The landing page (`public/index.html`) will be served as a static file, and the Next.js app will run on the same domain.

## 📲 Mobile App Development

Mobile apps for iOS and Android are planned using React Native or Flutter. They will:
- Share the same API endpoints as the web app
- Support offline functionality with the local brain
- Provide native platform features (push notifications, etc.)
- Sync chat history with user accounts

## License
All copyright observed. This program should not be used without my permission or for any business purpose without first consulting the programmer at the WhatsApp number below.

## Contact
For questions or collaboration, please reach out via the GitHub repo or contact me on WhatsApp via wa.me/2347032580065
