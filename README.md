# WindVeal: Hybrid AI Assistant

WindVeal (formerly Dave Chatbot) is a modern, hybrid AI assistant built with **Next.js** and deployed on **Vercel**. It features a unique "Hybrid Intelligence" system that handles simple queries locally in the browser for instant responses, while leveraging Google's **Gemini 1.5 Flash** model for complex reasoning and creative tasks.

---

## 🚀 Features

- **Hybrid Intelligence:**
  - **Local Brain:** Instantly answers common questions (Math, Identity, Definitions) directly in the browser using a customizable `intents.json` file. Zero latency, zero API costs.
  - **Cloud Brain:** Seamlessly hands off complex queries to Google Gemini for deep understanding.
- **Modern Tech Stack:** Built with Next.js (React), Tailwind CSS, and Vercel Serverless Functions.
- **Secure Authentication:** Stateless authentication using NextAuth.js / JWT.
- **Persistent History:** Chat history is stored securely in a cloud PostgreSQL database (Vercel Postgres / Supabase).
- **Serverless Architecture:** No servers to manage. Scales automatically on Vercel's edge network.

---

## 📁 Project Structure

```
WindVeal/
├── app/                 # Next.js App Router
│   ├── api/             # Serverless API Routes (Chat, Auth)
│   └── page.js          # Main Frontend Interface
├── components/          # React Components
│   ├── ChatInterface.js # Main Chat UI
│   ├── AuthModal.js     # Login/Register Modals
│   └── Settings.js      # Theme & Preferences
├── data/
│   ├── intents.json     # The "Local Brain" knowledge base
│   └── persona.json     # The "Cloud Brain" personality
├── utils/
│   └── localBrain.js    # Logic for instant client-side answers
└── public/              # Static assets
```

---

## 🛠️ Setup Instructions

### Prerequisites
- Node.js 18+ installed.
- A Google Cloud API Key (for Gemini).
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
   GOOGLE_API_KEY="your_gemini_api_key_here"
   POSTGRES_URL="your_database_connection_string"
   NEXTAUTH_SECRET="your_generated_secret_key"
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
4. In the **Environment Variables** section, add your `GOOGLE_API_KEY`, `POSTGRES_URL`, and `NEXTAUTH_SECRET`.
5. Click **Deploy**.

## License
All copyright observed. This program should not be used without my permission or for any business purpose without first consulting the programmer at the WhatsApp number below.

## Contact
For questions or collaboration, please reach out via the GitHub repo or contact me on WhatsApp via wa.me/2347032580065
