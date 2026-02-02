
import React, { useState, useEffect } from 'react';
import { Layout } from './components/Layout';
import { ViewState, UserRole } from './types';
import { StudyWall } from './components/views/StudyWall';
import { StudyRooms } from './components/views/StudyRooms';
import { AIDeck } from './components/views/AIDeck';
import { Profile } from './components/views/Profile';
import { TeachersLounge } from './components/views/TeachersLounge';
import { MockTests } from './components/views/MockTests';
import { StudentStore } from './components/views/StudentStore';
import { LibraryVault } from './components/views/LibraryVault';
import { MentorDashboard } from './components/views/MentorDashboard';
import { DirectMessages } from './components/views/DirectMessages';
import { Login } from './components/auth/Login';
import { SignUp } from './components/auth/SignUp';
import { authService, getUserProfile, createUserProfile } from './services/fetsService';
import { supabase } from './services/supabaseClient';
import { Icons } from './components/Icons';

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(true);
  const [isInitialLoading, setIsInitialLoading] = useState(false);
  const [showAuth, setShowAuth] = useState(false);
  const [authView, setAuthView] = useState<'LOGIN' | 'SIGNUP'>('LOGIN');
  const [currentView, setCurrentView] = useState<keyof typeof ViewState>(ViewState.WALL);
  const [user, setUser] = useState<any>({
    id: '00000000-0000-0000-0000-000000000000',
    name: 'Guest Explorer',
    role: UserRole.STUDENT,
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Guest',
    level: 'SCHOLAR'
  });

  // Unified Identity Sync function
  const syncUserIdentity = async (supabaseUser: any) => {
    // Auth-free mode: We use the mock user
    return;
  };

  const refreshUser = async () => {
    // Auth-free mode: No refresh needed
  };

  useEffect(() => {
    // Auth-free mode: Disabling auth checks and listeners
    /*
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

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if ((event === 'SIGNED_IN' || event === 'INITIAL_SESSION' || event === 'USER_UPDATED') && session) {
        await syncUserIdentity(session.user);
      } else if (event === 'SIGNED_OUT') {
        setIsLoggedIn(false);
        setUser(null);
        setCurrentView(ViewState.WALL);
      }
    });

    return () => subscription.unsubscribe();
    */
  }, []);

  const handleLogout = async () => {
    // Auth-free mode: Reset to guest
    setIsLoggedIn(true);
    setCurrentView(ViewState.WALL);
  };

  const handleAuthRequired = (view: 'LOGIN' | 'SIGNUP' = 'SIGNUP') => {
    // Auth-free mode: Ignore auth requests
    console.log("Auth required ignored in auth-free mode");
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
    return authView === 'LOGIN'
      ? <Login onLogin={() => setShowAuth(false)} onSwitch={() => setAuthView('SIGNUP')} onBack={() => setShowAuth(false)} />
      : <SignUp onSignUp={() => setShowAuth(false)} onSwitch={() => setAuthView('LOGIN')} onBack={() => setShowAuth(false)} />;
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
      {renderView()}
    </Layout>
  );
}

export default App;
