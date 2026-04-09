/**
 * ExamApp — Test Center Portal.
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
  // Proctor mode = no center/station params

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
      <div className="flex h-screen w-full flex-col items-center justify-center gap-6 bg-slate-950">
        <Icons.CloudSync className="h-14 w-14 animate-spin text-[#8dc63f] drop-shadow-sm" />
        <span className="font-sans text-xs font-medium tracking-[0.25em] text-slate-400">
          {isCandidateMode ? 'Loading Exam Station...' : 'Loading Test Center...'}
        </span>
      </div>
    );
  }

  // ==========================================
  // AUTH SCREEN
  // ==========================================
  if (!user) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6 font-sans">
        <div className="w-full max-w-md">
          {/* Header — different branding for proctor vs candidate */}
          <div className="text-center mb-8">
            <div className="flex items-center justify-center gap-3 mb-4">
              {isCandidateMode
                ? <Icons.GraduationCap className="w-10 h-10 text-[#8dc63f]" />
                : <Icons.Shield className="w-10 h-10 text-[#8dc63f]" />
              }
              <h1 className="text-3xl font-bold text-white tracking-tight">CoStudy</h1>
            </div>
            {isCandidateMode ? (
              <>
                <p className="text-slate-400 text-sm">CMA Mock Exam — Candidate Login</p>
                <div className="mt-3 bg-[#8dc63f]/10 border border-[#8dc63f]/20 rounded px-3 py-2 text-[#8dc63f] text-xs font-bold">
                  Station {stationNum}
                </div>
              </>
            ) : (
              <>
                <p className="text-slate-400 text-sm">Test Center Administration</p>
                <p className="text-slate-600 text-[11px] mt-1">Proctor Login</p>
              </>
            )}
          </div>

          {/* Auth Form */}
          <form onSubmit={handleAuth} className="bg-white/5 backdrop-blur border border-white/10 rounded-2xl p-8 space-y-4">
            <div className="flex bg-white/5 rounded-lg p-1 mb-2">
              <button type="button" onClick={() => setAuthMode('login')}
                className={`flex-1 py-2 text-sm font-bold rounded-md transition-colors ${authMode === 'login' ? 'bg-[#8dc63f] text-white' : 'text-slate-400 hover:text-white'}`}>
                Sign In
              </button>
              <button type="button" onClick={() => setAuthMode('signup')}
                className={`flex-1 py-2 text-sm font-bold rounded-md transition-colors ${authMode === 'signup' ? 'bg-[#8dc63f] text-white' : 'text-slate-400 hover:text-white'}`}>
                Sign Up
              </button>
            </div>

            {authMode === 'signup' && (
              <input type="text" placeholder="Full Name" value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white placeholder:text-slate-500 text-sm outline-none focus:border-[#8dc63f]/50"
                required />
            )}

            <input type="email" placeholder="Email" value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white placeholder:text-slate-500 text-sm outline-none focus:border-[#8dc63f]/50"
              required />

            <input type="password" placeholder="Password" value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white placeholder:text-slate-500 text-sm outline-none focus:border-[#8dc63f]/50"
              required minLength={6} />

            {error && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-2 rounded-lg text-sm">{error}</div>
            )}

            <button type="submit" disabled={submitting}
              className="w-full bg-[#8dc63f] hover:bg-[#7db536] disabled:opacity-50 text-white py-3 rounded-lg font-bold text-sm transition-colors">
              {submitting ? 'Please wait...' : authMode === 'login'
                ? (isCandidateMode ? 'Sign In to Exam' : 'Sign In as Proctor')
                : (isCandidateMode ? 'Create Candidate Account' : 'Create Proctor Account')}
            </button>
          </form>

          <p className="text-center text-slate-600 text-xs mt-6">
            Powered by <span className="text-slate-400">costudy.in</span>
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
        {/* Minimal top bar for candidates */}
        <div className="bg-[#333333] text-white px-4 py-2 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Icons.GraduationCap className="w-5 h-5 text-[#8dc63f]" />
            <span className="font-bold text-sm">CoStudy Exam</span>
            <span className="bg-[#8dc63f]/20 text-[#8dc63f] px-2 py-0.5 rounded text-[10px] font-bold ml-2">
              STATION {stationNum}
            </span>
          </div>
          <span className="text-slate-400 text-xs">{user.email}</span>
        </div>

        <Suspense fallback={
          <div className="flex h-[80vh] items-center justify-center">
            <Icons.CloudSync className="h-10 w-10 animate-spin text-[#8dc63f]" />
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
      <div className="flex h-screen items-center justify-center bg-slate-950">
        <Icons.CloudSync className="h-10 w-10 animate-spin text-[#8dc63f]" />
      </div>
    }>
      <TestCenterAdmin userId={user.id} onLogout={handleLogout} />
    </Suspense>
  );
};

export { ExamApp };
export default ExamApp;
