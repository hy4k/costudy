/**
 * ExamApp — Test Center Portal with Claymorphism Design.
 * Two modes based on URL params:
 *   /exam                          → Proctor portal (admin dashboard)
 *   /exam?center=ID&station=N      → Candidate workstation (locked exam)
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

/* ─── Claymorphism Utility Classes ─── */
const clay = {
  // Soft raised card
  card: 'rounded-3xl bg-white/[0.07] backdrop-blur-xl border border-white/[0.12] shadow-[8px_8px_24px_rgba(0,0,0,0.4),-4px_-4px_16px_rgba(255,255,255,0.03),inset_1px_1px_1px_rgba(255,255,255,0.08)]',
  // Inset input field
  input: 'w-full rounded-2xl bg-white/[0.04] border border-white/[0.08] px-5 py-3.5 text-white placeholder:text-slate-500 text-sm outline-none transition-all duration-300 shadow-[inset_2px_2px_6px_rgba(0,0,0,0.3),inset_-1px_-1px_3px_rgba(255,255,255,0.05)] focus:border-[#8dc63f]/40 focus:shadow-[inset_2px_2px_6px_rgba(0,0,0,0.3),inset_-1px_-1px_3px_rgba(255,255,255,0.05),0_0_20px_rgba(141,198,63,0.1)]',
  // Primary button
  btnPrimary: 'w-full rounded-2xl bg-gradient-to-br from-[#8dc63f] to-[#6ba52e] text-white py-3.5 font-bold text-sm transition-all duration-300 shadow-[4px_4px_12px_rgba(0,0,0,0.3),-2px_-2px_8px_rgba(141,198,63,0.15),inset_1px_1px_2px_rgba(255,255,255,0.2)] hover:shadow-[6px_6px_20px_rgba(0,0,0,0.4),-3px_-3px_12px_rgba(141,198,63,0.2),inset_1px_1px_2px_rgba(255,255,255,0.25)] hover:translate-y-[-1px] active:translate-y-[1px] active:shadow-[2px_2px_6px_rgba(0,0,0,0.3),inset_2px_2px_4px_rgba(0,0,0,0.15)] disabled:opacity-50 disabled:hover:translate-y-0',
  // Toggle button
  toggle: (active: boolean) => `flex-1 py-2.5 text-sm font-bold rounded-xl transition-all duration-300 ${active
    ? 'bg-gradient-to-br from-[#8dc63f] to-[#6ba52e] text-white shadow-[3px_3px_10px_rgba(0,0,0,0.3),-1px_-1px_6px_rgba(141,198,63,0.15),inset_1px_1px_2px_rgba(255,255,255,0.2)]'
    : 'text-slate-400 hover:text-white hover:bg-white/[0.06]'}`,
};

const ExamApp: React.FC = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Parse URL params to determine mode
  const urlParams = new URLSearchParams(window.location.search);
  const centerId = urlParams.get('center');
  const stationNum = urlParams.get('station');
  const isCandidateMode = !!(centerId && stationNum);

  // Check for existing session on mount
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

  // ==========================================
  // LOADING
  // ==========================================
  if (isLoading) {
    return (
      <div className="flex h-screen w-full flex-col items-center justify-center gap-8 bg-[#0a0e1a] relative overflow-hidden">
        {/* Ambient background orbs */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#8dc63f]/[0.04] rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-emerald-500/[0.03] rounded-full blur-[100px] animate-pulse" style={{ animationDelay: '1s' }} />

        {/* Clay loader */}
        <div className="relative">
          <div className="w-20 h-20 rounded-[28px] bg-gradient-to-br from-white/[0.08] to-white/[0.02] border border-white/[0.1] shadow-[8px_8px_24px_rgba(0,0,0,0.5),-4px_-4px_12px_rgba(255,255,255,0.03),inset_1px_1px_2px_rgba(255,255,255,0.1)] flex items-center justify-center">
            <Icons.CloudSync className="h-9 w-9 animate-spin text-[#8dc63f] drop-shadow-[0_0_12px_rgba(141,198,63,0.4)]" />
          </div>
        </div>
        <span className="font-sans text-xs font-medium tracking-[0.3em] text-slate-500 uppercase">
          {isCandidateMode ? 'Loading Exam Station' : 'Loading Test Center'}
        </span>
      </div>
    );
  }

  // ==========================================
  // AUTH SCREEN
  // ==========================================
  if (!user) {
    return (
      <div className="min-h-screen bg-[#0a0e1a] flex items-center justify-center p-6 font-sans relative overflow-hidden">
        {/* Mesh gradient background */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] bg-[#8dc63f]/[0.04] rounded-full blur-[150px]" />
          <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] bg-emerald-600/[0.03] rounded-full blur-[130px]" />
          <div className="absolute top-[40%] right-[20%] w-[300px] h-[300px] bg-cyan-500/[0.02] rounded-full blur-[100px]" />
          {/* Subtle grid pattern */}
          <div className="absolute inset-0 opacity-[0.03]" style={{
            backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.3) 1px, transparent 0)',
            backgroundSize: '40px 40px'
          }} />
        </div>

        <div className="w-full max-w-md relative z-10">
          {/* Header — Clay brand badge */}
          <div className="text-center mb-10">
            <div className="inline-flex items-center justify-center gap-3 mb-6">
              <div className="w-14 h-14 rounded-[20px] bg-gradient-to-br from-[#8dc63f]/20 to-[#8dc63f]/5 border border-[#8dc63f]/20 shadow-[6px_6px_18px_rgba(0,0,0,0.4),-3px_-3px_10px_rgba(141,198,63,0.08),inset_1px_1px_2px_rgba(141,198,63,0.15)] flex items-center justify-center">
                {isCandidateMode
                  ? <Icons.GraduationCap className="w-7 h-7 text-[#8dc63f] drop-shadow-[0_0_8px_rgba(141,198,63,0.4)]" />
                  : <Icons.Shield className="w-7 h-7 text-[#8dc63f] drop-shadow-[0_0_8px_rgba(141,198,63,0.4)]" />
                }
              </div>
            </div>
            <h1 className="text-3xl font-extrabold text-white tracking-tight mb-1 drop-shadow-[0_2px_4px_rgba(0,0,0,0.3)]">
              CoStudy
            </h1>
            {isCandidateMode ? (
              <>
                <p className="text-slate-400 text-sm mt-2">CMA Mock Exam — Candidate Login</p>
                <div className="mt-4 inline-flex items-center gap-2 rounded-2xl bg-[#8dc63f]/[0.08] border border-[#8dc63f]/20 px-5 py-2 shadow-[inset_1px_1px_3px_rgba(0,0,0,0.2),2px_2px_8px_rgba(0,0,0,0.2)]">
                  <div className="w-2 h-2 rounded-full bg-[#8dc63f] shadow-[0_0_6px_rgba(141,198,63,0.6)] animate-pulse" />
                  <span className="text-[#8dc63f] text-xs font-bold tracking-wider">STATION {stationNum}</span>
                </div>
              </>
            ) : (
              <>
                <p className="text-slate-400 text-sm mt-2">Test Center Administration</p>
                <p className="text-slate-600 text-[11px] mt-1 tracking-wide">Proctor Portal</p>
              </>
            )}
          </div>

          {/* Auth Form — Clay card */}
          <form onSubmit={handleAuth} className={`${clay.card} p-8 space-y-5`}>
            {/* Auth mode toggle */}
            <div className="flex rounded-2xl bg-white/[0.04] border border-white/[0.06] p-1.5 shadow-[inset_2px_2px_6px_rgba(0,0,0,0.25)]">
              <button type="button" onClick={() => setAuthMode('login')} className={clay.toggle(authMode === 'login')}>
                Sign In
              </button>
              <button type="button" onClick={() => setAuthMode('signup')} className={clay.toggle(authMode === 'signup')}>
                Sign Up
              </button>
            </div>

            {authMode === 'signup' && (
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider pl-1">Full Name</label>
                <input type="text" placeholder="Enter your full name" value={name}
                  onChange={(e) => setName(e.target.value)}
                  className={clay.input}
                  required />
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider pl-1">Email</label>
              <input type="email" placeholder="your@email.com" value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={clay.input}
                required />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider pl-1">Password</label>
              <input type="password" placeholder="Min. 6 characters" value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={clay.input}
                required minLength={6} />
            </div>

            {error && (
              <div className="rounded-2xl bg-red-500/[0.08] border border-red-500/20 text-red-400 px-5 py-3 text-sm shadow-[inset_1px_1px_4px_rgba(0,0,0,0.2)]">
                {error}
              </div>
            )}

            <button type="submit" disabled={submitting} className={clay.btnPrimary}>
              {submitting ? (
                <span className="flex items-center justify-center gap-2">
                  <Icons.CloudSync className="w-4 h-4 animate-spin" />
                  Please wait...
                </span>
              ) : authMode === 'login'
                ? (isCandidateMode ? 'Sign In to Exam' : 'Sign In as Proctor')
                : (isCandidateMode ? 'Create Candidate Account' : 'Create Proctor Account')}
            </button>
          </form>

          <p className="text-center text-slate-600 text-[11px] mt-8 tracking-wide">
            Powered by <span className="text-slate-400 font-medium">costudy.in</span>
          </p>
        </div>
      </div>
    );
  }

  // ==========================================
  // CANDIDATE MODE — locked exam on workstation
  // ==========================================
  if (isCandidateMode) {
    return (
      <div className="min-h-screen bg-slate-100 font-sans">
        {/* Clay top bar for candidates */}
        <div className="bg-[#0f1320] text-white px-5 py-3 flex justify-between items-center shadow-[0_4px_20px_rgba(0,0,0,0.3)]">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#8dc63f]/20 to-[#8dc63f]/5 border border-[#8dc63f]/20 flex items-center justify-center shadow-[2px_2px_6px_rgba(0,0,0,0.3),inset_1px_1px_1px_rgba(141,198,63,0.15)]">
              <Icons.GraduationCap className="w-4 h-4 text-[#8dc63f]" />
            </div>
            <span className="font-bold text-sm tracking-wide">CoStudy Exam</span>
            <div className="flex items-center gap-1.5 rounded-xl bg-[#8dc63f]/[0.1] border border-[#8dc63f]/20 px-3 py-1 ml-1">
              <div className="w-1.5 h-1.5 rounded-full bg-[#8dc63f] shadow-[0_0_4px_rgba(141,198,63,0.6)]" />
              <span className="text-[#8dc63f] text-[10px] font-bold tracking-wider">STN {stationNum}</span>
            </div>
          </div>
          <span className="text-slate-500 text-xs">{user.email}</span>
        </div>

        <Suspense fallback={
          <div className="flex h-[80vh] items-center justify-center bg-slate-100">
            <div className="w-16 h-16 rounded-[20px] bg-white shadow-[6px_6px_20px_rgba(0,0,0,0.08),-4px_-4px_12px_rgba(255,255,255,0.9),inset_1px_1px_2px_rgba(255,255,255,0.8)] flex items-center justify-center">
              <Icons.CloudSync className="h-8 w-8 animate-spin text-[#8dc63f]" />
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

  // ==========================================
  // PROCTOR MODE — admin dashboard directly
  // ==========================================
  return (
    <Suspense fallback={
      <div className="flex h-screen items-center justify-center bg-[#0a0e1a] relative overflow-hidden">
        <div className="absolute top-1/3 left-1/3 w-96 h-96 bg-[#8dc63f]/[0.03] rounded-full blur-[120px]" />
        <div className="w-20 h-20 rounded-[28px] bg-gradient-to-br from-white/[0.08] to-white/[0.02] border border-white/[0.1] shadow-[8px_8px_24px_rgba(0,0,0,0.5),-4px_-4px_12px_rgba(255,255,255,0.03),inset_1px_1px_2px_rgba(255,255,255,0.1)] flex items-center justify-center">
          <Icons.CloudSync className="h-9 w-9 animate-spin text-[#8dc63f] drop-shadow-[0_0_12px_rgba(141,198,63,0.4)]" />
        </div>
      </div>
    }>
      <TestCenterAdmin userId={user.id} onLogout={handleLogout} />
    </Suspense>
  );
};

export { ExamApp };
export default ExamApp;
