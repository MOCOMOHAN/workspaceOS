# 30-Day Relentless Execution Protocol (WorkspaceOS)

A high-performance, locally-hosted 30-Day accountability dashboard and task tracker. Designed with a strict geometric Bauhaus aesthetic, this tool pairs a habit tracker with a relentless, entirely local AI accountability coach powered by LLaMA 3.1 and Kokoro TTS.

## 🚀 Features

- **The Grid (Tracker Tab):** A brutal, no-nonsense 30-day checklist. Track habits, drop daily journal comments, and visualize streaks.
- **Dynamic Intensity Heatmap (Visualize Tab):** An automated, CSS-powered heatmap that scales from White (0%) to aggressive Orange (100%) based on your daily completion intensity.
- **AI Accountability Coach:** A built-in chat window hooked up to a customized LLM. The AI acts as a "tough-love coach" who roasts you for missing days and pushes you to execute.
- **Autonomous Task Injection:** The AI has agency. If you ask it for advice, it can automatically inject new tasks directly into your tracker using the `[ADD_TASK: "name"]` protocol.
- **Zero-Latency TTS Engine:** The AI physically talks to you using the ultra-fast Kokoro Text-to-Speech model. Audio generation is streamed and aggressively pre-fetched to eliminate pauses.
- **100% Local & Private:** No cloud APIs. The LLM runs on your GPU via Ollama, and the TTS engine runs on your CPU via Docker.

## 🛠️ Architecture

- **Frontend:** React + Vite (Vanilla CSS for strict Bauhaus design).
- **Brain (LLM):** Ollama (`llama3.1:8b`) running locally on port `11434`.
- **Voice (TTS):** Kokoro FastAPI (CPU-optimized) running locally on port `8880` via Docker.
- **Data Persistence:** LocalStorage (No external database required).

## ⚙️ Setup & Installation

To run this environment, you need three things running simultaneously:

### 1. Start the LLM (Ollama)
Ensure you have [Ollama](https://ollama.com/) installed and running on your machine.
```powershell
# Pull and start the LLaMA 3.1 model (if not already downloaded)
ollama run llama3.1:8b
```
*Ensure Ollama is accessible at `http://localhost:11434`.*

### 2. Start the TTS Engine (Docker)
Ensure Docker Desktop is running, then spin up the CPU-optimized Kokoro FastAPI container:
```powershell
docker run -d --name kokoro-tts -p 8880:8880 ghcr.io/remsky/kokoro-fastapi-cpu:latest
```
*This handles voice generation on your CPU, leaving your GPU entirely dedicated to LLaMA.*

### 3. Start the Dashboard (React)
Open a new terminal in this project directory:
```powershell
# Install dependencies
npm install

# Start the Vite development server
npm run dev
```

## 🧠 Customizing the Coach

To change the AI's personality or tweak your user profile, edit `src/profile.json`. The AI reads this file dynamically on every chat message to understand your goals, your weaknesses, and how it should speak to you.

To change the TTS voice (currently set to British Male `bm_george`), open `src/App.jsx`, locate the `playTTS` function, and change the `voice` parameter. Other built-in voices include `am_adam`, `af_bella`, and `af_nicole`.

## 🎨 Design Philosophy
Inspired by the Bauhaus movement, the UI relies strictly on primitive geometry, thick borders, and heavy contrast (`var(--b-black)`, `var(--b-white)`, `var(--b-yellow)`, `var(--b-red)`, `var(--b-blue)`). Form follows function; there are no unnecessary drop shadows or gradients outside of the heatmap logic. 
