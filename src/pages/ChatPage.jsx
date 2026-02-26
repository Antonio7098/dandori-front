import { useEffect } from 'react';
import { PageLayout } from '../components/layout';
import { ChatExperience } from '../components/chat';
import { useChatStore } from '../stores/useStore';
import styles from './ChatPage.module.css';

export default function ChatPage() {
  const { setFullPage, closeChat } = useChatStore();

  useEffect(() => {
    setFullPage(true);
    closeChat();
  }, [setFullPage, closeChat]);

  return (
    <PageLayout fullWidth fullHeight className={styles.pageLayout}>
      <div className={styles.chatViewport}>
        <ChatExperience variant="page" showFrameControls={false} isFullPageMode />
      </div>
    </PageLayout>
  );
}
