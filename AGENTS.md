# AGENTS.md - MiniChatGPT Coding Guidelines

This document provides guidelines for AI agents working on the MiniChatGPT codebase.

## Project Overview

MiniChatGPT is a ChatGPT-like AI conversation web app with:
- **Frontend**: React + TypeScript + Vite
- **Backend**: FastAPI + SQLAlchemy + SQLite
- **AI Model**: DeepSeek API

## Build Commands

### Frontend (React + Vite)
```bash
cd frontend
npm install
npm run dev          # Development server (port 5173)
npm run build        # Production build
npm run preview      # Preview production build
```

### Backend (FastAPI)
```bash
cd backend
source venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### Full Stack
```bash
# Terminal 1 - Backend
cd backend && source venv/bin/activate && uvicorn app.main:app --reload

# Terminal 2 - Frontend  
cd frontend && npm run dev
```

## Code Style Guidelines

### TypeScript (Frontend)

#### Imports
- Use `type` keyword for type-only imports: `import type { Session } from '../types'`
- Group imports: 1) React/libraries, 2) types, 3) components, 4) styles
- Use path alias `@/*` for imports from `src/`

#### Naming Conventions
- Components: PascalCase (`ChatMessage.tsx`)
- Hooks: camelCase starting with `use` (`useStreamChat.ts`)
- Props interfaces: `ComponentNameProps`
- Type files: `types/index.ts`
- CSS Modules: `ComponentName.module.css`

#### Component Patterns
- Use functional components with named exports (not default)
- Define props interface above component
- Use destructured props in component signature
- Example:
```tsx
interface ChatMessageProps {
  message: Message;
  isStreaming?: boolean;
}

export function ChatMessage({ message, isStreaming = false }: ChatMessageProps) {
  // ...
}
```

#### Types & Interfaces
- Use `interface` for object shapes, `type` for unions/aliases
- Export types from `src/types/index.ts`
- Use strict TypeScript settings (see tsconfig.json)

### Python (Backend)

#### Naming Conventions
- Modules: snake_case (`llm_service.py`)
- Classes: PascalCase (`ChatRequest`, `Session`)
- Functions/Variables: snake_case (`get_client`, `stream_chat`)
- Constants: UPPER_SNAKE_CASE

#### Type Hints
- Use type hints for all function parameters and returns
- Import types: `from typing import List, Dict, Optional, Generator`
- Use modern syntax where available (Python 3.10+)

#### Docstrings
- Use Chinese docstrings for module-level documentation
- Keep function docstrings concise

#### Error Handling
- Use specific exceptions, catch and convert to user-friendly messages
- HTTP exceptions in routers with appropriate status codes
- Service layer raises generic exceptions, routers convert to HTTP

### Project Structure

```
frontend/src/
  components/     # Reusable UI components
  pages/          # Page-level components
  hooks/          # Custom React hooks
  services/       # API calls and external services
  stores/         # State management (Context API)
  types/          # TypeScript type definitions

backend/app/
  models/         # SQLAlchemy ORM models
  schemas/        # Pydantic request/response models
  routers/        # FastAPI route handlers
  services/       # Business logic
  config.py       # Configuration/settings
  database.py     # DB connection & session
  main.py         # FastAPI application entry
```

## Key Implementation Notes

### Frontend
- **Styling**: CSS Modules only (no Tailwind/styled-components)
- **State**: React Context for global state, useState for local
- **Streaming**: Use `fetch` + `ReadableStream` with `reader.getReader()`
- **Mock Mode**: API layer supports mock mode via `USE_MOCK` flag

### Backend
- **Streaming**: SSE (Server-Sent Events) via `StreamingResponse`
- **Database**: SQLite via SQLAlchemy ORM
- **LLM**: DeepSeek API via OpenAI-compatible client
- **CORS**: Configured for localhost:5173 (Vite dev server)

### Environment Variables
Backend uses `.env` file:
- `DEEPSEEK_API_KEY` - Required for AI functionality
- `DEEPSEEK_BASE_URL` - API endpoint

## Testing

No test framework is currently configured. When adding tests:
- Frontend: Consider Vitest (works with Vite)
- Backend: Consider pytest with httpx for API testing

## Linting

No linting tools are currently configured. Consider adding:
- Frontend: ESLint + Prettier
- Backend: ruff or flake8 + black

Run TypeScript checks: `cd frontend && npx tsc --noEmit`

## API Conventions

- Base path: `/api`
- Response format: JSON or SSE stream
- Error handling: Return user-friendly messages in Chinese
- Status codes: 400 (validation), 401 (auth), 404 (not found), 500 (server error)

## Important Patterns

1. **Mock Support**: Frontend API layer supports mock mode for development without backend
2. **Streaming**: Chat uses SSE with format: `{ type: 'reasoning'|'content'|'done', data: '...' }`
3. **Context Building**: Only `content` is sent to LLM, not `reasoning_content`
4. **Session Titles**: Auto-generated from first user message (first 30 chars)
5. **Error Messages**: Always in Chinese for user-facing errors
