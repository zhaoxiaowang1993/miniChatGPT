import { useState, useCallback } from 'react';
import { api } from '../services/api';
import type { Message, StreamChunk } from '../types';

interface UseStreamChatOptions {
  sessionId: number | null;
  thinkingMode: boolean;
  onUserMessage: (msg: Message) => void;
  onAssistantMessage: (msg: Partial<Message> & { content: string; reasoning_content?: string }) => void;
  onStreamChunk: (chunk: StreamChunk, reasoning: string, content: string) => void;
  onSessionTitle?: (sessionId: number, title: string) => void;
}

export function useStreamChat({
  sessionId,
  thinkingMode,
  onUserMessage,
  onAssistantMessage,
  onStreamChunk,
  onSessionTitle,
}: UseStreamChatOptions) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const send = useCallback(
    async (text: string, sessionIdOverride?: number | null) => {
      if (!text.trim()) return;
      setIsLoading(true);
      setError(null);

      const userMsg: Message = {
        id: Date.now(),
        session_id: sessionId ?? 0,
        role: 'user',
        content: text.trim(),
        created_at: new Date().toISOString(),
      };
      onUserMessage(userMsg);

      let reasoning = '';
      let content = '';

      try {
        const sid = sessionIdOverride ?? sessionId;
      const gen = api.streamChat(sid, text.trim(), thinkingMode);
        for await (const chunk of gen) {
          if (chunk.type === 'reasoning') {
            reasoning += chunk.data;
          } else if (chunk.type === 'content') {
            content += chunk.data;
          } else if (chunk.type === 'session_title' && onSessionTitle && sid) {
            onSessionTitle(sid, chunk.data);
          }
          onStreamChunk(chunk, reasoning, content);
        }
        onAssistantMessage({
          content,
          reasoning_content: reasoning || undefined,
          session_id: sessionId ?? 0,
          role: 'assistant',
          created_at: new Date().toISOString(),
        });
      } catch (e) {
        const msg = e instanceof Error ? e.message : '发送失败';
        setError(msg);
        onAssistantMessage({
          content: `[错误] ${msg}`,
          session_id: sessionId ?? 0,
          role: 'assistant',
          created_at: new Date().toISOString(),
        });
      } finally {
        setIsLoading(false);
      }
    },
    [sessionId, thinkingMode, onUserMessage, onAssistantMessage, onStreamChunk, onSessionTitle]
  );

  return { send, isLoading, error };
}
