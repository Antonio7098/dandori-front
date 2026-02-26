import { motion, AnimatePresence } from 'framer-motion';
import { useChatStore } from '../../stores/useStore';
import ChatExperience from './ChatExperience';
import styles from './ChatPanel.module.css';

const panelVariants = {
  hidden: {
    x: '100%',
    opacity: 0,
  },
  visible: {
    x: 0,
    opacity: 1,
    transition: {
      type: 'spring',
      stiffness: 300,
      damping: 30,
    },
  },
  exit: {
    x: '100%',
    opacity: 0,
    transition: { duration: 0.2 },
  },
};

export default function ChatPanel() {
  const { isOpen, closeChat, isFullPage, setFullPage } = useChatStore();

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            className={styles.backdrop}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeChat}
          />

          <motion.div
            className={`${styles.panel} ${isFullPage ? styles.fullPage : ''}`}
            variants={panelVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            <ChatExperience
              variant="panel"
              showFrameControls
              isFullPageMode={isFullPage}
              onToggleFullPage={() => setFullPage(!isFullPage)}
              onClose={closeChat}
              showToolEvents
            />
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
