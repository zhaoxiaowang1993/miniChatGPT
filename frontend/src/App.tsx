import { ChatProvider } from './stores/ChatContext';
import { SessionSidebar } from './components/SessionSidebar';
import { ChatPage } from './pages/ChatPage';
import styles from './App.module.css';

function App() {
  return (
    <ChatProvider>
      <div className={styles.app}>
        <SessionSidebar />
        <main className={styles.main}>
          <ChatPage />
        </main>
      </div>
    </ChatProvider>
  );
}

export default App;
