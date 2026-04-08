/**
 * ExamApp — Standalone mock exam application.
 * Minimal shell: auth + MockTests, no Layout/nav/sidebar/notifications.
 * Served at /exam or exam.costudy.in
 */
import React, { useState, useEffect, Suspense, lazy } from 'react';
import { supabase } from './services/supabaseClient';
import { authService } from './services/fetsService';
import { Icons } from './components/Icons';

const MockTests = lazy(() =>
  import('./components/views/MockTests').then(m => ({ default: m.MockTests }))
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

  // Check for existing session on mount
  useEffect(() => {
    const init = async () => {
      try {
        const session = await authService.getSession();
        if (session?.user) {
          setUser(session.user);
        }
      } catch (e) {
        console.error('Session check failed:', e);
      } finally {
        setIsLoading(false);
      }
    };
    init();

    // Listen for auth state changes
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
        await authService.signUp(email, password, name || 'Student', 'STUDENT');
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

  // Parse test center params from URL
  const urlParams = new URLSearchParams(window.location.search);
  const centerId = urlParams.get('center');
  const stationNum = urlParams.get('station');

  if (isLoading) {
    return (
      <div className="flex h-screen w-full flex-col items-center justify-center gap-6 bg-gradient-to-b from-slate-50 to-slate-100">
        <Icons.CloudSync className="h-14 w-14 animate-spin text-[#8dc63f] drop-shadow-sm" />
        <span className="font-sans text-xs font-medium tracking-[0.25em] text-slate-500">Loading Mock Exam...</span>
      </div>
    );
  }

  // Not logged in — show login form
  if (!user) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6 font-sans">
        <div className="w-full max-w-md">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="flex items-center justify-center gap-3 mb-4">
              <Icons.GraduationCap className="w-10 h-10 text-[#8dc63f]" />
              <h1 className="text-3xl font-bold text-white tracking-tight">CoStudy</h1>
            </div>
            <p className="text-slate-400 text-sm">CMA Mock Exam Platform</p>
            {centerId && (
              <div className="mt-3 bg-[#8dc63f]/10 border border-[#8dc63f]/20 rounded px-3 py-2 text-[#8dc63f] text-xs font-bold">
                Test Center Mode {stationNum ? `- Station ${stationNum}` : ''}
              </div>
            )}
          </div>

          {/* Auth Form */}
          <form onSubmit={handleAuth} className="bg-white/5 backdrop-blur border border-white/10 rounded-2xl p-8 space-y-4">
            <div className="flex bg-white/5 rounded-lg p-1 mb-2">
              <button
                type="button"
                onClick={() => setAuthMode('login')}
                className={`flex-1 py-2 text-sm font-bold rounded-md transition-colors ${
                  authMode === 'login' ? 'bg-[#8dc63f] text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => setAuthMode('signup')}
                className={`flex-1 py-2 text-sm font-bold rounded-md transition-colors ${
                  authMode === 'signup' ? 'bg-[#8dc63f] text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                Sign Up
              </button>
            </div>

            {authMode === 'signup' && (
              <input
                type="text"
                placeholder="Full Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white placeholder:text-slate-500 text-sm outline-none focus:border-[#8dc63f]/50"
                required
              />
            )}

            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white placeholder:text-slate-500 text-sm outline-none focus:border-[#8dc63f]/50"
              required
            />

            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white placeholder:text-slate-500 text-sm outline-none focus:border-[#8dc63f]/50"
              required
              minLength={6}
            />

            {error && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-2 rounded-lg text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-[#8dc63f] hover:bg-[#7db536] disabled:opacity-50 text-white py-3 rounded-lg font-bold text-sm transition-colors"
            >
              {submitting ? 'Please wait...' : authMode === 'login' ? 'Sign In to Mock Exam' : 'Create Account'}
            </button>
          </form>

          <p className="text-center text-slate-600 text-xs mt-6">
            Powered by <span className="text-slate-400">costudy.in</span>
          </p>
        </div>
      </div>
    );
  }

  // Logged in — render MockTests directly (no Layout shell)
  return (
    <div className="min-h-screen bg-slate-100 font-sans">
      {/* Minimal top bar */}
      <div className="bg-[#333333] text-white px-4 py-2 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <Icons.GraduationCap className="w-5 h-5 text-[#8dc63f]" />
          <span className="font-bold text-sm">CoStudy Mock Exam</span>
          {centerId && (
            <span className="bg-[#8dc63f]/20 text-[#8dc63f] px-2 py-0.5 rounded text-[10px] font-bold ml-2">
              TEST CENTER {stationNum ? `- STN ${stationNum}` : ''}
            </span>
          )}
        </div>
        <div className="flex items-center gap-4">
          <span className="text-slate-400 text-xs">{user.email}</span>
          <button
            onClick={handleLogout}
            className="text-slate-400 hover:text-white text-xs font-bold transition-colors"
          >
            Sign Out
          </button>
        </div>
      </div>

      <Suspense fallback={
        <div className="flex h-[80vh] items-center justify-center">
          <Icons.CloudSync className="h-10 w-10 animate-spin text-[#8dc63f]" />
        </div>
      }>
        <MockTests userId={user.id} />
      </Suspense>
    </div>
  );
};

export { ExamApp };
export default ExamApp;
