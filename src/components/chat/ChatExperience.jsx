import { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  X,
  Send,
  Maximize2,
  Minimize2,
  Sparkles,
  Bot,
  Loader2,
  Hammer,
  CheckCircle2,
  AlertTriangle,
  ChevronDown,
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { useChatStore, useUserStore } from '../../stores/useStore';
import { chatApi } from '../../services/api';
import { Button, Avatar } from '../ui';
import CourseArtifact from './CourseArtifact';
import styles from './ChatPanel.module.css';

const messageVariants = {
  hidden: { opacity: 0, y: 10, scale: 0.95 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { type: 'spring', stiffness: 300, damping: 25 },
  },
};

const formatToolName = (name = '') =>
  name
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');

const extractToolQuery = (event = {}) => {
  const args = event.arguments || {};
  const candidates = [args.query, args.value];

  for (const candidate of candidates) {
    if (typeof candidate === 'string' && candidate.trim()) {
      return candidate.trim();
    }
  }

  if (args.filters && typeof args.filters === 'object') {
    const entry = Object.entries(args.filters).find(([, value]) => {
      if (Array.isArray(value)) {
        return value.some((item) => item !== undefined && item !== null && item !== '');
      }
      return value !== undefined && value !== null && value !== '';
    });

    if (entry) {
      const [key, value] = entry;
      if (Array.isArray(value)) {
        return `${key}: ${value.filter(Boolean).join(', ')}`;
      }
      return `${key}: ${value}`;
    }
  }

  return '';
};

const suggestedPrompts = [
  'Find me a relaxing weekend class',
  'What pottery courses are available?',
  'Show me classes under £50',
  'Recommend something creative for beginners',
];

export default function ChatExperience({
  variant = 'panel',
  showFrameControls = true,
  isFullPageMode = false,
  onToggleFullPage,
  onClose,
  showToolEvents = false,
}) {
  const [input, setInput] = useState('');
  const [expandedToolEvents, setExpandedToolEvents] = useState({});
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const {
    isOpen,
    messages,
    addMessage,
    updateMessage,
    isLoading,
    setLoading,
    artifacts,
    addArtifact,
    clearArtifacts,
    toolEvents,
    addToolEvent,
    updateToolEvent,
    clearToolEvents,
  } = useChatStore();
  const { user } = useUserStore();

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    const shouldFocus = variant === 'panel' ? isOpen : true;
    if (shouldFocus && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen, variant]);

  const toggleToolEvent = (eventId) => {
    if (!eventId) return;
    setExpandedToolEvents((prev) => ({
      ...prev,
      [eventId]: !prev[eventId],
    }));
  };

  const normalizeCourses = (event = {}) => {
    const result = event?.result || {};
    const sqlCourses = Array.isArray(result.courses)
      ? result.courses
      : result.course
        ? [result.course]
        : [];

    if (sqlCourses.length > 0) {
      return sqlCourses
        .map((course) => {
          const normalized = course?.course || course;
          if (!normalized || typeof normalized !== 'object') return null;
          const courseId = normalized.id || normalized.course_id || normalized.courseId;
          if (courseId && !normalized.id) {
            return { ...normalized, id: courseId };
          }
          return normalized;
        })
        .filter(Boolean);
    }

    const metadatas = Array.isArray(result.metadatas) ? result.metadatas : [];
    if (metadatas.length === 0) return [];

    const metadataRows = Array.isArray(metadatas[0]) ? metadatas[0] : metadatas;
    const ids = result.ids;
    const idRows = Array.isArray(ids?.[0]) ? ids[0] : ids;
    const distances = result.distances;
    const distanceRows = Array.isArray(distances?.[0]) ? distances[0] : distances;

    return metadataRows
      .map((meta, index) => {
        if (!meta || typeof meta !== 'object') return null;
        const courseId = meta.course_id || meta.id || idRows?.[index];
        return {
          title: meta.title || meta.class_id || `Match ${index + 1}`,
          instructor: meta.instructor,
          location: meta.location,
          course_id: courseId,
          id: courseId || `semantic-${event.id || 'event'}-${index}`,
          _distance: distanceRows?.[index],
          _source: meta.source,
        };
      })
      .filter(Boolean);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput('');

    const historyPayload = messages
      .filter((msg) => ['user', 'assistant', 'system'].includes(msg.role))
      .slice(-10)
      .map(({ role, content }) => ({ role, content }));

    addMessage({ role: 'user', content: userMessage });
    setLoading(true);
    clearToolEvents();
    clearArtifacts();

    const assistantMessage = addMessage({
      role: 'assistant',
      content: '',
      isStreaming: true,
    });

    try {
      let finalReceived = false;
      const profileContext = {
        ...(user?.name ? { name: user.name } : {}),
        ...(user?.bio ? { bio: user.bio } : {}),
      };
      for await (const { event, data } of chatApi.streamChat({
        message: userMessage,
        history: historyPayload,
        profile: profileContext,
      })) {
        switch (event) {
          case 'text_delta': {
            if (!assistantMessage?.id) break;
            updateMessage(assistantMessage.id, (prev) => ({
              content: `${prev.content || ''}${data?.delta || ''}`,
            }));
            break;
          }
          case 'tool_call': {
            addToolEvent({
              ...data,
              status: 'running',
              messageId: assistantMessage.id,
            });
            break;
          }
          case 'tool_result': {
            updateToolEvent(data?.id, {
              status: data?.result?.error ? 'error' : 'completed',
              result: data?.result,
            });
            break;
          }
          case 'error': {
            updateMessage(assistantMessage.id, {
              isError: true,
              isStreaming: false,
              content:
                data?.error ||
                'I ran into an issue while processing that request.',
            });
            addToolEvent({
              id: data?.id || Date.now(),
              name: data?.name || 'error',
              status: 'error',
              error: data?.error,
              messageId: assistantMessage.id,
            });
            finalReceived = true;
            break;
          }
          case 'message_end': {
            updateMessage(assistantMessage.id, {
              content:
                data?.message || messages.find((m) => m.id === assistantMessage.id)?.content || '',
              isStreaming: false,
              metadata: {
                mode: data?.mode,
                model: data?.model,
              },
            });

            if (Array.isArray(data?.artifacts)) {
              data.artifacts.forEach((artifact) => addArtifact(artifact));
            }

            finalReceived = true;
            break;
          }
          default:
            break;
        }

        if (finalReceived) {
          break;
        }
      }

      if (!finalReceived) {
        const fallback = await chatApi.sendMessage({
          message: userMessage,
          history: historyPayload,
          profile: profileContext,
        });
        updateMessage(assistantMessage.id, {
          content: fallback.message,
          isStreaming: false,
        });
        if (Array.isArray(fallback?.artifacts)) {
          fallback.artifacts.forEach((artifact) => addArtifact(artifact));
        }
      }
    } catch (error) {
      updateMessage(assistantMessage.id, {
        role: 'assistant',
        content:
          error.message ||
          'I apologize, but I encountered an issue. Please try again.',
        isError: true,
        isStreaming: false,
      });
    } finally {
      setLoading(false);
    }
  };

  const experienceClasses = [
    styles.chatExperience,
    variant === 'page' ? styles.chatExperiencePage : '',
    variant === 'page' ? styles.chatExperienceFullHeight : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={experienceClasses}>
      <header className={styles.header}>
        <div className={styles.headerLeft}>
          <div className={styles.botAvatar}>
            <Sparkles size={20} />
          </div>
          <div className={styles.headerText}>
            <h2 className={styles.headerTitle}>Dandori Assistant</h2>
            <span className={styles.headerStatus}>
              <span className={styles.statusDot} />
              Ready to help
            </span>
          </div>
        </div>

        {showFrameControls && (
          <div className={styles.headerActions}>
            {onToggleFullPage && (
              <button
                className={styles.iconButton}
                onClick={onToggleFullPage}
                aria-label={isFullPageMode ? 'Minimize' : 'Maximize'}
              >
                {isFullPageMode ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
              </button>
            )}
            {onClose && (
              <button
                className={styles.iconButton}
                onClick={onClose}
                aria-label="Close chat"
              >
                <X size={18} />
              </button>
            )}
          </div>
        )}
      </header>

      <div className={styles.content}>
        <div className={styles.messagesContainer}>
          {messages.length === 0 ? (
            <div className={styles.welcome}>
              <div className={styles.welcomeIcon}>
                <Sparkles size={40} />
              </div>
              <h3 className={styles.welcomeTitle}>Welcome to Dandori</h3>
              <p className={styles.welcomeText}>
                I'm here to help you discover the perfect course for your journey of joy and wellbeing. Ask me anything!
              </p>

              <div className={styles.suggestions}>
                {suggestedPrompts.map((prompt, index) => (
                  <motion.button
                    key={prompt}
                    className={styles.suggestionChip}
                    onClick={() => setInput(prompt)}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 * index }}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    {prompt}
                  </motion.button>
                ))}
              </div>
            </div>
          ) : (
            <div className={styles.messages}>
              {messages.map((message, index) => (
                <motion.div
                  key={message.id || index}
                  className={`${styles.message} ${styles[message.role]}`}
                  variants={messageVariants}
                  initial="hidden"
                  animate="visible"
                >
                  <div className={styles.messageAvatar}>
                    {message.role === 'user' ? (
                      <Avatar name="You" size="sm" />
                    ) : (
                      <div className={styles.botMessageAvatar}>
                        <Sparkles size={16} />
                      </div>
                    )}
                  </div>
                  <div className={styles.messageBody}>
                    {showToolEvents &&
                      message.role === 'assistant' &&
                      toolEvents.some((event) => event.messageId === message.id) && (
                        <div className={styles.toolCallStack}>
                          {toolEvents
                            .filter((event) => event.messageId === message.id)
                            .map((event) => {
                              const queryText = extractToolQuery(event);
                              const courses = normalizeCourses(event).slice(0, 10);
                              const hasCourses = courses.length > 0;
                              const isExpanded = !!expandedToolEvents[event.id];
                              const bubbleIsInteractive = hasCourses;

                              return (
                                <div
                                  key={event.id}
                                  className={`${styles.messageBubble} ${styles.toolBubble} ${
                                    isExpanded ? styles.toolBubbleExpanded : ''
                                  }`}
                                >
                                  <button
                                    type="button"
                                    className={styles.toolBubbleHeader}
                                    onClick={() => bubbleIsInteractive && toggleToolEvent(event.id)}
                                    disabled={!bubbleIsInteractive}
                                    aria-expanded={bubbleIsInteractive ? isExpanded : undefined}
                                    aria-controls={
                                      bubbleIsInteractive ? `tool-results-${event.id}` : undefined
                                    }
                                  >
                                    <div className={styles.toolCallIcon}>
                                      {event.status === 'completed' && <CheckCircle2 size={16} />}
                                      {event.status === 'error' && <AlertTriangle size={16} />}
                                      {!event.status || event.status === 'running' ? (
                                        <Hammer size={16} />
                                      ) : null}
                                    </div>
                                    <div className={styles.toolBubbleSummary}>
                                      <p className={styles.toolCallName}>{formatToolName(event.name)}</p>
                                      {queryText && (
                                        <p className={styles.toolCallQuery}>{queryText}</p>
                                      )}
                                      {hasCourses && (
                                        <p className={styles.toolCallMeta}>
                                          {courses.length} course{courses.length !== 1 ? 's' : ''} found
                                        </p>
                                      )}
                                    </div>
                                    {bubbleIsInteractive && (
                                      <ChevronDown
                                        size={16}
                                        className={`${styles.toolBubbleChevron} ${
                                          isExpanded ? styles.expanded : ''
                                        }`}
                                      />
                                    )}
                                  </button>

                                  {isExpanded && hasCourses && (
                                    <ul
                                      className={styles.toolResultsList}
                                      id={`tool-results-${event.id}`}
                                    >
                                      {courses.map((course, courseIndex) => {
                                        const linkableId = course?.course_id || course?.id;
                                        const itemKey = linkableId || `${event.id}-${course.id || courseIndex}`;
                                        const label = course?.title || 'Untitled match';
                                        return (
                                          <li key={itemKey} className={styles.toolResultItem}>
                                            {linkableId ? (
                                              <Link
                                                to={`/courses/${linkableId}`}
                                                className={styles.toolResultLink}
                                                onClick={(e) => e.stopPropagation()}
                                              >
                                                {label}
                                              </Link>
                                            ) : (
                                              <div className={styles.toolResultStatic}>{label}</div>
                                            )}
                                          </li>
                                        );
                                      })}
                                    </ul>
                                  )}
                                </div>
                              );
                            })}
                        </div>
                      )}
                    <div
                      className={`${styles.messageBubble} ${
                        message.isError ? styles.error : ''
                      } ${styles[message.role]}`}
                    >
                      {message.isStreaming && !message.content ? (
                        <div className={styles.typingIndicator}>
                          <span />
                          <span />
                          <span />
                        </div>
                      ) : (
                        <ReactMarkdown className={styles.markdown} skipHtml>
                          {message.content || ''}
                        </ReactMarkdown>
                      )}
                      <span className={styles.messageTime}>
                        {new Date(message.timestamp || Date.now()).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                  </div>
                </motion.div>
              ))}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {artifacts.length > 0 && (
          <div className={styles.artifactsPanel}>
            <h4 className={styles.artifactsTitle}>Recommended Courses</h4>
            <div className={styles.artifactsList}>
              {artifacts.map((artifact) => (
                <CourseArtifact key={artifact.id} course={artifact} />
              ))}
            </div>
          </div>
        )}
      </div>

      <form className={styles.inputForm} onSubmit={handleSubmit}>
        <div className={styles.inputWrapper}>
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about courses, locations, or your interests..."
            className={styles.input}
            disabled={isLoading}
          />
          <Button
            type="submit"
            variant="primary"
            size="sm"
            disabled={!input.trim() || isLoading}
            icon={
              isLoading ? <Loader2 className={styles.spinner} size={16} /> : <Send size={16} />
            }
          >
            Send
          </Button>
        </div>
        <p className={styles.inputHint}>
          Powered by Dandori AI • Your personal course discovery assistant
        </p>
      </form>
    </div>
  );
}
