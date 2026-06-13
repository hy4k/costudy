import React, { useState } from 'react';
import { Icons } from '../Icons';
import { CoStudyLogo } from '../CoStudyLogo';
import { authService } from '../../services/fetsService';

interface LoginProps {
  onLogin: () => void | Promise<void>;
  onSwitch: () => void;
  onBack?: () => void;
}

export const Login: React.FC<LoginProps> = ({ onLogin, onSwitch, onBack }) => {
  const [view, setView] = useState<'LOGIN' | 'FORGOT'>('LOGIN');
  const [loginType, setLoginType] = useState<'STUDENT' | 'TEACHER'>('STUDENT');
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const isMentor = loginType === 'TEACHER';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccess(null);
    try {
      if (view === 'LOGIN') {
        await authService.signIn(email, password);
        await Promise.resolve(onLogin());
      } else {
        await authService.resetPassword(email);
        setSuccess('Recovery link sent — check your inbox (and spam folder).');
      }
    } catch (err: any) {
      setError(err.message || 'Action failed. Please verify your details.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={`login${isMentor ? ' login-mentor' : ''}`}>
      {/* Ambient glow orbs */}
      <div className="login-glow one" aria-hidden="true" />
      <div className="login-glow two" aria-hidden="true" />

      <div className="login-card">
        {/* ── Brand side ── */}
        <div className="login-brand">
          <div className="login-logo">
            <CoStudyLogo size="sm" />
          </div>

          <div className="login-brand-mid">
            <h1 className="login-headline font-display">
              Never study <em>alone</em> again.
            </h1>
            <p className="login-sub">
              {isMentor
                ? 'Your staff room, essay queue, and mentees — one desk.'
                : 'Your wall, your room, your people — one place to pass the CMA.'}
            </p>

            {/* Social proof ticker */}
            <div className="login-ticker">
              <div className="ticker-row">
                <span className="ticker-dot" />
                <strong>2,400+</strong>
                <span>CMA candidates active today</span>
              </div>
              <div className="ticker-row">
                <span className="ticker-dot" />
                <strong>94%</strong>
                <span>first-attempt pass rate on CoStudy</span>
              </div>
            </div>
          </div>

          <p className="login-brand-foot">The CMA-US social learning universe</p>
        </div>

        {/* ── Form side ── */}
        <div className="login-form-side">
          {/* Student / Mentor toggle */}
          <div className="login-toggle" role="tablist" aria-label="Account type">
            <span className={`login-toggle-thumb${isMentor ? ' right' : ''}`} aria-hidden="true" />
            <button
              type="button"
              role="tab"
              aria-selected={!isMentor}
              className={!isMentor ? 'on' : ''}
              onClick={() => { setLoginType('STUDENT'); setError(null); setSuccess(null); }}
            >
              Student
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={isMentor}
              className={isMentor ? 'on' : ''}
              onClick={() => { setLoginType('TEACHER'); setError(null); setSuccess(null); }}
            >
              Mentor
            </button>
          </div>

          <h2 className="login-form-title font-display">
            {view === 'FORGOT'
              ? 'Reset your password'
              : isMentor
                ? 'Welcome back, mentor'
                : 'Welcome back'}
          </h2>
          <p className="login-form-sub">
            {view === 'FORGOT'
              ? "We'll send a recovery link to your email"
              : isMentor
                ? 'Sign in to the staff room'
                : 'Sign in to your study wall'}
          </p>

          {/* Error / success banners */}
          {error && (
            <div style={{
              marginBottom: 16,
              padding: '11px 16px',
              borderRadius: 14,
              background: 'var(--accent-soft)',
              border: '1.5px solid var(--accent-line)',
              color: 'var(--accent-deep)',
              fontSize: '0.82rem',
              fontWeight: 700,
            }}>
              {error}
            </div>
          )}
          {success && (
            <div style={{
              marginBottom: 16,
              padding: '11px 16px',
              borderRadius: 14,
              background: '#ecfdf5',
              border: '1.5px solid #d1fae5',
              color: '#065f46',
              fontSize: '0.82rem',
              fontWeight: 700,
            }}>
              {success}
            </div>
          )}

          <form className="login-form" onSubmit={handleSubmit}>
            <label className="field">
              <span className="field-label">Email</span>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={isMentor ? 'you@institute.edu' : 'you@example.com'}
                autoComplete="email"
              />
            </label>

            {view === 'LOGIN' && (
              <label className="field">
                <span className="field-label">Password</span>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  autoComplete="current-password"
                />
              </label>
            )}

            {view === 'LOGIN' && (
              <div className="login-row">
                <span />
                <button
                  type="button"
                  className="login-link"
                  onClick={() => { setView('FORGOT'); setError(null); setSuccess(null); }}
                >
                  Forgot password?
                </button>
              </div>
            )}

            <button type="submit" className="login-cta" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Icons.CloudSync className="w-4 h-4" style={{ animation: 'spin 0.9s linear infinite' }} />
                  {view === 'LOGIN' ? 'Signing in…' : 'Sending…'}
                </>
              ) : view === 'LOGIN' ? (
                <>
                  {isMentor ? 'Enter the staff room' : 'Enter your wall'}
                  <Icons.Plus className="w-4 h-4" style={{ transform: 'rotate(180deg) translateX(2px)' }} />
                </>
              ) : (
                'Send recovery link'
              )}
            </button>

            {view === 'FORGOT' && (
              <button
                type="button"
                className="login-link"
                style={{ textAlign: 'center', marginTop: 4 }}
                onClick={() => { setView('LOGIN'); setError(null); setSuccess(null); }}
              >
                ← Back to sign in
              </button>
            )}
          </form>

          <p className="login-foot">
            New here?{' '}
            <button type="button" className="login-link strong" onClick={onSwitch}>
              Create an account
            </button>
          </p>

          {onBack && (
            <p className="login-foot" style={{ marginTop: 8 }}>
              <button type="button" className="login-link" onClick={onBack}>
                ← Back to CoStudy
              </button>
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
