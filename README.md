# MiniChatGPT

A ChatGPT-like AI conversation web application built with React + FastAPI + SQLite + DeepSeek stack, featuring streaming output, session history, multi-turn conversations, and thinking mode toggle.

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                          Frontend                                │
│                     (React + Vite + TypeScript)                  │
├──────────────┬──────────────┬──────────────┬─────────────────────┤
│   UI Layer   │ Session Mgmt │ Stream Proc  │   State Store       │
│  Chat UI     │  Sidebar     │   Handler    │  (Context API)      │
└──────┬───────┴──────┬───────┴──────┬───────┴──────────┬──────────┘
       │              │              │                  │
       └──────────────┴──────┬───────┴──────────────────┘
                             │ HTTP + SSE (Port 8000)
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                          Backend                                 │
│                      (Python + FastAPI)                          │
├──────────────┬──────────────┬──────────────┬─────────────────────┤
│  REST API    │ LLM Service  │Session Svc   │    Config/Middleware│
│  /api/chat   │  DeepSeek    │   CRUD       │     CORS, Logging   │
│  /sessions   │  Streaming   │   History    │                     │
└──────┬───────┴──────┬───────┴──────┬───────┴─────────────────────┘
       │              │              │
       └──────────────┴──────┬───────┘
                             │ SQLAlchemy ORM
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                          Storage                                 │
│                         (SQLite)                                 │
├──────────────────────────────┬──────────────────────────────────┤
│         sessions             │           messages               │
│   id, title, timestamps      │ id, session_id, role, content,   │
│                              │ reasoning_content, timestamps    │
└──────────────────────────────┴──────────────────────────────────┘
```

## Tech Stack

- **AI Model**: DeepSeek API (OpenAI-compatible)
- **Frontend**: React 18 + Vite 6 + TypeScript 5
- **Backend**: Python 3.10+ + FastAPI 0.115+
- **Database**: SQLite + SQLAlchemy 2.0
- **Streaming**: Server-Sent Events (SSE)

## Features

### Core Features

- **Streaming Responses**: Real-time streaming output with typing effect
- **Session Management**: Create, switch, rename, and delete conversation sessions
- **Multi-turn Conversations**: Context-aware multi-turn dialogue support
- **Thinking Mode**: Toggle between standard and reasoning mode (DeepSeek-R1)

### UI Features

- ChatGPT-style clean interface
- Collapsible reasoning process display
- Markdown rendering for AI responses
- Loading states and error handling
- Responsive sidebar for session navigation

## Quick Start

### Prerequisites

- Node.js 18+ and npm
- Python 3.10+ and pip
- DeepSeek API key ([Get one here](https://platform.deepseek.com/))

### Backend Setup

```bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env      # Edit .env and add your DEEPSEEK_API_KEY
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

The frontend runs on `http://localhost:5173` with a Vite proxy forwarding `/api` to `http://127.0.0.1:8000`.

## Project Structure

```
MiniChatGPT/
├── backend/                    # FastAPI Backend
│   ├── app/
│   │   ├── main.py             # FastAPI entry point
│   │   ├── config.py           # Configuration & environment
│   │   ├── database.py         # DB connection & session
│   │   ├── models/             # SQLAlchemy ORM models
│   │   │   ├── session.py
│   │   │   └── message.py
│   │   ├── schemas/            # Pydantic request/response models
│   │   │   ├── chat.py
│   │   │   └── session.py
│   │   ├── routers/            # API route handlers
│   │   │   ├── chat.py
│   │   │   └── sessions.py
│   │   └── services/           # Business logic
│   │       ├── llm_service.py  # DeepSeek API integration
│   │       └── session_service.py
│   ├── requirements.txt
│   └── .env.example
│
├── frontend/                   # React Frontend
│   ├── src/
│   │   ├── components/         # Reusable UI components
│   │   │   ├── ChatMessage.tsx
│   │   │   ├── ChatInput.tsx
│   │   │   ├── SessionSidebar.tsx
│   │   │   └── ThinkingToggle.tsx
│   │   ├── pages/              # Page-level components
│   │   │   └── ChatPage.tsx
│   │   ├── hooks/              # Custom React hooks
│   │   │   ├── useStreamChat.ts
│   │   │   └── useSessions.ts
│   │   ├── services/           # API calls
│   │   │   └── api.ts
│   │   ├── stores/             # State management (Context API)
│   │   │   └── ChatContext.tsx
│   │   └── types/              # TypeScript type definitions
│   │       └── index.ts
│   ├── package.json
│   └── vite.config.ts
│
├── .cursor/plans/              # Development plans
│   └── minichatgpt_开发计划.md
│
├── README.md
└── AGENTS.md                   # AI coding guidelines
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/chat` | Stream chat messages |
| GET | `/api/sessions` | List all sessions |
| POST | `/api/sessions` | Create new session |
| GET | `/api/sessions/{id}/messages` | Get session messages |
| DELETE | `/api/sessions/{id}` | Delete session |
| PATCH | `/api/sessions/{id}` | Update session title |

### Streaming Response Format

```json
{ "type": "reasoning", "data": "Thinking process..." }
{ "type": "content", "data": "Response content..." }
{ "type": "done", "data": "" }
```

## Development Roadmap

### Phase 1: Foundation
- [x] Backend: FastAPI setup, CORS, environment config
- [x] Frontend: React + Vite + TypeScript project init
- [x] Database: Sessions and messages schema

### Phase 2: Core Backend
- [x] LLM Service: DeepSeek API integration
- [x] Streaming: SSE implementation
- [x] Chat API: Session-aware streaming endpoint

### Phase 3: Session & Multi-turn
- [x] Session CRUD APIs
- [x] Message persistence
- [x] Context building (content only, no reasoning_content)

### Phase 4: Frontend UI
- [x] Mock layer for development
- [x] Chat interface with streaming display
- [x] Session sidebar (list, create, switch, delete)
- [x] Thinking mode toggle
- [x] Markdown rendering

### Phase 5: Polish
- [x] Error handling & loading states
- [x] Basic ChatGPT-style styling
- [x] Session title auto-generation

## Configuration

Create `backend/.env` file:

```env
DEEPSEEK_API_KEY=your_api_key_here
DEEPSEEK_BASE_URL=https://api.deepseek.com
```

## Development Notes

- **Mock Mode**: Frontend supports mock responses when backend is unavailable (set `USE_MOCK=true` in `api.ts`)
- **TypeScript**: Strict mode enabled, type-only imports preferred
- **CSS Modules**: Component-scoped styling (no Tailwind)
- **Context API**: Global state management for sessions and chat
- **Streaming**: Uses native `fetch` + `ReadableStream` API

## License

MIT

## Acknowledgments

- DeepSeek API for the AI capabilities
- OpenAI SDK compatibility layer
- React and FastAPI communities
