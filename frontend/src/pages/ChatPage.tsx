import { useRef, useEffect, useState } from 'react';
import { useChat } from '../stores/ChatContext';
import { useStreamChat } from '../hooks/useStreamChat';
import { ChatMessage } from '../components/ChatMessage';
import { ChatInput } from '../components/ChatInput';
import styles from './ChatPage.module.css';

export function ChatPage() {
  const {
    currentSession,
    messages,
    loadingMessages,
    loadError,
    clearLoadError,
    thinkingMode,
    setThinkingMode,
    addUserMessage,
    addAssistantMessage,
    updateStreamingMessage,
    createSession,
    updateSessionTitleInPlace,
  } = useChat();

  const [sendError, setSendError] = useState<string | null>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const { send, isLoading, error: streamError } = useStreamChat({
    sessionId: currentSession?.id ?? null,
    thinkingMode,
    onUserMessage: addUserMessage,
    onAssistantMessage: addAssistantMessage,
    onStreamChunk: (_, reasoning, content) => updateStreamingMessage(content, reasoning || undefined),
    onSessionTitle: (sessionId, title) => updateSessionTitleInPlace(sessionId, title),
  });

  const displayError = loadError || streamError || sendError;
  const clearError = () => {
    clearLoadError();
    setSendError(null);
  };

  useEffect(() => {
    if (streamError) setSendError(streamError);
  }, [streamError]);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (text: string) => {
    let sid: number | null = currentSession?.id ?? null;
    if (!currentSession) {
      try {
        const s = await createSession();
        sid = s ? s.id : null;
      } catch (e) {
        setSendError(e instanceof Error ? e.message : '创建会话失败');
        return;
      }
    }
    send(text, sid);
  };

  return (
    <div className={styles.page}>
      {displayError && (
        <div className={styles.errorBanner}>
          <span>{displayError}</span>
          <button type="button" className={styles.errorDismiss} onClick={clearError} aria-label="关闭">
            ×
          </button>
        </div>
      )}
      <div ref={listRef} className={styles.messageList}>
        {loadingMessages ? (
          <div className={styles.loading}>
            <span className={styles.loadingDot} />
            <span className={styles.loadingDot} />
            <span className={styles.loadingDot} />
            <span className={styles.loadingText}>加载中...</span>
          </div>
        ) : messages.length === 0 ? (
          <div className={styles.empty}>
            <p className={styles.emptyTitle}>开始新对话</p>
            <p className={styles.hint}>选择左侧会话或创建新对话后发送消息</p>
          </div>
        ) : (
          messages.map((m, i) => (
            <ChatMessage
              key={m.id}
              message={m}
              isStreaming={isLoading && i === messages.length - 1 && m.role === 'assistant'}
            />
          ))
        )}
      </div>
      <div className={styles.inputArea}>
        {isLoading && (
          <div className={styles.sending}>
            <span className={styles.sendingDot} />
            <span>AI 正在思考...</span>
          </div>
        )}
        <ChatInput
          onSend={handleSend}
          disabled={isLoading || loadingMessages}
          thinkingMode={thinkingMode}
          onThinkingModeChange={setThinkingMode}
        />
      </div>
    </div>
  );
}
