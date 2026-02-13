/**
 * API 封装层：统一错误处理，区分网络异常、API 错误、Token 超限等
 */
import type { Session, Message, StreamChunk } from '../types';

const USE_MOCK = false;
const API_BASE = '/api';

function getErrorMessage(res: Response, body: unknown): string {
  if (res.status === 401) return 'API Key 无效或未配置，请检查 .env 中的 DEEPSEEK_API_KEY';
  if (res.status === 429) return '请求过于频繁或 Token 已达上限，请稍后重试';
  if (res.status >= 500) return '服务暂时不可用，请稍后重试';
  if (typeof body === 'object' && body !== null && 'detail' in body) {
    const d = (body as { detail: unknown }).detail;
    return typeof d === 'string' ? d : JSON.stringify(d);
  }
  if (typeof body === 'object' && body !== null && 'message' in body) {
    return String((body as { message: unknown }).message);
  }
  return `请求失败 (${res.status})`;
}

async function handleResponse<T>(res: Response, parseJson = true): Promise<T> {
  const text = await res.text();
  let body: unknown = null;
  if (parseJson && text) {
    try {
      body = JSON.parse(text);
    } catch {
      body = text;
    }
  }
  if (!res.ok) {
    throw new Error(getErrorMessage(res, body || text));
  }
  return (parseJson && body ? body : text) as T;
}

// --- Mock 数据 ---
let mockSessionId = 1;
const mockSessions: Session[] = [
  { id: 1, title: '示例对话', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
];

const mockMessages: Record<number, Message[]> = {
  1: [
    {
      id: 1,
      session_id: 1,
      role: 'user',
      content: '你好，请介绍一下你自己',
      created_at: new Date().toISOString(),
    },
    {
      id: 2,
      session_id: 1,
      role: 'assistant',
      content: '你好！我是 MiniChatGPT，一个基于 DeepSeek 的 AI 助手。我可以回答你的问题、进行对话交流。请问有什么可以帮助你的？',
      created_at: new Date().toISOString(),
    },
  ],
};

function delay(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

// --- Mock 实现 ---
async function mockGetSessions(): Promise<Session[]> {
  await delay(300);
  return [...mockSessions];
}

async function mockCreateSession(): Promise<Session> {
  await delay(200);
  mockSessionId += 1;
  const s: Session = {
    id: mockSessionId,
    title: '新对话',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
  mockSessions.push(s);
  mockMessages[mockSessionId] = [];
  return s;
}

async function mockGetMessages(sessionId: number): Promise<Message[]> {
  await delay(200);
  return mockMessages[sessionId] ?? [];
}

async function mockDeleteSession(sessionId: number): Promise<void> {
  await delay(200);
  const i = mockSessions.findIndex((s) => s.id === sessionId);
  if (i >= 0) mockSessions.splice(i, 1);
  delete mockMessages[sessionId];
}

async function mockUpdateSession(sessionId: number, title: string): Promise<Session> {
  await delay(200);
  const s = mockSessions.find((x) => x.id === sessionId);
  if (s) {
    s.title = title;
    s.updated_at = new Date().toISOString();
  }
  return s!;
}

async function* mockStreamChat(
  _sessionId: number | null,
  message: string,
  thinkingMode: boolean
): AsyncGenerator<StreamChunk> {
  if (thinkingMode) {
    const reasoning = '让我思考一下这个问题...这是一个很好的问题，我需要从多个角度来分析。';
    for (const char of reasoning) {
      yield { type: 'reasoning', data: char };
      await delay(30);
    }
    yield { type: 'reasoning', data: '\n' };
  }

  const reply = `收到你的消息：「${message}」。这是 Mock 模式的模拟回复。思考模式：${thinkingMode ? '开启' : '关闭'}。`;
  for (const char of reply) {
    yield { type: 'content', data: char };
    await delay(25);
  }
  yield { type: 'done', data: '' };
}

// --- 真实 API ---
async function realGetSessions(): Promise<Session[]> {
  const res = await fetch(`${API_BASE}/sessions`);
  return handleResponse<Session[]>(res);
}

async function realCreateSession(): Promise<Session> {
  const res = await fetch(`${API_BASE}/sessions`, { method: 'POST' });
  return handleResponse<Session>(res);
}

async function realGetMessages(sessionId: number): Promise<Message[]> {
  const res = await fetch(`${API_BASE}/sessions/${sessionId}/messages`);
  return handleResponse<Message[]>(res);
}

async function realDeleteSession(sessionId: number): Promise<void> {
  const res = await fetch(`${API_BASE}/sessions/${sessionId}`, { method: 'DELETE' });
  await handleResponse<{ ok?: boolean }>(res);
}

async function realUpdateSession(sessionId: number, title: string): Promise<Session> {
  const res = await fetch(`${API_BASE}/sessions/${sessionId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title }),
  });
  return handleResponse<Session>(res);
}

async function* realStreamChat(
  sessionId: number | null,
  message: string,
  thinkingMode: boolean
): AsyncGenerator<StreamChunk> {
  let res: Response;
  try {
    res = await fetch(`${API_BASE}/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ session_id: sessionId, message, thinking_mode: thinkingMode }),
    });
  } catch (e) {
    if (e instanceof TypeError && e.message.includes('fetch')) {
      throw new Error('网络连接失败，请检查后端是否已启动');
    }
    throw e;
  }
  if (!res.ok) {
    const text = await res.text();
    let body: unknown = null;
    try {
      body = text ? JSON.parse(text) : null;
    } catch {
      body = text;
    }
    throw new Error(getErrorMessage(res, body));
  }
  const reader = res.body?.getReader();
  if (!reader) throw new Error('无法读取响应流');
  const decoder = new TextDecoder();
  let buffer = '';
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() ?? '';
    for (const line of lines) {
      if (line.startsWith('data: ')) {
        const json = line.slice(6);
        if (json === '[DONE]') continue;
        try {
          const obj = JSON.parse(json);
          if (obj.type) {
            yield { type: obj.type, data: obj.data ?? '' };
          }
        } catch {
          // ignore
        }
      }
    }
  }
}

// --- 对外 API ---
export const api = {
  getSessions: () => (USE_MOCK ? mockGetSessions() : realGetSessions()),
  createSession: () => (USE_MOCK ? mockCreateSession() : realCreateSession()),
  getMessages: (id: number) => (USE_MOCK ? mockGetMessages(id) : realGetMessages(id)),
  deleteSession: (id: number) => (USE_MOCK ? mockDeleteSession(id) : realDeleteSession(id)),
  updateSession: (id: number, title: string) =>
    USE_MOCK ? mockUpdateSession(id, title) : realUpdateSession(id, title),
  streamChat: (sessionId: number | null, message: string, thinkingMode: boolean) =>
    USE_MOCK ? mockStreamChat(sessionId, message, thinkingMode) : realStreamChat(sessionId, message, thinkingMode),
};

