import { useState, useRef, useEffect } from 'react';
import styles from './ChatInput.module.css';

interface ChatInputProps {
  onSend: (text: string) => void;
  disabled?: boolean;
  thinkingMode: boolean;
  onThinkingModeChange: (v: boolean) => void;
}

export function ChatInput({
  onSend,
  disabled,
  thinkingMode,
  onThinkingModeChange,
}: ChatInputProps) {
  const [text, setText] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSubmit = () => {
    const t = text.trim();
    if (!t || disabled) return;
    onSend(t);
    setText('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  useEffect(() => {
    const ta = textareaRef.current;
    if (ta) {
      ta.style.height = 'auto';
      ta.style.height = `${Math.min(ta.scrollHeight, 160)}px`;
    }
  }, [text]);

  return (
    <div className={styles.wrapper}>
      <div className={styles.toolbar}>
        <label className={styles.toggle}>
          <input
            type="checkbox"
            checked={thinkingMode}
            onChange={(e) => onThinkingModeChange(e.target.checked)}
          />
          <span>思考模式</span>
        </label>
      </div>
      <div className={styles.inputRow}>
        <textarea
          ref={textareaRef}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="输入消息... (Enter 发送, Shift+Enter 换行)"
          rows={1}
          disabled={disabled}
          className={styles.textarea}
        />
        <button
          type="button"
          onClick={handleSubmit}
          disabled={disabled || !text.trim()}
          className={styles.sendBtn}
        >
          发送
        </button>
      </div>
    </div>
  );
}
