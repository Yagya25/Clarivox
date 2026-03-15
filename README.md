# 🎙️ Clarivox

[🔗 GitHub Repository](https://github.com/Yagya25/Clarivox.git)

An AI-powered debate coach and MUN simulation platform that challenges your arguments in real-time and scores your performance on **logic**, **evidence quality**, and **persuasiveness**.

---

## ✨ Features

- **🤖 AI Opponent** — Gemini-powered AI takes the opposing side and delivers strong counter-arguments.
- **⚡ Real-Time Debate** — Back-and-forth debate with instant AI responses.
- **🏛️ MUN Mode** — Specialized Model United Nations mode with formal protocols and parliamentary procedures.
- **⚔️ Face-to-Face Dual Debate** — A specialized mode for two users to debate locally with AI analysis.
- **🔍 Weakness Detection** — AI identifies logical fallacies, unsupported claims, and weak reasoning.
- **🎤 Voice Mode** — Speak your arguments using Groq Whisper speech-to-text.
- **📊 Scoring & Feedback** — Detailed scorecard on Logic, Evidence, and Persuasiveness (0–10) with actionable areas to improve.
- **🛡️ Admin Dashboard** — Monitor site visits and session statistics.

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | React 19 + Vite |
| **Backend** | FastAPI (Python 3.10+) |
| **Database** | SQLite + SQLAlchemy |
| **AI Engine** | Google Gemini (Gemini 1.5/2.0) |
| **Voice STT** | Groq Whisper |
| **Animations** | GSAP, Framer Motion, OGL, Three.js |
| **Styling** | Dark Glassmorphism (Vanilla CSS) |

## 🚀 Installation & Setup

### 1. Clone the Repository
```bash
git clone https://github.com/Yagya25/Clarivox.git
cd Clarivox
```

### 2. Environment Variables
Create a `.env` file in the root directory:
```bash
GEMINI_API_KEY=your_google_ai_key
GROQ_API_KEY=your_groq_key (optional)
OPENAI_API_KEY=your_openai_key 
```

### 3. Local Development

**Frontend:**
```bash
cd frontend
npm install
npm run dev
```

**Backend:**
```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
python -m uvicorn main:app --reload
```

## 🌐 Production Deployment (Render)

This project is configured to run as a single service on Render (Backend serving Frontend).

1. **Build Command:**
   ```bash
   cd frontend && npm install && npm run build && cd ../backend && pip install -r requirements.txt
   ```
2. **Start Command:**
   ```bash
   python -m uvicorn --app-dir backend main:app --host 0.0.0.0 --port $PORT
   ```
3. **Environment Variables:** Set `GEMINI_API_KEY` and `GROQ_API_KEY` in the Render dashboard.

## 📁 Project Structure

```text
├── backend/
│   ├── main.py              # FastAPI app entry point (serves frontend)
│   ├── database.py          # SQLAlchemy SQLite configuration
│   ├── config.py            # App settings & API configs
│   ├── models/
│   │   ├── db_models.py     # SQLAlchemy DB Tables
│   │   └── schemas.py       # Pydantic validation models
│   ├── routers/
│   │   ├── debate.py        # Core debate session API
│   │   ├── mun.py           # MUN specific endpoints
│   │   ├── voice.py         # Whisper STT endpoints
│   │   └── admin.py         # Stats & Analytics endpoints
│   └── services/
│       ├── gemini_service.py  # Gemini AI prompts & logic
│       ├── whisper_service.py # OpenAI audio processing
│       └── scoring_service.py # Scoring engine
├── frontend/
│   ├── src/
│   │   ├── pages/           # High-level views (MUN, Arena, Dual, Admin)
│   │   ├── components/      # Reusable UI & Complex animations
│   │   ├── api.js           # Production-ready API client
│   │   └── App.jsx          # Routing & Layout
│   └── dist/                # Built assets (after npm run build)
├── vercel.json              # Client-side routing config
└── README.md
```

## 🎮 How It Works

1. **Pick a Mode** — Choose between Normal Debate, MUN Simulation, or Dual Face-to-Face.
2. **Set the Stage** — Pick a topic and your stance.
3. **Debate** — Present your arguments; AI responds with counter-arguments and identifies weaknesses.
4. **Analysis** — End the session to receive comprehensive scores and feedback.

## 📄 License
MIT
