
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
const TeachersDeck = lazy(() => import('./components/views/TeachersDeck').then(m => ({ default: m.TeachersDeck })));
const Landing = lazy(() => import('./components/views/Landing').then(m => ({ default: m.Landing })));
const Login = lazy(() => import('./components/auth/Login').then(m => ({ default: m.Login })));
const SignUp = lazy(() => import('./components/auth/SignUp').then(m => ({ default: m.SignUp })));

// Payment & Admin Features
const SubscriptionModal = lazy(() => import('./components/views/SubscriptionModal'));
const ReferralDashboard = lazy(() => import('./components/views/ReferralDashboard'));
const AdminPanel = lazy(() => import('./components/views/AdminPanel'));

// Keep services as regular imports (needed immediately)
import { authService, getUserProfile, createUserProfile } from './services/fetsService';
import { supabase } from './services/supabaseClient';
import { localAuthService } from './services/localAuthService';

// Loading fallback component
const LoadingFallback = () => (
  <div className="flex min-h-[400px] h-full items-center justify-center bg-slate-50/80">
    <div className="flex flex-col items-center gap-5">
      <div className="h-12 w-12 animate-spin rounded-full border-2 border-slate-200 border-t-brand shadow-luxury-sm" />
      <span className="font-display text-sm font-medium tracking-wide text-slate-500">Loading…</span>
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
        const normalizedRole = roleMap[profile.role] || UserRole.STUDENT;
        
        setUser({
          ...profile,
          role: normalizedRole
        });
        setIsLoggedIn(true);
        // Teachers default to Faculty Room view for correct nav highlight
        if (normalizedRole === UserRole.TEACHER) {
          setCurrentView(ViewState.FACULTY_ROOM);
        }
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
      // Safety timeout: never stay on loading screen more than 5s
      const timeout = setTimeout(() => {
        setIsInitialLoading(false);
      }, 5000);

      try {
        const session = await authService.getSession();
        if (session?.user) {
          await syncUserIdentity(session.user);
        }
      } catch (e) {
        console.error("Initial Session Check Failed", e);
      } finally {
        clearTimeout(timeout);
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

  /** Run after sign-in / sign-up so we do not rely only on onAuthStateChange (fixes missed sync / race with modal close). */
  const handlePostAuthSuccess = async () => {
    try {
      const session = await authService.getSession();
      if (session?.user) {
        await syncUserIdentity(session.user);
      }
    } catch (e) {
      console.error('[CoStudy] Post-auth sync failed', e);
    } finally {
      setShowAuth(false);
    }
  };

  if (isInitialLoading) {
    return (
      <div className="flex h-screen w-full flex-col items-center justify-center gap-6 bg-gradient-to-b from-slate-50 to-slate-100">
        <Icons.CloudSync className="h-14 w-14 animate-spin text-brand drop-shadow-sm" />
        <span className="font-display text-xs font-medium tracking-[0.25em] text-slate-500">Preparing your workspace…</span>
      </div>
    );
  }

  if (showAuth && !isLoggedIn) {
    return (
      <Suspense fallback={<LoadingFallback />}>
        {authView === 'LOGIN'
          ? <Login onLogin={handlePostAuthSuccess} onSwitch={() => setAuthView('SIGNUP')} onBack={() => { setShowAuth(false); setShowLanding(true); }} />
          : <SignUp onSignUp={handlePostAuthSuccess} onSwitch={() => setAuthView('LOGIN')} onBack={() => { setShowAuth(false); setShowLanding(true); }} initialInviteCode={inviteCode} />}
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
        <div className="flex h-full flex-col items-center justify-center gap-5 opacity-50">
          <Icons.CloudSync className="h-12 w-12 animate-spin text-brand" />
          <span className="font-display text-xs tracking-wide text-slate-500">Loading profile…</span>
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
        // Teachers get TeachersDeck, Students get AIDeck
        return user?.role === UserRole.TEACHER ? <TeachersDeck /> : <AIDeck />;
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
      case ViewState.SUBSCRIPTION:
        return <SubscriptionModal user={user} onClose={() => setCurrentView(ViewState.PROFILE)} />;
      case ViewState.REFERRALS:
        return <ReferralDashboard userId={user?.id} referralCode={user?.referralCode} />;
      case ViewState.ADMIN_PANEL:
        return <AdminPanel user={user} />;
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
