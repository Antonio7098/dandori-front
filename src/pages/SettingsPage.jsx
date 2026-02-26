import { Sun, Moon } from 'lucide-react';
import { PageLayout, PageHeader, PageSection } from '../components/layout';
import { useTheme } from '../context/ThemeContext';
import styles from './SettingsPage.module.css';

export default function SettingsPage() {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <PageLayout>
      <PageHeader
        title="Settings"
        description="Tune how Dandori feels and behaves for you."
      />

      <PageSection
        title="Appearance"
        description="Switch between light and dark themes."
      >
        <div className={styles.settingRow}>
          <div className={styles.settingCopy}>
            <h3>Theme</h3>
            <p>{isDark ? 'Dark mode' : 'Light mode'} keeps the interface comfortable in any lighting.</p>
          </div>
          <button
            type="button"
            className={`${styles.themeToggle} ${isDark ? styles.active : ''}`}
            onClick={toggleTheme}
            aria-label={`Switch to ${isDark ? 'light' : 'dark'} theme`}
          >
            <span className={styles.icon}>
              <Sun size={18} />
            </span>
            <span className={styles.icon}>
              <Moon size={18} />
            </span>
            <span className={styles.knob} />
          </button>
        </div>
      </PageSection>
    </PageLayout>
  );
}
