import { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import type { Message } from '../types';
import styles from './ChatMessage.module.css';

interface ChatMessageProps {
  message: Message;
  isStreaming?: boolean;
}

export function ChatMessage({ message, isStreaming = false }: ChatMessageProps) {
  const [reasoningExpanded, setReasoningExpanded] = useState(false);
  const hasReasoning = !!message.reasoning_content?.trim();

  if (message.role === 'user') {
    return (
      <div className={styles.userRow}>
        <div className={styles.userBubble}>{message.content}</div>
      </div>
    );
  }

  if (message.role === 'assistant') {
    return (
      <div className={styles.assistantRow}>
        <div className={styles.assistantBubble}>
          {hasReasoning && (
            <div className={styles.reasoning}>
              <button
                type="button"
                className={styles.reasoningToggle}
                onClick={() => setReasoningExpanded(!reasoningExpanded)}
              >
                {reasoningExpanded ? '▼' : '▶'} 思考过程
              </button>
              {reasoningExpanded && (
                <pre className={styles.reasoningContent}>{message.reasoning_content}</pre>
              )}
            </div>
          )}
          <div className={styles.content}>
            <ReactMarkdown>{message.content || ''}</ReactMarkdown>
            {isStreaming && <span className={styles.cursor} />}
          </div>
        </div>
      </div>
    );
  }

  return null;
}
