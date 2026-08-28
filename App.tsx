
import React, { useState, useEffect } from 'react';
import { Layout } from './components/Layout';
import { ViewState, UserRole } from './types';
import { LandingPage } from './components/views/LandingPage';
import { StudyWall } from './components/views/StudyWall';
import { StudyRooms } from './components/views/StudyRooms';
import { AIDeck } from './components/views/AIDeck';
import { Profile } from './components/views/Profile';
import { TeachersLounge } from './components/views/TeachersLounge';
import { MockTests } from './components/views/MockTests';
import { StudentStore } from './components/views/StudentStore';
import { LibraryVault } from './components/views/LibraryVault';
import { MentorDashboard } from './components/views/MentorDashboard';
import { DoubtDesk } from './components/views/DoubtDesk';
import { MasteryPath } from './components/views/MasteryPath';
import { LaunchMomentum } from './components/views/LaunchMomentum';
import { Login } from './components/auth/Login';
import { SignUp } from './components/auth/SignUp';
import { authService, getUserProfile, createUserProfile } from './services/fetsService';
import { supabase } from './services/supabaseClient';
import { Icons } from './components/Icons';

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [showAuth, setShowAuth] = useState(false);
  const [authView, setAuthView] = useState<'LOGIN' | 'SIGNUP'>('LOGIN');
  const [currentView, setCurrentView] = useState<keyof typeof ViewState>(ViewState.LANDING);
  const [user, setUser] = useState<any>(null);
  const [isLaunchModalOpen, setIsLaunchModalOpen] = useState(false);

  const syncUserIdentity = async (supabaseUser: any) => {
    if (!supabaseUser) return;
    
    try {
      let profile = await getUserProfile(supabaseUser.id);
      
      if (!profile) {
        profile = await createUserProfile(supabaseUser.id, supabaseUser.user_metadata);
      }
      
      if (profile) {
        setUser(profile);
        setIsLoggedIn(true);

        if (profile.role === UserRole.TEACHER) {
             if (currentView === ViewState.WALL || currentView === ViewState.ROOMS || currentView === ViewState.TESTS || currentView === ViewState.LANDING) {
                 setCurrentView(ViewState.FACULTY_ROOM);
             }
        } else if (currentView === ViewState.LANDING) {
             setCurrentView(ViewState.WALL);
        }
      }
    } catch (e) {
      console.error("Identity Sync Failed", e);
    }
  };

  const refreshUser = async () => {
    if (user?.id) {
        const updated = await getUserProfile(user.id);
        if (updated) setUser(updated);
    }
  };

  useEffect(() => {
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
        setCurrentView(ViewState.LANDING);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleLogout = async () => {
    try {
      await authService.signOut();
    } catch (e) {
      setIsLoggedIn(false);
      setUser(null);
      setCurrentView(ViewState.LANDING);
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
    return authView === 'LOGIN' 
      ? <Login onLogin={() => setShowAuth(false)} onSwitch={() => setAuthView('SIGNUP')} onBack={() => setShowAuth(false)} />
      : <SignUp onSignUp={() => setShowAuth(false)} onSwitch={() => setAuthView('LOGIN')} onBack={() => setShowAuth(false)} />;
  }

  const renderView = () => {
    if (currentView === ViewState.LANDING && !isLoggedIn) {
        return <LandingPage onLogin={() => handleAuthRequired('LOGIN')} onStartFree={() => handleAuthRequired('SIGNUP')} />;
    }

    if (isLoggedIn && !user && currentView !== ViewState.WALL) {
      return (
        <div className="h-full flex flex-col items-center justify-center gap-6 opacity-50">
          <Icons.CloudSync className="w-12 h-12 text-brand animate-spin" />
          <span className="text-[10px] font-black uppercase tracking-[0.3em]">Synchronizing Identity...</span>
        </div>
      );
    }

    if (user?.role === UserRole.TEACHER) {
         if (currentView === ViewState.ROOMS || currentView === ViewState.TESTS || currentView === ViewState.STORE || currentView === ViewState.WALL || currentView === ViewState.LANDING) {
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
        return <DoubtDesk userId={user?.id} />;
      case ViewState.MASTERY_PATH:
        return <MasteryPath />;
      case ViewState.DASHBOARD:
        return <MentorDashboard defaultTab="IMPACT" />;
      case ViewState.LAUNCH_MOMENTUM:
        return <LaunchMomentum userId={user?.id} userName={user?.name} userAvatar={user?.avatar} />;
      default:
        if (user?.role === UserRole.TEACHER) return <StudyWall setView={(v) => setCurrentView(v as any)} isLoggedIn={isLoggedIn} userId={user?.id} onAuthRequired={handleAuthRequired} mode="FACULTY" />;
        return <StudyWall setView={(v) => setCurrentView(v as any)} isLoggedIn={isLoggedIn} userId={user?.id} onAuthRequired={handleAuthRequired} mode="PUBLIC" />;
    }
  };

  return (
    <Layout 
      currentView={currentView as any} 
      setView={(v) => {
        if (v === ViewState.LAUNCH_MOMENTUM) {
          setIsLaunchModalOpen(true);
          return;
        }
        if (!isLoggedIn && v !== ViewState.LANDING && v !== ViewState.WALL && v !== ViewState.FACULTY_ROOM) {
          handleAuthRequired('LOGIN');
        } else {
          setCurrentView(v as any);
        }
      }}
      isLoggedIn={isLoggedIn}
      userName={user?.name}
      userRole={user?.role}
      userAvatar={user?.avatar}
      userId={user?.id}
      isLaunchModalOpen={isLaunchModalOpen}
      setIsLaunchModalOpen={setIsLaunchModalOpen}
      onLoginClick={() => handleAuthRequired('LOGIN')}
    >
      {renderView()}
    </Layout>
  );
}

export default App;
