/**
 * ExamApp — Test Center Portal.
 * Aesthetic: "The Examiner's Console" — precision, authority, trust.
 * /exam                          → Proctor portal (admin dashboard)
 * /exam?center=ID&station=N      → Candidate workstation (locked exam)
 */
import React, { useState, useEffect, Suspense, lazy } from 'react';
import { supabase } from './services/supabaseClient';
import { authService } from './services/fetsService';
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

/* Font shortcuts */
.f-display { font-family:'Fraunces',Georgia,serif; }
.f-body { font-family:'Plus Jakarta Sans',system-ui,sans-serif; }
.f-mono { font-family:'Geist Mono','JetBrains Mono',monospace; }

/* Scrollbar */
.ep-scroll::-webkit-scrollbar { width:5px; }
.ep-scroll::-webkit-scrollbar-track { background:transparent; }
.ep-scroll::-webkit-scrollbar-thumb { background:rgba(255,255,255,.08); border-radius:9px; }
.ep-scroll::-webkit-scrollbar-thumb:hover { background:rgba(255,255,255,.15); }
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
        const session = await authService.getSession();
        if (session?.user) setUser(session.user);
      } catch (e) {
        console.error('Session check failed:', e);
      } finally {
        setIsLoading(false);
      }
    };
    init();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if ((event === 'SIGNED_IN' || event === 'INITIAL_SESSION') && session?.user) {
        setUser(session.user);
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      if (authMode === 'login') {
        await authService.signIn(email, password);
      } else {
        await authService.signUp(email, password, name || (isCandidateMode ? 'Candidate' : 'Proctor'), isCandidateMode ? 'STUDENT' : 'ADMIN');
      }
      const session = await authService.getSession();
      if (session?.user) setUser(session.user);
    } catch (err: any) {
      setError(err.message || 'Authentication failed');
    } finally {
      setSubmitting(false);
    }
  };

  const handleLogout = async () => {
    await authService.signOut();
    setUser(null);
  };

  /* ─── Shared Input Style ─── */
  const inputCls = 'f-body w-full rounded-2xl bg-[#0c1120] border border-white/[0.06] px-5 py-3.5 text-white placeholder:text-slate-600 text-sm outline-none transition-all duration-300 focus:border-[#8dc63f]/30 focus:shadow-[0_0_0_3px_rgba(141,198,63,0.06),0_0_20px_rgba(141,198,63,0.04)]';

  // ========================================
  // LOADING
  // ========================================
  if (isLoading) {
    return (
      <div className="ep-noise flex h-screen w-full flex-col items-center justify-center bg-[#040711] relative overflow-hidden f-body">
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
  // AUTH SCREEN
  // ========================================
  if (!user) {
    return (
      <div className="ep-noise min-h-screen bg-[#040711] flex items-center justify-center p-6 relative overflow-hidden f-body">
        {/* Background composition */}
        <div className="fixed inset-0 pointer-events-none select-none">
          {/* Soft orbs */}
          <div className="absolute top-[-12%] right-[-8%] w-[550px] h-[550px] rounded-full bg-[#8dc63f]/[0.025] blur-[160px]"
            style={{ animation: 'breathe 8s ease-in-out infinite' }} />
          <div className="absolute bottom-[-12%] left-[-8%] w-[450px] h-[450px] rounded-full bg-blue-500/[0.015] blur-[140px]"
            style={{ animation: 'breathe 10s ease-in-out infinite 3s' }} />

          {/* Fine grid */}
          <div className="absolute inset-0 opacity-[0.02]" style={{
            backgroundImage: 'linear-gradient(rgba(255,255,255,.06) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.06) 1px,transparent 1px)',
            backgroundSize: '56px 56px'
          }} />

          {/* Slow horizontal scan */}
          <div className="absolute left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#8dc63f]/15 to-transparent"
            style={{ animation: 'scan-line 10s linear infinite' }} />
        </div>

        <div className="w-full max-w-[400px] relative z-10">
          {/* ─── Brand ─── */}
          <div className="text-center mb-12 ep-up">
            <div className="inline-block mb-6">
              <div className="ep-ring w-[68px] h-[68px] rounded-[22px]">
                <div className="w-full h-full rounded-[22px] bg-[#080c18] flex items-center justify-center shadow-[0_16px_48px_rgba(0,0,0,0.5)]">
                  {isCandidateMode
                    ? <Icons.GraduationCap className="w-8 h-8 text-[#8dc63f] drop-shadow-[0_0_12px_rgba(141,198,63,0.5)]" />
                    : <Icons.Shield className="w-8 h-8 text-[#8dc63f] drop-shadow-[0_0_12px_rgba(141,198,63,0.5)]" />}
                </div>
              </div>
            </div>
            <h1 className="f-display text-[38px] font-semibold text-white tracking-tight leading-none">
              CoStudy
            </h1>
            {isCandidateMode ? (
              <div className="mt-4">
                <p className="text-slate-400 text-[13px]">CMA Mock Exam — Candidate Portal</p>
                <div className="mt-4 inline-flex items-center gap-2.5 rounded-full bg-[#8dc63f]/[0.06] border border-[#8dc63f]/15 px-5 py-2">
                  <div className="w-[7px] h-[7px] rounded-full bg-[#8dc63f] ep-breathe" />
                  <span className="f-mono text-[#8dc63f] text-[11px] tracking-[0.18em]">STATION {stationNum}</span>
                </div>
              </div>
            ) : (
              <div className="mt-3">
                <p className="text-slate-500 text-[13px]">Test Center Administration</p>
                <p className="f-mono text-slate-700 text-[10px] mt-1.5 tracking-[0.22em] uppercase">Proctor Console</p>
              </div>
            )}
          </div>

          {/* ─── Auth Card ─── */}
          <form onSubmit={handleAuth}>
            <div className="ep-ring rounded-[28px] ep-up ep-up-1">
              <div className="rounded-[28px] bg-[#080c18]/95 backdrop-blur-2xl border border-white/[0.04] p-8 space-y-6">

                {/* Toggle */}
                <div className="ep-up ep-up-2 flex rounded-2xl bg-white/[0.025] p-1.5 border border-white/[0.04]">
                  {(['login', 'signup'] as const).map(mode => (
                    <button key={mode} type="button" onClick={() => setAuthMode(mode)}
                      className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300 ${
                        authMode === mode
                          ? 'bg-[#8dc63f] text-white shadow-[0_4px_16px_rgba(141,198,63,0.25)]'
                          : 'text-slate-500 hover:text-slate-300'
                      }`}>
                      {mode === 'login' ? 'Sign In' : 'Sign Up'}
                    </button>
                  ))}
                </div>

                {/* Name (signup only) */}
                {authMode === 'signup' && (
                  <div className="ep-up space-y-2">
                    <label className="f-mono text-[9px] text-slate-500 tracking-[0.22em] uppercase pl-1">Full Name</label>
                    <input type="text" placeholder="Your full name" value={name}
                      onChange={(e) => setName(e.target.value)} className={inputCls} required />
                  </div>
                )}

                <div className="ep-up ep-up-3 space-y-2">
                  <label className="f-mono text-[9px] text-slate-500 tracking-[0.22em] uppercase pl-1">Email</label>
                  <input type="email" placeholder="your@email.com" value={email}
                    onChange={(e) => setEmail(e.target.value)} className={inputCls} required />
                </div>

                <div className="ep-up ep-up-4 space-y-2">
                  <label className="f-mono text-[9px] text-slate-500 tracking-[0.22em] uppercase pl-1">Password</label>
                  <input type="password" placeholder="Min. 6 characters" value={password}
                    onChange={(e) => setPassword(e.target.value)} className={inputCls} required minLength={6} />
                </div>

                {error && (
                  <div className="rounded-xl bg-red-500/[0.06] border border-red-500/15 text-red-400 px-4 py-3 text-sm flex items-center gap-2.5">
                    <Icons.AlertCircle className="w-4 h-4 shrink-0" />
                    {error}
                  </div>
                )}

                <button type="submit" disabled={submitting}
                  className="ep-shimmer ep-up ep-up-5 w-full rounded-2xl bg-gradient-to-r from-[#8dc63f] via-[#7db536] to-[#6ba52e] text-white py-4 font-bold text-sm transition-all duration-300 shadow-[0_8px_28px_rgba(141,198,63,0.18)] hover:shadow-[0_12px_36px_rgba(141,198,63,0.28)] hover:-translate-y-px active:translate-y-px disabled:opacity-40 disabled:hover:translate-y-0">
                  {submitting ? (
                    <span className="flex items-center justify-center gap-2">
                      <Icons.CloudSync className="w-4 h-4 animate-spin" /> Please wait...
                    </span>
                  ) : authMode === 'login'
                    ? (isCandidateMode ? 'Sign In to Exam' : 'Sign In as Proctor')
                    : (isCandidateMode ? 'Create Candidate Account' : 'Create Proctor Account')}
                </button>
              </div>
            </div>
          </form>

          <p className="text-center f-mono text-[10px] tracking-[0.2em] text-slate-700 mt-10 uppercase select-none">
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
      <div className="min-h-screen bg-slate-100 f-body">
        {/* Top bar */}
        <div className="bg-[#080c18] text-white px-5 py-3 flex justify-between items-center shadow-[0_4px_24px_rgba(0,0,0,0.4)] relative z-20">
          <div className="flex items-center gap-3">
            <div className="ep-ring w-8 h-8 rounded-lg">
              <div className="w-full h-full rounded-lg bg-[#0a0e1a] flex items-center justify-center">
                <Icons.GraduationCap className="w-4 h-4 text-[#8dc63f]" />
              </div>
            </div>
            <span className="font-bold text-sm tracking-wide">CoStudy Exam</span>
            <div className="flex items-center gap-1.5 rounded-full bg-[#8dc63f]/[0.08] border border-[#8dc63f]/15 px-3 py-1 ml-1">
              <div className="w-[5px] h-[5px] rounded-full bg-[#8dc63f] ep-pulse-dot" />
              <span className="f-mono text-[#8dc63f] text-[10px] tracking-[0.12em]">STN {stationNum}</span>
            </div>
          </div>
          <span className="f-mono text-slate-500 text-[11px]">{user.email}</span>
        </div>

        <Suspense fallback={
          <div className="flex h-[80vh] items-center justify-center bg-slate-100">
            <div className="w-14 h-14 rounded-[18px] bg-white shadow-[0_8px_32px_rgba(0,0,0,0.06)] flex items-center justify-center">
              <Icons.CloudSync className="h-6 w-6 animate-spin text-[#8dc63f]" />
            </div>
          </div>
        }>
          <MockTests
            userId={user.id}
            testCenter={{ centerId: centerId!, stationNumber: parseInt(stationNum!, 10) }}
          />
        </Suspense>
      </div>
    );
  }

  // ========================================
  // PROCTOR MODE
  // ========================================
  return (
    <Suspense fallback={
      <div className="ep-noise flex h-screen items-center justify-center bg-[#040711] relative overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] rounded-full bg-[#8dc63f]/[0.025] blur-[140px]" />
        <div className="ep-float">
          <div className="ep-ring w-20 h-20 rounded-[26px]">
            <div className="w-full h-full rounded-[26px] bg-[#080c18] flex items-center justify-center shadow-[0_20px_56px_rgba(0,0,0,0.5)]">
              <Icons.CloudSync className="h-8 w-8 animate-spin text-[#8dc63f] drop-shadow-[0_0_14px_rgba(141,198,63,0.4)]" />
            </div>
          </div>
        </div>
      </div>
    }>
      <TestCenterAdmin userId={user.id} onLogout={handleLogout} />
    </Suspense>
  );
};

export { ExamApp };
export default ExamApp;
