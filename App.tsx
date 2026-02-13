
import React, { useState, useEffect, lazy, Suspense } from 'react';
import { Layout } from './components/Layout';
import { ViewState, UserRole } from './types';
import { Icons } from './components/Icons';

// Lazy load heavy components for better initial load performance
const StudyWall = lazy(() => import('./components/views/StudyWall').then(m => ({ default: m.StudyWall })));
const StudyRooms = lazy(() => import('./components/views/StudyRooms').then(m => ({ default: m.StudyRooms })));
const AIDeck = lazy(() => import('./components/views/AIDeck').then(m => ({ default: m.AIDeck })));
const Profile = lazy(() => import('./components/views/Profile').then(m => ({ default: m.Profile })));
const TeachersLounge = lazy(() => import('./components/views/TeachersLounge').then(m => ({ default: m.TeachersLounge })));
const MockTests = lazy(() => import('./components/views/MockTests').then(m => ({ default: m.MockTests })));
const StudentStore = lazy(() => import('./components/views/StudentStore').then(m => ({ default: m.StudentStore })));
const LibraryVault = lazy(() => import('./components/views/LibraryVault').then(m => ({ default: m.LibraryVault })));
const MentorDashboard = lazy(() => import('./components/views/MentorDashboard').then(m => ({ default: m.MentorDashboard })));
const DirectMessages = lazy(() => import('./components/views/DirectMessages').then(m => ({ default: m.DirectMessages })));
const Landing = lazy(() => import('./components/views/Landing').then(m => ({ default: m.Landing })));
const Login = lazy(() => import('./components/auth/Login').then(m => ({ default: m.Login })));
const SignUp = lazy(() => import('./components/auth/SignUp').then(m => ({ default: m.SignUp })));

// Keep services as regular imports (needed immediately)
import { authService, getUserProfile, createUserProfile } from './services/fetsService';
import { supabase } from './services/supabaseClient';
import { localAuthService } from './services/localAuthService';

// Loading fallback component
const LoadingFallback = () => (
  <div className="flex items-center justify-center h-full min-h-[400px]">
    <div className="flex flex-col items-center gap-4">
      <div className="w-12 h-12 border-4 border-brand border-t-transparent rounded-full animate-spin"></div>
      <span className="text-slate-500 font-medium">Loading...</span>
    </div>
  </div>
);

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [showAuth, setShowAuth] = useState(false);
  const [authView, setAuthView] = useState<'LOGIN' | 'SIGNUP'>('LOGIN');
  const [currentView, setCurrentView] = useState<keyof typeof ViewState>(ViewState.WALL);
  const [user, setUser] = useState<any>(null);
  const [showLanding, setShowLanding] = useState(true); // Show landing by default
  
  // Extract invite code from URL (e.g., ?invite=ABC123)
  const [inviteCode, setInviteCode] = useState<string>(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('invite') || '';
  });

  // If there's an invite code in URL, auto-show signup
  useEffect(() => {
    if (inviteCode && !isLoggedIn) {
      setShowLanding(false);
      setShowAuth(true);
      setAuthView('SIGNUP');
    }
  }, [inviteCode, isLoggedIn]);

  // Unified Identity Sync function
  const syncUserIdentity = async (supabaseUser: any) => {
    if (!supabaseUser?.id) {
      setIsLoggedIn(false);
      setUser(null);
      return;
    }

    try {
      // Try to fetch existing profile
      let profile = await getUserProfile(supabaseUser.id);
      
      // If no profile exists, create one (JIT provisioning)
      if (!profile) {
        const metadata = supabaseUser.user_metadata || {};
        await createUserProfile(supabaseUser.id, {
          full_name: metadata.full_name || supabaseUser.email?.split('@')[0] || 'New User',
          role: metadata.role || 'STUDENT'
        });
        profile = await getUserProfile(supabaseUser.id);
      }

      if (profile) {
        // Normalize the role from DB to match our enum
        const roleMap: Record<string, UserRole> = {
          'STUDENT': UserRole.STUDENT,
          'TEACHER': UserRole.TEACHER,
          'PEER_TUTOR': UserRole.PEER_TUTOR
        };
        
        setUser({
          ...profile,
          role: roleMap[profile.role] || UserRole.STUDENT
        });
        setIsLoggedIn(true);
      } else {
        // Fallback if profile creation failed
        setUser({
          id: supabaseUser.id,
          name: supabaseUser.email?.split('@')[0] || 'User',
          role: UserRole.STUDENT,
          avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${supabaseUser.id}`,
          level: 'STARTER'
        });
        setIsLoggedIn(true);
      }
    } catch (e) {
      console.error("Error syncing user identity:", e);
      // Set minimal user to avoid blocking the app
      setUser({
        id: supabaseUser.id,
        name: supabaseUser.email?.split('@')[0] || 'User',
        role: UserRole.STUDENT,
        avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${supabaseUser.id}`,
        level: 'STARTER'
      });
      setIsLoggedIn(true);
    }
  };

  const refreshUser = async () => {
    if (user?.id) {
      const profile = await getUserProfile(user.id);
      if (profile) {
        const roleMap: Record<string, UserRole> = {
          'STUDENT': UserRole.STUDENT,
          'TEACHER': UserRole.TEACHER,
          'PEER_TUTOR': UserRole.PEER_TUTOR
        };
        setUser({
          ...profile,
          role: roleMap[profile.role] || UserRole.STUDENT
        });
      }
    }
  };

  useEffect(() => {
    // Check initial session
    const checkUser = async () => {
      try {
        const session = await authService.getSession();
        if (session?.user) {
          await syncUserIdentity(session.user);
        }
      } catch (e) {
        console.error("Initial Session Check Failed", e);
      } finally {
        setIsInitialLoading(false);
      }
    };
    checkUser();

    // Listen for auth state changes
    let authSubscription;
    
    // Only subscribe to auth state changes if we can successfully connect to Supabase
    try {
      const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
        if ((event === 'SIGNED_IN' || event === 'INITIAL_SESSION' || event === 'USER_UPDATED') && session) {
          await syncUserIdentity(session.user);
          setShowAuth(false);
        } else if (event === 'SIGNED_OUT') {
          setIsLoggedIn(false);
          setUser(null);
          setCurrentView(ViewState.WALL);
        }
      });
      authSubscription = subscription;
    } catch (e) {
      console.warn("Could not establish auth listener due to network issues:", e);
      // Fallback: implement manual session checking periodically
      const sessionCheckInterval = setInterval(async () => {
        try {
          const session = await authService.getSession();
          if (session?.user) {
            await syncUserIdentity(session.user);
          } else {
            setIsLoggedIn(false);
            setUser(null);
          }
        } catch (err) {
          // Ignore errors during periodic checks
        }
      }, 30000); // Check every 30 seconds
      
      return () => clearInterval(sessionCheckInterval);
    }

    return () => {
      if (authSubscription) {
        authSubscription.unsubscribe();
      }
    };
  }, []);

  const handleLogout = async () => {
    try {
      await authService.signOut();
      setIsLoggedIn(false);
      setUser(null);
      setCurrentView(ViewState.WALL);
    } catch (e) {
      console.error("Logout error:", e);
    }
  };

  const handleAuthRequired = (view: 'LOGIN' | 'SIGNUP' = 'SIGNUP') => {
    setAuthView(view);
    setShowAuth(true);
  };

  if (isInitialLoading) {
    return (
      <div className="h-screen w-full bg-slate-50 flex flex-col items-center justify-center gap-6">
        <Icons.CloudSync className="w-16 h-16 text-brand animate-spin" />
        <span className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-400 animate-pulse">Neural Handshake Active...</span>
      </div>
    );
  }

  if (showAuth && !isLoggedIn) {
    return (
      <Suspense fallback={<LoadingFallback />}>
        {authView === 'LOGIN'
          ? <Login onLogin={() => setShowAuth(false)} onSwitch={() => setAuthView('SIGNUP')} onBack={() => { setShowAuth(false); setShowLanding(true); }} />
          : <SignUp onSignUp={() => setShowAuth(false)} onSwitch={() => setAuthView('LOGIN')} onBack={() => { setShowAuth(false); setShowLanding(true); }} initialInviteCode={inviteCode} />}
      </Suspense>
    );
  }

  // Show landing page for non-logged-in users who haven't skipped it
  if (!isLoggedIn && showLanding) {
    return (
      <Suspense fallback={<LoadingFallback />}>
        <Landing 
          onGetStarted={() => {
            setShowLanding(false);
            handleAuthRequired('SIGNUP');
          }}
          onLogin={() => {
            setShowLanding(false);
            handleAuthRequired('LOGIN');
          }}
        />
      </Suspense>
    );
  }

  const renderView = () => {
    if (isLoggedIn && !user && currentView !== ViewState.WALL) {
      return (
        <div className="h-full flex flex-col items-center justify-center gap-6 opacity-50">
          <Icons.CloudSync className="w-12 h-12 text-brand animate-spin" />
          <span className="text-[10px] font-black uppercase tracking-[0.3em]">Synchronizing Identity...</span>
        </div>
      );
    }

    // Role Guard: Prevent Students from accessing Teacher Views and vice versa if URL manipulation was possible (conceptually)
    // Though UI hides buttons, this is a render-level safety check.
    if (user?.role === UserRole.TEACHER) {
      if (currentView === ViewState.ROOMS || currentView === ViewState.TESTS || currentView === ViewState.STORE || currentView === ViewState.WALL) {
        // Fallback if teacher ends up on student view
        return <StudyWall setView={(v) => setCurrentView(v as any)} isLoggedIn={isLoggedIn} userId={user?.id} onAuthRequired={handleAuthRequired} mode="FACULTY" />;
      }
    }

    switch (currentView) {
      case ViewState.WALL:
        return <StudyWall setView={(v) => setCurrentView(v as any)} isLoggedIn={isLoggedIn} userId={user?.id} onAuthRequired={handleAuthRequired} mode="PUBLIC" />;
      case ViewState.FACULTY_ROOM:
        return <StudyWall setView={(v) => setCurrentView(v as any)} isLoggedIn={isLoggedIn} userId={user?.id} onAuthRequired={handleAuthRequired} mode="FACULTY" />;
      case ViewState.ROOMS:
        return <StudyRooms userId={user?.id} />;
      case ViewState.AI_DECK:
        return <AIDeck />;
      case ViewState.TEACHERS:
        return <TeachersLounge userId={user?.id} />;
      case ViewState.PROFILE:
        return <Profile onLogout={handleLogout} userId={user?.id} onProfileUpdate={refreshUser} />;
      case ViewState.TESTS:
        return <MockTests userId={user?.id} />;
      case ViewState.STORE:
        return <StudentStore />;
      case ViewState.ROOM_DETAIL:
        return <LibraryVault />;
      case ViewState.MESSAGES:
        return <DirectMessages userId={user?.id} />;
      case ViewState.DASHBOARD:
        return <MentorDashboard defaultTab="IMPACT" />;
      // MY_CLASS Removed
      default:
        // Default fallback
        if (user?.role === UserRole.TEACHER) return <StudyWall setView={(v) => setCurrentView(v as any)} isLoggedIn={isLoggedIn} userId={user?.id} onAuthRequired={handleAuthRequired} mode="FACULTY" />;
        return <StudyWall setView={(v) => setCurrentView(v as any)} isLoggedIn={isLoggedIn} userId={user?.id} onAuthRequired={handleAuthRequired} mode="PUBLIC" />;
    }
  };

  return (
    <Layout
      currentView={currentView as any}
      setView={(v) => {
        setCurrentView(v as any);
      }}
      isLoggedIn={isLoggedIn}
      userName={user?.name}
      userRole={user?.role} // Pass the normalized role
      userAvatar={user?.avatar}
      onLoginClick={() => handleAuthRequired('LOGIN')}
    >
      <Suspense fallback={<LoadingFallback />}>
        {renderView()}
      </Suspense>
    </Layout>
  );
}

export default App;
