import React, { useState, useEffect } from 'react';
import { Routes, Route, useNavigate, useLocation, Navigate } from 'react-router-dom';
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
import { AuthPage } from './components/auth/AuthPage';
import { LandingPage } from './components/views/LandingPage';
import { authService, getUserProfile, createUserProfile } from './services/fetsService';
import { supabase } from './services/supabaseClient';
import { Icons } from './components/Icons';

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState<any>(null);

  const syncUserIdentity = async (supabaseUser: any) => {
    if (!supabaseUser?.id) {
      setIsLoggedIn(false);
      setUser(null);
      return;
    }

    try {
      let profile = await getUserProfile(supabaseUser.id);
      if (!profile) {
        const metadata = supabaseUser.user_metadata || {};
        await createUserProfile(supabaseUser.id, {
          full_name: metadata.full_name || supabaseUser.email?.split('@')[0] || 'New User',
          role: metadata.role || 'STUDENT'
        });
        profile = await getUserProfile(supabaseUser.id);
      }

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
        setIsLoggedIn(true);
      } else {
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
        navigate('/');
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleLogout = async () => {
    try {
      await authService.signOut();
      setIsLoggedIn(false);
      setUser(null);
      navigate('/');
    } catch (e) {
      console.error("Logout error:", e);
    }
  };

  if (isInitialLoading) {
    return (
      <div className="h-screen w-full bg-slate-900 flex flex-col items-center justify-center gap-6">
        <Icons.CloudSync className="w-16 h-16 text-brand animate-spin" />
        <span className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-400 animate-pulse">Neural Handshake Active...</span>
      </div>
    );
  }

  // Redirect Logic
  if (isLoggedIn && (location.pathname === '/' || location.pathname === '/login' || location.pathname === '/home')) {
    return <Navigate to="/deck" replace />;
  }

  if (!isLoggedIn) {
    return (
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/home" element={<LandingPage />} />
        <Route path="/login" element={<AuthPage onSuccess={() => navigate('/deck')} />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    );
  }

  // Authenticated State Loading
  if (isLoggedIn && !user) {
    return (
      <div className="h-screen flex flex-col items-center justify-center gap-6 bg-slate-900 opacity-80">
        <Icons.CloudSync className="w-12 h-12 text-brand animate-spin" />
        <span className="text-[10px] text-white font-black uppercase tracking-[0.3em]">Synchronizing Identity...</span>
      </div>
    );
  }

  // Authenticated Routes wrapper
  return (
    <Layout
      isLoggedIn={isLoggedIn}
      userName={user?.name}
      userRole={user?.role}
      userAvatar={user?.avatar}
      handleLogout={handleLogout}
    >
      <Routes>
        <Route path="/deck" element={<StudyWall setView={() => { }} isLoggedIn={isLoggedIn} userId={user?.id} mode={user?.role === UserRole.TEACHER ? "FACULTY" : "PUBLIC"} />} />
        <Route path="/rooms" element={<StudyRooms userId={user?.id} />} />
        <Route path="/rooms/:roomId" element={<StudyRooms userId={user?.id} />} />
        <Route path="/ai" element={<AIDeck />} />
        <Route path="/alignments" element={<TeachersLounge userId={user?.id} />} />
        <Route path="/profile/:id" element={<Profile onLogout={handleLogout} userId={user?.id} onProfileUpdate={refreshUser} />} />
        <Route path="/profile" element={<Profile onLogout={handleLogout} userId={user?.id} onProfileUpdate={refreshUser} />} />
        <Route path="/mentor-dashboard" element={<MentorDashboard defaultTab="IMPACT" />} />
        <Route path="/messages" element={<DirectMessages userId={user?.id} />} />
        <Route path="/tests" element={<MockTests userId={user?.id} />} />
        <Route path="/store" element={<StudentStore />} />
        <Route path="/library" element={<LibraryVault />} />
        <Route path="*" element={
          <div className="flex flex-col items-center justify-center h-full gap-4 p-8 text-center animate-in fade-in duration-500">
            <h1 className="text-4xl sm:text-6xl font-black text-slate-900 tracking-tighter">404</h1>
            <p className="text-slate-500 font-bold uppercase tracking-widest text-sm">Zone Not Found Or Restricted</p>
            <button onClick={() => navigate('/deck')} className="mt-4 px-8 py-4 bg-slate-900 text-white rounded-xl font-black text-xs uppercase tracking-widest hover:bg-brand transition-all shadow-xl hover:-translate-y-1 active:scale-95">
              Return to Deck
            </button>
          </div>
        } />
      </Routes>
    </Layout>
  );
}

export default App;
