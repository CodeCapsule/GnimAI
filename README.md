# Gnim AI

> Your Private AI assistant built for productivity, creativity, and clarity.

Gnim AI is a full-stack React + Node.js application that provides a polished chat interface powered by the **Google Gemini API**. It features **Thinking Mode**, **Web Search grounding**, **file attachments**, a **developer API dashboard**, and an **SDK playground** — all in a beautiful, responsive UI.

---

## ✨ Features

- 🧠 **Thinking Mode** — Forces deep step-by-step reasoning before answering
- 🌐 **Web Search** — Google Search grounding for real-time, sourced answers
- 📎 **File Attachments** — Attach images and documents to your messages
- 🔒 **Private & Self-Hosted** — Your API key, your data
- 🎨 **Beautiful UI** — Sidebar, settings modal, API dashboard & SDK playground
- ⚡ **Smart Fallbacks** — Automatically retries with fallback models on quota errors

---

## 🚀 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) v18+
- A [Google Gemini API key](https://aistudio.google.com/app/apikey)

### Installation

```bash
# 1. Clone the repository
git clone https://github.com/YOUR_USERNAME/gnim-ai.git
cd gnim-ai

# 2. Install dependencies
npm install

# 3. Set up your environment
cp .env.example .env
# Open .env and set your GEMINI_API_KEY

# 4. Start the development server
npm run dev
```

Open your browser at **http://localhost:3000**

---

## ⚙️ Environment Variables

Copy `.env.example` to `.env` and fill in:

| Variable        | Description                          |
|-----------------|--------------------------------------|
| `GEMINI_API_KEY`| Your Google Gemini API key (required)|
| `APP_URL`       | Deployment URL (optional)            |

---

## 🛠️ Tech Stack

| Layer     | Technology                        |
|-----------|-----------------------------------|
| Frontend  | React 19, TypeScript, Tailwind CSS |
| Backend   | Node.js, Express, TypeScript       |
| AI        | Google Gemini API (`@google/genai`)|
| Build     | Vite + esbuild                     |
| Animation | Motion (Framer Motion)             |
| Icons     | Lucide React                       |

---

## 📁 Project Structure

```
gnim-ai/
├── src/
│   ├── components/
│   │   ├── SadeAIChat.tsx       # Main chat interface
│   │   ├── SadeAISidebar.tsx    # Sidebar navigation
│   │   ├── SadeAPIDashboard.tsx # API key dashboard
│   │   ├── SadeSDKPlayground.tsx# SDK playground
│   │   └── SadeSettingsModal.tsx# Settings modal
│   ├── App.tsx                  # Root app component
│   ├── main.tsx                 # Entry point
│   ├── index.css                # Global styles
│   └── types.ts                 # TypeScript types
├── server.ts                    # Express + Vite dev server
├── index.html                   # HTML entry point
├── vite.config.ts               # Vite configuration
├── tsconfig.json                # TypeScript configuration
├── .env.example                 # Environment variable template
└── package.json
```

---

## 📦 Scripts

| Command        | Description                        |
|----------------|------------------------------------|
| `npm run dev`  | Start development server           |
| `npm run build`| Build for production               |
| `npm start`    | Serve the production build         |
| `npm run lint` | Type-check the project             |
| `npm run clean`| Remove build artifacts             |

---

## 📄 License

Apache 2.0 — see [LICENSE](LICENSE) for details.
