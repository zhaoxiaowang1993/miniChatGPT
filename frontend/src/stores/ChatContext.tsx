import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import { api } from '../services/api';
import type { Session, Message } from '../types';

interface ChatState {
  sessions: Session[];
  currentSession: Session | null;
  messages: Message[];
  thinkingMode: boolean;
  loadingMessages: boolean;
  loadError: string | null;
}

interface ChatContextValue extends ChatState {
  clearLoadError: () => void;
  reportError: (msg: string) => void;
  setThinkingMode: (v: boolean) => void;
  selectSession: (s: Session | null) => void;
  addUserMessage: (msg: Message) => void;
  addAssistantMessage: (msg: Partial<Message> & { content: string }) => void;
  updateStreamingMessage: (content: string, reasoning_content?: string) => void;
  refreshSessions: () => Promise<void>;
  createSession: () => Promise<Session | undefined>;
  deleteSession: (id: number) => Promise<void>;
  updateSessionTitle: (id: number, title: string) => Promise<void>;
  updateSessionTitleInPlace: (id: number, title: string) => void;
}

const ChatContext = createContext<ChatContextValue | null>(null);

export function ChatProvider({ children }: { children: React.ReactNode }) {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [currentSession, setCurrentSession] = useState<Session | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [thinkingMode, setThinkingMode] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const streamingIdRef = useRef<number | null>(null);

  const refreshSessions = useCallback(async () => {
    try {
      setLoadError(null);
      const list = await api.getSessions();
      setSessions(list);
    } catch (e) {
      setLoadError(e instanceof Error ? e.message : '加载会话列表失败');
    }
  }, []);

  const loadMessages = useCallback(async (session: Session | null) => {
    if (!session) {
      setMessages([]);
      setLoadError(null);
      return;
    }
    setLoadingMessages(true);
    setLoadError(null);
    try {
      const msgs = await api.getMessages(session.id);
      setMessages(msgs);
    } catch (e) {
      setLoadError(e instanceof Error ? e.message : '加载消息失败');
      setMessages([]);
    } finally {
      setLoadingMessages(false);
    }
  }, []);

  const clearLoadError = useCallback(() => setLoadError(null), []);
  const reportError = useCallback((msg: string) => setLoadError(msg), []);

  const selectSession = useCallback(
    (s: Session | null) => {
      setCurrentSession(s);
      loadMessages(s);
    },
    [loadMessages]
  );

  const addUserMessage = useCallback((msg: Message) => {
    setMessages((prev) => [...prev, msg]);
  }, []);

  const addAssistantMessage = useCallback<
    (msg: Partial<Message> & { content: string }) => void
  >((msg) => {
    setMessages((prev) => {
      const last = prev[prev.length - 1];
      if (last?.role === 'assistant') {
        return [...prev.slice(0, -1), { ...last, ...msg } as Message];
      }
      const full: Message = {
        id: msg.id ?? Date.now(),
        session_id: msg.session_id ?? currentSession?.id ?? 0,
        role: 'assistant',
        content: msg.content,
        reasoning_content: msg.reasoning_content,
        created_at: msg.created_at ?? new Date().toISOString(),
      };
      return [...prev, full];
    });
    streamingIdRef.current = null;
  }, [currentSession?.id]);

  const updateStreamingMessage = useCallback((content: string, reasoning_content?: string) => {
    const sid = streamingIdRef.current;
    setMessages((prev) => {
      const last = prev[prev.length - 1];
      if (last?.role === 'assistant' && sid !== null && last.id === sid) {
        return [...prev.slice(0, -1), { ...last, content, reasoning_content }];
      }
      const id = Date.now();
      streamingIdRef.current = id;
      return [
        ...prev,
        {
          id,
          session_id: currentSession?.id ?? 0,
          role: 'assistant' as const,
          content,
          reasoning_content,
          created_at: new Date().toISOString(),
        },
      ];
    });
  }, [currentSession?.id]);

  const createSession = useCallback(async () => {
    const s = await api.createSession();
    setSessions((prev) => [s, ...prev]);
    setCurrentSession(s);
    setMessages([]);
    return s;
  }, []);

  const deleteSession = useCallback(async (id: number) => {
    await api.deleteSession(id);
    setSessions((prev) => prev.filter((s) => s.id !== id));
    if (currentSession?.id === id) {
      setCurrentSession(null);
      setMessages([]);
    }
  }, [currentSession?.id]);

  const updateSessionTitle = useCallback(async (id: number, title: string) => {
    const s = await api.updateSession(id, title);
    setSessions((prev) => prev.map((x) => (x.id === id ? s : x)));
    if (currentSession?.id === id) setCurrentSession(s);
  }, [currentSession?.id]);

  const updateSessionTitleInPlace = useCallback((id: number, title: string) => {
    setSessions((prev) =>
      prev.map((x) => (x.id === id ? { ...x, title, updated_at: new Date().toISOString() } : x))
    );
    if (currentSession?.id === id) {
      setCurrentSession((prev) => (prev ? { ...prev, title, updated_at: new Date().toISOString() } : null));
    }
  }, [currentSession?.id]);

  useEffect(() => {
    refreshSessions();
  }, [refreshSessions]);

  const value: ChatContextValue = {
    sessions,
    currentSession,
    messages,
    thinkingMode,
    loadingMessages,
    loadError,
    clearLoadError,
    reportError,
    setThinkingMode,
    selectSession,
    addUserMessage,
    addAssistantMessage,
    updateStreamingMessage,
    refreshSessions,
    createSession,
    deleteSession,
    updateSessionTitle,
    updateSessionTitleInPlace,
  };

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
}

export function useChat() {
  const ctx = useContext(ChatContext);
  if (!ctx) throw new Error('useChat must be used within ChatProvider');
  return ctx;
}
