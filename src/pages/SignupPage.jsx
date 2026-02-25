import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, Lock, Sparkles, ArrowRight } from 'lucide-react';
import { Button, Input, Card, CardContent } from '../components/ui';
import { authApi } from '../services/api';
import styles from './LoginPage.module.css';

export default function SignupPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setIsLoading(true);
    try {
      const response = await authApi.signup({ email, password });
      setSuccess(response.message || 'Account created! Check your email to verify.');
      setTimeout(() => navigate('/login'), 1500);
    } catch (err) {
      setError(err.message || 'Signup failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.background}>
        <div className={styles.pattern} />
        <div className={styles.gradient} />
      </div>

      <motion.div
        className={styles.container}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Link to="/" className={styles.logo}>
          <div className={styles.logoIcon}>
            <Sparkles size={28} />
          </div>
          <span className={styles.logoText}>School of Dandori</span>
        </Link>

        <Card variant="elevated" padding="lg" className={styles.card}>
          <CardContent>
            <div className={styles.header}>
              <h1 className={styles.title}>Create your account</h1>
              <p className={styles.subtitle}>Join the School of Dandori community</p>
            </div>

            <form onSubmit={handleSubmit} className={styles.form}>
              <Input
                label="Email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                icon={<Mail size={18} />}
                required
              />

              <Input
                label="Password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Create a password"
                icon={<Lock size={18} />}
                required
              />

              <Input
                label="Confirm Password"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter your password"
                icon={<Lock size={18} />}
                required
              />

              {error && (
                <motion.p
                  className={styles.error}
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  {error}
                </motion.p>
              )}

              {success && (
                <motion.p
                  className={styles.success}
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  {success}
                </motion.p>
              )}

              <Button
                type="submit"
                variant="whimsical"
                size="lg"
                fullWidth
                isLoading={isLoading}
                icon={<ArrowRight size={18} />}
                iconPosition="right"
              >
                Sign Up
              </Button>
            </form>

            <p className={styles.signupPrompt}>
              Already have an account?{' '}
              <Link to="/login" className={styles.signupLink}>
                Sign in
              </Link>
            </p>
          </CardContent>
        </Card>
      </motion.div>

      <div className={styles.decorations} aria-hidden="true">
        <div className={styles.floatingLeaf1} />
        <div className={styles.floatingLeaf2} />
        <div className={styles.floatingCircle1} />
        <div className={styles.floatingCircle2} />
      </div>
    </div>
  );
}
