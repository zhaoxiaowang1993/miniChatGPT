import { useChat } from '../stores/ChatContext';
import styles from './SessionSidebar.module.css';

export function SessionSidebar() {
  const {
    sessions,
    currentSession,
    selectSession,
    createSession,
    deleteSession,
    reportError,
  } = useChat();

  const handleCreate = async () => {
    try {
      await createSession();
    } catch (e) {
      reportError(e instanceof Error ? e.message : '创建会话失败');
    }
  };

  const handleDelete = async (e: React.MouseEvent, id: number) => {
    e.stopPropagation();
    try {
      await deleteSession(id);
    } catch (err) {
      reportError(err instanceof Error ? err.message : '删除会话失败');
    }
  };

  return (
    <aside className={styles.sidebar}>
      <div className={styles.header}>
        <h2 className={styles.title}>MiniChatGPT</h2>
        <button type="button" className={styles.newBtn} onClick={handleCreate}>
          + 新对话
        </button>
      </div>
      <ul className={styles.list}>
        {sessions.map((s) => (
          <li key={s.id} className={styles.item}>
            <button
              type="button"
              className={`${styles.sessionBtn} ${currentSession?.id === s.id ? styles.active : ''}`}
              onClick={() => selectSession(s)}
            >
              <span className={styles.sessionTitle}>{s.title}</span>
            </button>
            <button
              type="button"
              className={styles.deleteBtn}
              onClick={(e) => handleDelete(e, s.id)}
              title="删除"
            >
              ×
            </button>
          </li>
        ))}
      </ul>
    </aside>
  );
}
