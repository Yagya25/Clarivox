# 🎙️ Clarivox

[🔗 GitHub Repository](https://github.com/Yagya25/Clarivox.git)

An AI-powered debate coach and MUN simulation platform that challenges your arguments in real-time and scores your performance on **logic**, **evidence quality**, and **persuasiveness**.

Pick a topic → Defend your stance → AI attacks your weak points → Get scored.

## ✨ Features

- **🤖 AI Opponent** — Gemini-powered AI takes the opposing side and delivers strong counter-arguments
- **⚡ Real-Time Debate** — Back-and-forth debate with instant AI responses  
- **🔍 Weakness Detection** — AI identifies logical fallacies, unsupported claims, and weak reasoning
- **🎤 Voice Mode** — Speak your arguments using Whisper speech-to-text
- **📊 Scoring** — Detailed scorecard on Logic, Evidence, and Persuasiveness (0–10)
- **📋 Feedback** — Strengths, areas to improve, and full transcript review

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React + Vite |
| Backend | FastAPI (Python) |
| AI Engine | Google Gemini |
| Voice STT | OpenAI Whisper |
| Design | Dark Glassmorphism |

## 🚀 Installation & Setup

### 1. Clone the Repository
```bash
git clone https://github.com/Yagya25/Clarivox.git
cd Clarivox
```

### 2. Prerequisites
- Node.js 18+
- Python 3.10+
- Google Gemini API key
- OpenAI API key (for Whisper)

### 3. Environment Variables
To get started, you'll need to set up your environment variables for the Gemini and OpenAI APIs.

```bash
cp .env.example .env
# Edit .env and add your API keys:
# GEMINI_API_KEY=your_key_here
# OPENAI_API_KEY=your_key_here
```

### 4. Frontend Build
```bash
cd frontend
npm install
npm run build
```

### 5. Backend & Serve
The backend is configured to serve the built frontend static files so you can run both on a single port.
```bash
cd ../backend
pip install -r requirements.txt
uvicorn main:app --port 8000
```
*(If you do not have `uvicorn` in your path, use `python -m uvicorn main:app --port 8000`)*

Open [http://localhost:8000](http://localhost:8000) in your browser. Both the React UI and FastAPI backend are now running together!

## 📁 Project Structure

```
├── backend/
│   ├── main.py              # FastAPI app entry point
│   ├── config.py             # Configuration & constants
│   ├── models/
│   │   └── schemas.py        # Pydantic models
│   ├── routers/
│   │   ├── debate.py         # Debate API endpoints
│   │   └── voice.py          # Voice transcription endpoint
│   └── services/
│       ├── gemini_service.py  # Gemini AI integration
│       ├── whisper_service.py # Whisper STT integration
│       └── scoring_service.py # Debate scoring engine
├── frontend/
│   └── src/
│       ├── api.js             # API client
│       ├── pages/             # Home, Debate Arena, Results
│       └── components/        # TopicCard, MessageBubble, etc.
├── .env.example
└── README.md
```

## 🎮 How It Works

1. **Choose a Topic** — Pick from suggested topics or enter your own
2. **Select Your Stance** — Choose "For" or "Against" the proposition
3. **Debate** — Present your arguments; AI responds with counter-arguments and identifies weaknesses
4. **Get Scored** — End the debate to receive scores on Logic, Evidence Quality, and Persuasiveness
5. **Review** — Read detailed feedback, see your strengths and areas to improve

## 📄 License

MIT
