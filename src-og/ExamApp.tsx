/**
 * ExamApp — Test Center Portal.
 * Aesthetic: "The Examiner's Console" — precision, authority, trust.
 * /exam                          → Proctor portal (admin dashboard)
 * /exam?center=ID&station=N      → Candidate workstation (locked exam)
 */
import React, { useState, useEffect, Suspense, lazy } from 'react';
import { examPortalAuth, examPortalSupabase } from './services/examPortalAuth';
import { Icons } from './components/Icons';

const MockTests = lazy(() =>
  import('./components/views/MockTests').then(m => ({ default: m.MockTests }))
);
const TestCenterAdmin = lazy(() =>
  import('./components/views/TestCenterAdmin').then(m => ({ default: m.TestCenterAdmin }))
);

/* ─── Global Portal Styles (injected once) ─── */
const PORTAL_CSS = `
@property --ring-angle {
  syntax: '<angle>';
  initial-value: 0deg;
  inherits: false;
}
@keyframes ring-spin { to { --ring-angle: 360deg; } }
@keyframes fade-up { from { opacity: 0; transform: translateY(18px); } to { opacity: 1; transform: translateY(0); } }
@keyframes float-y { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-7px); } }
@keyframes shimmer { to { background-position: 200% center; } }
@keyframes breathe { 0%,100% { box-shadow: 0 0 6px var(--glow,rgba(141,198,63,.2)); } 50% { box-shadow: 0 0 22px var(--glow,rgba(141,198,63,.45)); } }
@keyframes scan-line { from { transform: translateY(-100%); } to { transform: translateY(100vh); } }
@keyframes bar-fill { from { width: 0; } }
@keyframes pulse-dot { 0%,100% { opacity:.4; transform:scale(.9); } 50% { opacity:1; transform:scale(1.1); } }

.ep-up { animation: fade-up .55s cubic-bezier(.22,1,.36,1) both; }
.ep-up-1 { animation-delay:.08s; }
.ep-up-2 { animation-delay:.16s; }
.ep-up-3 { animation-delay:.24s; }
.ep-up-4 { animation-delay:.32s; }
.ep-up-5 { animation-delay:.4s; }
.ep-float { animation: float-y 5s ease-in-out infinite; }
.ep-breathe { animation: breathe 3s ease-in-out infinite; }
.ep-pulse-dot { animation: pulse-dot 2s ease-in-out infinite; }

/* Gradient ring card */
.ep-ring { position:relative; z-index:0; }
.ep-ring::before {
  content:''; position:absolute; inset:-1px; border-radius:inherit;
  background: conic-gradient(from var(--ring-angle), rgba(141,198,63,.45), transparent 25%, transparent 50%, rgba(96,165,250,.35), transparent 75%);
  animation: ring-spin 7s linear infinite; z-index:-1; pointer-events:none;
}

/* Shimmer button */
.ep-shimmer { position:relative; overflow:hidden; }
.ep-shimmer::after {
  content:''; position:absolute; top:0; left:-100%; width:60%; height:100%;
  background: linear-gradient(90deg,transparent,rgba(255,255,255,.12),transparent);
  animation: shimmer 3.5s ease-in-out infinite;
}

/* Film grain */
.ep-noise::after {
  content:''; position:fixed; inset:0; opacity:.018; pointer-events:none; z-index:9999;
  background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.8' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
}

/* Font shortcuts — premium exam portal */
.f-display { font-family:'Cormorant Garamond','Times New Roman',serif; font-weight:600; letter-spacing:-0.02em; }
.f-body { font-family:'Outfit',system-ui,sans-serif; }
.f-mono { font-family:'IBM Plex Mono',ui-monospace,monospace; }

/* Scrollbar */
.ep-scroll::-webkit-scrollbar { width:5px; }
.ep-scroll::-webkit-scrollbar-track { background:transparent; }
.ep-scroll::-webkit-scrollbar-thumb { background:rgba(255,255,255,.08); border-radius:9px; }
.ep-scroll::-webkit-scrollbar-thumb:hover { background:rgba(255,255,255,.15); }

/* Neumorphic exam auth — stronger green tint + deeper soft UI */
.ep-neu-page {
  background:
    radial-gradient(ellipse 95% 60% at 50% 100%, rgba(141, 198, 63, 0.22), transparent 55%),
    radial-gradient(ellipse 55% 50% at 15% 10%, rgba(141, 198, 63, 0.08), transparent 45%),
    radial-gradient(ellipse 50% 45% at 90% 20%, rgba(255, 255, 255, 0.35), transparent 50%),
    linear-gradient(172deg, #dfe6e0 0%, #d4ddd4 38%, #dce3db 100%);
}
.ep-neu-card {
  background: linear-gradient(148deg, #eef2ec 0%, #e8eee4 42%, #e2ebe0 100%);
  border-radius: 32px;
  box-shadow:
    22px 24px 52px rgba(95, 115, 88, 0.28),
    -18px -20px 48px rgba(255, 255, 255, 0.95),
    0 0 0 1px rgba(255, 255, 255, 0.7),
    0 0 0 2px rgba(141, 198, 63, 0.14),
    inset 0 3px 2px rgba(255, 255, 255, 0.95),
    inset 0 -2px 3px rgba(141, 198, 63, 0.1),
    0 16px 48px rgba(141, 198, 63, 0.14);
}
.ep-neu-inset {
  background: linear-gradient(168deg, #dce8d8 0%, #e4ebe1 55%, #dde6db 100%);
  color: #1e293b;
  box-shadow:
    inset 8px 9px 18px rgba(90, 110, 85, 0.35),
    inset -6px -7px 16px rgba(255, 255, 255, 0.88),
    inset 0 0 0 1px rgba(141, 198, 63, 0.12),
    inset 0 1px 0 rgba(255, 255, 255, 0.5);
}
.ep-neu-inset::placeholder { color: #94a3b8; opacity: 0.55; }
.ep-neu-inset:focus {
  outline: none;
  box-shadow:
    inset 8px 9px 18px rgba(90, 110, 85, 0.32),
    inset -6px -7px 16px rgba(255, 255, 255, 0.88),
    inset 0 0 0 1px rgba(141, 198, 63, 0.28),
    0 0 0 4px rgba(141, 198, 63, 0.28),
    0 0 36px rgba(141, 198, 63, 0.2);
}
.ep-neu-raised {
  box-shadow:
    12px 14px 28px rgba(100, 120, 95, 0.38),
    -10px -10px 24px rgba(255, 255, 255, 0.92),
    0 0 0 1px rgba(255, 255, 255, 0.6),
    0 0 0 2px rgba(141, 198, 63, 0.1),
    inset 0 2px 1px rgba(255, 255, 255, 0.85);
}
.ep-neu-raised-sm {
  box-shadow:
    6px 7px 14px rgba(100, 118, 95, 0.4),
    -5px -5px 12px rgba(255, 255, 255, 0.9),
    inset 0 1px 0 rgba(255, 255, 255, 0.75),
    0 0 0 1px rgba(141, 198, 63, 0.08);
}
.ep-neu-raised:active {
  box-shadow:
    5px 6px 14px rgba(100, 118, 95, 0.35),
    -4px -4px 10px rgba(255, 255, 255, 0.85);
}
.ep-neu-toggle-pit {
  background: linear-gradient(180deg, #c9d4c6 0%, #d6e0d3 100%);
  border-radius: 18px;
  box-shadow:
    inset 6px 6px 14px rgba(85, 105, 80, 0.38),
    inset -5px -5px 12px rgba(255, 255, 255, 0.78),
    0 2px 0 rgba(141, 198, 63, 0.12);
}
.ep-neu-toggle-active {
  background: linear-gradient(165deg, #b8e860 0%, #8dc63f 38%, #5a9018 100%);
  color: #fff;
  box-shadow:
    8px 10px 24px rgba(80, 130, 35, 0.5),
    -3px -3px 10px rgba(255, 255, 255, 0.3),
    inset 0 2px 2px rgba(255, 255, 255, 0.45),
    inset 0 -3px 8px rgba(0, 0, 0, 0.15);
  text-shadow: 0 1px 1px rgba(0, 0, 0, 0.12);
}
.ep-neu-cta {
  box-shadow:
    12px 16px 32px rgba(70, 120, 35, 0.45),
    -4px -4px 14px rgba(255, 255, 255, 0.25),
    inset 0 2px 1px rgba(255, 255, 255, 0.35),
    inset 0 -4px 10px rgba(0, 0, 0, 0.12),
    0 0 0 1px rgba(141, 198, 63, 0.25);
}
.ep-neu-cta:hover:not(:disabled) {
  box-shadow:
    14px 18px 36px rgba(70, 120, 35, 0.5),
    -4px -4px 12px rgba(255, 255, 255, 0.22),
    0 0 32px rgba(141, 198, 63, 0.35);
}
.ep-neu-icon { color: #5a8a28; filter: drop-shadow(0 1px 0 rgba(255,255,255,0.6)); }
/* Inputs: readable size, vertically centered text (16px avoids iOS zoom) */
.ep-neu-field {
  font-size: 1rem !important;
  line-height: 1.5 !important;
  min-height: 3rem;
  box-sizing: border-box;
  text-align: left !important;
  width: 100%;
  min-width: 0;
  padding-left: 3.5rem !important;
  padding-top: 0.75rem !important;
  padding-bottom: 0.75rem !important;
}
.ep-neu-field:not(.ep-neu-field--pwd) {
  padding-right: 1rem !important;
}
.ep-neu-field--pwd {
  padding-right: 3.5rem !important;
}
.ep-neu-field[type="password"],
.ep-neu-field[type="text"],
.ep-neu-field[type="email"] {
  -webkit-text-fill-color: #1e293b;
  caret-color: #3d6220;
}
/* Post-login shared shell (proctor dashboard) */
.ep-neu-app-shell {
  min-height: 100vh;
  background:
    radial-gradient(ellipse 95% 60% at 50% 100%, rgba(141, 198, 63, 0.18), transparent 55%),
    radial-gradient(ellipse 55% 50% at 15% 10%, rgba(141, 198, 63, 0.06), transparent 45%),
    linear-gradient(172deg, #dfe6e0 0%, #d4ddd4 38%, #dce3db 100%);
}
.ep-neu-panel {
  background: linear-gradient(148deg, #eef2ec 0%, #e6ebe3 48%, #e0e8de 100%);
  color: #1e293b;
  border-radius: 1rem;
  box-shadow:
    12px 14px 32px rgba(95, 115, 88, 0.22),
    -10px -12px 28px rgba(255, 255, 255, 0.9),
    inset 0 1px 0 rgba(255, 255, 255, 0.8),
    0 0 0 1px rgba(141, 198, 63, 0.12);
}
.ep-neu-topbar {
  background: linear-gradient(180deg, #f2f7ef 0%, #e4ebe1 100%);
  color: #1e293b;
  box-shadow:
    0 8px 24px rgba(95, 115, 88, 0.15),
    inset 0 1px 0 rgba(255, 255, 255, 0.9),
    0 0 0 1px rgba(141, 198, 63, 0.1);
}
`;

const ExamApp: React.FC = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [forgotMsg, setForgotMsg] = useState<string | null>(null);
  const [forgotBusy, setForgotBusy] = useState(false);

  const urlParams = new URLSearchParams(window.location.search);
  const centerId = urlParams.get('center');
  const stationNum = urlParams.get('station');
  const isCandidateMode = !!(centerId && stationNum);

  // Inject portal styles once
  useEffect(() => {
    if (!document.getElementById('ep-styles')) {
      const s = document.createElement('style');
      s.id = 'ep-styles';
      s.textContent = PORTAL_CSS;
      document.head.appendChild(s);
    }
  }, []);

  useEffect(() => {
    const init = async () => {
      try {
        const session = await examPortalAuth.getSession();
        if (session?.user) setUser(session.user);
      } catch (e) {
        console.error('Session check failed:', e);
      } finally {
        setIsLoading(false);
      }
    };
    init();

    const { data: { subscription } } = examPortalSupabase.auth.onAuthStateChange((event, session) => {
      if ((event === 'SIGNED_IN' || event === 'INITIAL_SESSION') && session?.user) {
        setUser(session.user);
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    try {
      if (localStorage.getItem('exam_auth_remember') === '1') {
        const saved = localStorage.getItem('exam_auth_email');
        if (saved) {
          setRememberMe(true);
          setEmail(saved);
        }
      }
    } catch { /* ignore */ }
  }, []);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      if (authMode === 'login') {
        await examPortalAuth.signIn(email, password);
      } else {
        await examPortalAuth.signUp(
          email,
          password,
          name || (isCandidateMode ? 'Candidate' : 'Proctor'),
          isCandidateMode ? 'STUDENT' : 'ADMIN'
        );
      }
      const session = await examPortalAuth.getSession();
      if (session?.user) {
        try {
          if (rememberMe) {
            localStorage.setItem('exam_auth_remember', '1');
            localStorage.setItem('exam_auth_email', email);
          } else {
            localStorage.removeItem('exam_auth_remember');
            localStorage.removeItem('exam_auth_email');
          }
        } catch { /* ignore */ }
        setUser(session.user);
      }
    } catch (err: any) {
      setError(err.message || 'Authentication failed');
    } finally {
      setSubmitting(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email.trim()) {
      setForgotMsg('Enter your email above first.');
      return;
    }
    setForgotBusy(true);
    setForgotMsg(null);
    try {
      await examPortalAuth.resetPassword(email.trim());
      setForgotMsg('If an account exists, check your inbox for a reset link.');
    } catch (err: any) {
      setForgotMsg(err.message || 'Could not send reset email.');
    } finally {
      setForgotBusy(false);
    }
  };

  const handleLogout = async () => {
    await examPortalAuth.signOut();
    setUser(null);
  };

  // ========================================
  // LOADING
  // ========================================
  if (isLoading) {
    return (
      <div className="ep-noise flex h-screen w-full flex-col items-center justify-center bg-[#12141c] relative overflow-hidden f-body">
        {/* Central ambient glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full bg-[#8dc63f]/[0.03] blur-[160px]" />

        <div className="ep-float mb-8">
          <div className="ep-ring w-24 h-24 rounded-[30px]">
            <div className="w-full h-full rounded-[30px] bg-[#080c18] flex items-center justify-center shadow-[0_24px_64px_rgba(0,0,0,0.6)]">
              {isCandidateMode
                ? <Icons.GraduationCap className="w-10 h-10 text-[#8dc63f] drop-shadow-[0_0_16px_rgba(141,198,63,0.5)]" />
                : <Icons.Shield className="w-10 h-10 text-[#8dc63f] drop-shadow-[0_0_16px_rgba(141,198,63,0.5)]" />}
            </div>
          </div>
        </div>

        {/* Animated loading bar */}
        <div className="w-44 h-[3px] rounded-full bg-white/[0.05] overflow-hidden">
          <div className="h-full w-2/5 rounded-full bg-gradient-to-r from-transparent via-[#8dc63f]/70 to-transparent"
            style={{ backgroundSize: '200% 100%', animation: 'shimmer 1.8s ease-in-out infinite' }} />
        </div>

        <span className="f-mono text-[10px] tracking-[0.35em] text-slate-600 uppercase mt-7 select-none">
          {isCandidateMode ? 'Initializing Station' : 'Loading Console'}
        </span>
      </div>
    );
  }

  // ========================================
  // AUTH SCREEN (centered neumorphic card)
  // ========================================
  if (!user) {
    const headline = authMode === 'login' ? 'Welcome back' : 'Create account';
    const subline = authMode === 'login'
      ? 'Please sign in to continue'
      : 'Set up access to the test center portal';

    return (
      <div className="min-h-[100dvh] min-h-screen ep-neu-page f-body flex flex-col items-center justify-center w-full overflow-x-hidden px-4 py-8 sm:px-6">
        <div className="w-full max-w-[min(100%,22rem)] sm:max-w-md mx-auto flex flex-col shrink-0">
          <header className="mb-6 w-full ep-up space-y-3 text-center">
            <div
              className="mx-auto inline-flex w-[68px] h-[68px] rounded-[24px] items-center justify-center ep-neu-raised bg-gradient-to-br from-[#f4faf2] to-[#dce8d8] text-[#4a7a1c]"
              aria-hidden
            >
              {isCandidateMode
                ? <Icons.GraduationCap className="w-8 h-8" />
                : <Icons.Shield className="w-8 h-8" />}
            </div>
            <div>
              <p className="f-mono text-[10px] tracking-[0.32em] text-[#5a7a40] uppercase">CoStudy Exam</p>
              <h1 className="f-display text-[clamp(1.85rem,4.5vw,2.5rem)] text-slate-800 leading-[1.15] mt-1.5">
                {headline}
              </h1>
              <p className="f-body text-slate-600 text-[14px] font-normal mt-2 max-w-[280px] mx-auto leading-snug">
                {subline}
              </p>
            </div>
            {isCandidateMode ? (
              <div className="mx-auto inline-flex items-center gap-2 rounded-full bg-gradient-to-b from-[#f6fcf3] to-[#e0ebd8] px-4 py-2 text-[13px] font-medium text-slate-700 ep-neu-raised-sm border border-[#8dc63f]/25">
                <span className="w-2 h-2 rounded-full bg-[#8dc63f] shadow-[0_0_12px_rgba(141,198,63,0.65)]" />
                <span className="f-mono tracking-[0.12em] text-[#3d6220]">STATION {stationNum}</span>
                <span className="text-slate-400">·</span>
                <span>Candidate</span>
              </div>
            ) : (
              <p className="f-body text-slate-600 text-sm max-w-xs mx-auto leading-snug">
                Test Center Administration
                <span className="block f-mono text-[11px] tracking-[0.2em] text-[#6b8a55] uppercase mt-1.5">Proctor Console</span>
              </p>
            )}
          </header>

          <form onSubmit={handleAuth} className="w-full max-w-full space-y-4 text-left">
            <div className="ep-neu-card p-6 sm:p-7 space-y-4 ep-up ep-up-1 w-full">
                <div className="ep-neu-toggle-pit flex p-1 gap-1">
                  {(['login', 'signup'] as const).map(mode => (
                    <button
                      key={mode}
                      type="button"
                      onClick={() => { setAuthMode(mode); setError(null); setForgotMsg(null); }}
                      className={`flex-1 py-2.5 rounded-[14px] text-sm font-semibold transition-all ${
                        authMode === mode ? 'ep-neu-toggle-active' : 'text-slate-600 hover:text-slate-800'
                      }`}
                    >
                      {mode === 'login' ? 'Sign In' : 'Sign Up'}
                    </button>
                  ))}
                </div>

                {authMode === 'signup' && (
                  <div className="ep-up ep-up-2">
                    <div className="relative flex items-center">
                      <Icons.User className="ep-neu-icon absolute left-4 z-10 w-5 h-5 pointer-events-none top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="f-body ep-neu-field w-full rounded-2xl ep-neu-inset text-slate-800"
                        required
                        autoComplete="name"
                        aria-label="Full name"
                      />
                    </div>
                  </div>
                )}

                <div className="ep-up ep-up-3">
                  <div className="relative flex items-center">
                    <Icons.Mail className="ep-neu-icon absolute left-4 z-10 w-5 h-5 pointer-events-none top-1/2 -translate-y-1/2" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="f-body ep-neu-field w-full rounded-2xl ep-neu-inset text-slate-800"
                      required
                      autoComplete="email"
                      aria-label="Email address"
                    />
                  </div>
                </div>

                <div className="ep-up ep-up-4">
                  <div className="relative flex items-center">
                    <Icons.Lock className="ep-neu-icon absolute left-4 z-10 w-5 h-5 pointer-events-none top-1/2 -translate-y-1/2" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="f-body ep-neu-field ep-neu-field--pwd w-full rounded-2xl ep-neu-inset text-slate-800"
                      required
                      minLength={6}
                      autoComplete={authMode === 'login' ? 'current-password' : 'new-password'}
                      aria-label="Password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((v) => !v)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ep-neu-raised-sm bg-gradient-to-b from-[#eef5ea] to-[#dce8d8] hover:from-[#e8f2e3] hover:to-[#d4e4cf]"
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      <Icons.Eye className="w-5 h-5 text-[#4a7a1c]" />
                    </button>
                  </div>
                </div>

                {authMode === 'login' && (
                  <div className="flex items-center justify-between gap-3 text-xs pt-1">
                    <label className="flex items-center gap-2 cursor-pointer text-slate-600 select-none">
                      <input
                        type="checkbox"
                        checked={rememberMe}
                        onChange={(e) => setRememberMe(e.target.checked)}
                        className="rounded border-slate-400 text-[#8dc63f] focus:ring-[#8dc63f]"
                      />
                      Remember me
                    </label>
                    <button
                      type="button"
                      onClick={handleForgotPassword}
                      disabled={forgotBusy}
                      className="text-[#8dc63f] font-semibold hover:underline disabled:opacity-50"
                    >
                      {forgotBusy ? 'Sending…' : 'Forgot password?'}
                    </button>
                  </div>
                )}

                {forgotMsg && (
                  <p className="text-xs text-slate-600 bg-white/50 rounded-lg px-3 py-2 border border-slate-200/80">{forgotMsg}</p>
                )}

                {error && (
                  <div className="rounded-xl bg-red-50 border border-red-200 text-red-800 px-4 py-3 text-sm flex items-start gap-2.5">
                    <Icons.AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={submitting}
                  className="ep-neu-cta ep-up ep-up-5 w-full rounded-2xl bg-gradient-to-b from-[#9ed654] via-[#8dc63f] to-[#5a9018] text-white py-3.5 f-body font-semibold text-sm tracking-wide hover:brightness-[1.02] active:brightness-95 active:scale-[0.99] disabled:opacity-45 disabled:cursor-not-allowed disabled:active:scale-100 transition-all"
                >
                  {submitting ? (
                    <span className="flex items-center justify-center gap-2">
                      <Icons.CloudSync className="w-4 h-4 animate-spin" /> Please wait...
                    </span>
                  ) : authMode === 'login'
                    ? (isCandidateMode ? 'Sign In to Exam' : 'Sign In as Proctor')
                    : (isCandidateMode ? 'Create Candidate Account' : 'Create Proctor Account')}
                </button>
              </div>
            </form>

          <p className="f-mono text-[10px] tracking-[0.22em] text-[#6b8a55] mt-6 uppercase select-none text-center">
            Powered by costudy.in
          </p>
        </div>
      </div>
    );
  }

  // ========================================
  // CANDIDATE MODE
  // ========================================
  if (isCandidateMode) {
    return (
      <div className="min-h-screen ep-neu-app-shell f-body flex flex-col text-slate-800">
        <div className="ep-neu-topbar shrink-0 px-4 sm:px-6 py-3 flex flex-wrap gap-y-2 justify-between items-center relative z-20 rounded-b-2xl mx-2 sm:mx-4 mt-2 border border-white/40">
          <div className="flex items-center gap-3 min-w-0">
            <div className="ep-neu-raised-sm w-9 h-9 rounded-xl flex items-center justify-center shrink-0 bg-gradient-to-br from-[#f4faf2] to-[#dce8d8]">
              <Icons.GraduationCap className="w-5 h-5 text-[#4a7a1c]" />
            </div>
            <span className="font-bold text-sm tracking-wide text-slate-800 truncate">CoStudy Exam</span>
            <div className="flex items-center gap-1.5 rounded-full ep-neu-raised-sm bg-[#f0f7ec] border border-[#8dc63f]/30 px-3 py-1 ml-1 shrink-0">
              <div className="w-[5px] h-[5px] rounded-full bg-[#8dc63f] ep-pulse-dot" />
              <span className="f-mono text-[#3d6220] text-[10px] tracking-[0.12em]">STN {stationNum}</span>
            </div>
          </div>
          <span className="f-mono text-slate-600 text-[11px] truncate max-w-[min(100%,14rem)]">{user.email}</span>
        </div>

        <Suspense fallback={
          <div className="flex flex-1 min-h-[50vh] items-center justify-center ep-neu-app-shell">
            <div className="ep-neu-raised w-14 h-14 rounded-[18px] flex items-center justify-center bg-gradient-to-br from-[#f4faf2] to-[#dce8d8]">
              <Icons.CloudSync className="h-6 w-6 animate-spin text-[#4a7a1c]" />
            </div>
          </div>
        }>
          <div className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 py-6">
            <MockTests
              userId={user.id}
              testCenter={{ centerId: centerId!, stationNumber: parseInt(stationNum!, 10) }}
            />
          </div>
        </Suspense>
      </div>
    );
  }

  // ========================================
  // PROCTOR MODE
  // ========================================
  return (
    <Suspense fallback={
      <div className="ep-neu-app-shell flex h-screen items-center justify-center f-body">
        <div className="ep-neu-raised w-20 h-20 rounded-[26px] flex items-center justify-center bg-gradient-to-br from-[#f4faf2] to-[#dce8d8]">
          <Icons.CloudSync className="h-8 w-8 animate-spin text-[#4a7a1c]" />
        </div>
      </div>
    }>
      <div className="ep-neu-app-shell min-h-screen f-body text-slate-800">
        <TestCenterAdmin userId={user.id} onLogout={handleLogout} />
      </div>
    </Suspense>
  );
};

export { ExamApp };
export default ExamApp;
