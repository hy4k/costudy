
import React, { useState, useEffect, useRef } from 'react';
import { ViewState, CoStudyCloudStatus, UserRole, Notification } from '../types';
import { Icons } from './Icons';
import { getCoStudyCloudStatus } from '../services/fetsService';
import { notificationService } from '../services/costudyService';
import { supabase } from '../services/supabaseClient';

interface LayoutProps {
  currentView: keyof ViewState;
  setView: (view: keyof ViewState) => void;
  children: React.ReactNode;
  isLoggedIn: boolean;
  onLoginClick: () => void;
  userName?: string;
  userRole?: UserRole;
  userAvatar?: string;
}

export const Layout: React.FC<LayoutProps> = ({ currentView, setView, children, isLoggedIn, onLoginClick, userName, userRole, userAvatar }) => {
  const [cloudStatus, setCloudStatus] = useState<CoStudyCloudStatus>(getCoStudyCloudStatus());
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  // Panic Button State
  const [showPanicModal, setShowPanicModal] = useState(false);
  const [isPanicConnecting, setIsPanicConnecting] = useState(false);

  const notificationRef = useRef<HTMLDivElement>(null);

  // -- THEME SWITCHER LOGIC --
  useEffect(() => {
    const root = document.documentElement;
    if (userRole === UserRole.TEACHER) {
        // Teacher Theme (Emerald/Specialist)
        root.style.setProperty('--color-brand-50', '#ecfdf5');
        root.style.setProperty('--color-brand-100', '#d1fae5');
        root.style.setProperty('--color-brand-200', '#a7f3d0');
        root.style.setProperty('--color-brand-300', '#6ee7b7');
        root.style.setProperty('--color-brand-400', '#34d399');
        root.style.setProperty('--color-brand-500', '#10b981'); // Emerald 500
        root.style.setProperty('--color-brand-600', '#059669'); // Emerald 600
        root.style.setProperty('--color-brand-700', '#047857');
        root.style.setProperty('--color-brand-800', '#065f46');
        root.style.setProperty('--color-brand-900', '#064e3b');
    } else {
        // Student Theme (Red/Brand)
        root.style.setProperty('--color-brand-50', '#fff1f1');
        root.style.setProperty('--color-brand-100', '#ffdfdf');
        root.style.setProperty('--color-brand-200', '#ffc5c5');
        root.style.setProperty('--color-brand-300', '#ff9d9d');
        root.style.setProperty('--color-brand-400', '#ff6464');
        root.style.setProperty('--color-brand-500', '#ff1a1a');
        root.style.setProperty('--color-brand-600', '#ed0000');
        root.style.setProperty('--color-brand-700', '#c80000');
        root.style.setProperty('--color-brand-800', '#a50404');
        root.style.setProperty('--color-brand-900', '#890b0b');
    }
  }, [userRole]);

  useEffect(() => {
    const interval = setInterval(() => {
      setCloudStatus(getCoStudyCloudStatus());
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  // -- NOTIFICATION LOGIC --
  useEffect(() => {
    if (isLoggedIn) {
        const fetchNotes = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                const data = await notificationService.getNotifications(user.id);
                setNotifications(data);
                setUnreadCount(data.filter(n => !n.is_read).length);
            }
        };
        fetchNotes();

        // Subscribe to real-time notifications
        const channel = supabase.channel('user-notifications')
            .on(
                'postgres_changes',
                { event: 'INSERT', schema: 'public', table: 'notifications' },
                (payload) => {
                    const newNote = payload.new as Notification;
                    setNotifications(prev => [newNote, ...prev]);
                    setUnreadCount(prev => prev + 1);
                }
            )
            .subscribe();

        return () => { supabase.removeChannel(channel); };
    }
  }, [isLoggedIn]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleMarkAllRead = async () => {
      if (notifications.length === 0) return;
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
          await notificationService.markAllAsRead(user.id);
          setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
          setUnreadCount(0);
      }
  };

  const handleNotificationClick = async (note: Notification) => {
      if (!note.is_read) {
          await notificationService.markAsRead(note.id);
          setNotifications(prev => prev.map(n => n.id === note.id ? { ...n, is_read: true } : n));
          setUnreadCount(prev => Math.max(0, prev - 1));
      }
      
      if (note.link) {
          if (note.link === 'MESSAGES') setView(ViewState.MESSAGES);
          else if (note.link === 'WALL') setView(ViewState.WALL);
          else if (note.link === 'DASHBOARD') setView(ViewState.DASHBOARD);
      }
      setShowNotifications(false);
  };

  const handleNavClick = (view: keyof ViewState) => {
      setView(view);
      setIsMobileMenuOpen(false);
  };

  const handlePanicConnect = () => {
      setIsPanicConnecting(true);
      setTimeout(() => {
          setIsPanicConnecting(false);
          setShowPanicModal(false);
          alert("Rapid Response Unit Dispatched. A specialized mentor will join your session in 30 seconds.");
          // Ideally redirect to a specific 'Emergency Room'
          setView(ViewState.ROOMS); 
      }, 2000);
  };

  const NavButton = ({ view, label, isMobile = false }: { view: keyof ViewState; label: string; isMobile?: boolean }) => {
    if (isMobile) {
        return (
            <button 
                onClick={() => handleNavClick(view)}
                className={`w-full py-4 px-6 text-left text-sm font-black uppercase tracking-widest rounded-xl transition-all ${currentView === view ? 'bg-brand text-white shadow-lg' : 'text-slate-500 hover:bg-slate-100'}`}
            >
                {label}
            </button>
        );
    }
    return (
        <div className="container-button" style={{ width: '130px' }} onClick={() => setView(view)}>
          <div className="hover-area bt-1"></div>
          <div className="hover-area bt-2"></div>
          <div className="hover-area bt-3"></div>
          <div className="hover-area bt-4"></div>
          <div className="hover-area bt-5"></div>
          <div className="hover-area bt-6"></div>
          <button className={`tilt-btn ${currentView === view ? 'active' : ''} whitespace-nowrap text-[10px] px-2`}>
            {label}
          </button>
        </div>
    );
  };

  const renderNavItems = (isMobile = false) => {
      if (userRole === UserRole.TEACHER) {
          return (
            <>
               <NavButton view={ViewState.FACULTY_ROOM} label="Faculty Room" isMobile={isMobile} />
               <NavButton view={ViewState.DASHBOARD} label="Command Center" isMobile={isMobile} />
               <NavButton view={ViewState.AI_DECK} label="Teaching Deck" isMobile={isMobile} />
               <NavButton view={ViewState.MESSAGES} label="Messages" isMobile={isMobile} />
               <NavButton view={ViewState.PROFILE} label="Faculty Profile" isMobile={isMobile} />
            </>
          );
      }
      return (
        <>
          <NavButton view={ViewState.WALL} label="Social Wall" isMobile={isMobile} />
          <NavButton view={ViewState.AI_DECK} label="AI Deck" isMobile={isMobile} />
          <NavButton view={ViewState.TESTS} label="Mocks" isMobile={isMobile} />
          <NavButton view={ViewState.ROOMS} label="Study Rooms" isMobile={isMobile} />
          <NavButton view={ViewState.TEACHERS} label="Mentors" isMobile={isMobile} />
          {isLoggedIn && <NavButton view={ViewState.MESSAGES} label="Messages" isMobile={isMobile} />}
          <NavButton view={ViewState.PROFILE} label="My Study" isMobile={isMobile} />
        </>
      );
  };

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-slate-50 text-slate-900 selection:bg-brand selection:text-white relative">
      {/* PANIC BUTTON (Exam Week Simulation) */}
      {isLoggedIn && userRole === UserRole.STUDENT && (
          <>
            <div className="fixed bottom-10 left-8 z-50">
                <button 
                    onClick={() => setShowPanicModal(true)}
                    className="w-16 h-16 bg-red-600 rounded-full flex items-center justify-center shadow-[0_0_30px_rgba(220,38,38,0.5)] animate-pulse hover:scale-110 transition-transform active:scale-95 group border-4 border-white"
                    title="Exam Panic Button"
                >
                    <Icons.AlertCircle className="w-8 h-8 text-white" />
                    <span className="absolute left-full ml-4 bg-slate-900 text-white text-[10px] font-black px-3 py-1 rounded-lg uppercase tracking-widest whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">
                        Exam SOS
                    </span>
                </button>
            </div>

            {showPanicModal && (
                <div className="fixed inset-0 z-[60] bg-red-950/90 backdrop-blur-xl flex items-center justify-center p-6 animate-in fade-in duration-300">
                    <div className="bg-white rounded-[3rem] p-12 max-w-lg w-full text-center shadow-2xl relative overflow-hidden">
                        <div className="absolute top-0 left-0 right-0 h-4 bg-red-600 animate-pulse"></div>
                        <Icons.AlertCircle className="w-24 h-24 text-red-600 mx-auto mb-6" />
                        <h2 className="text-4xl font-black text-slate-900 uppercase tracking-tighter mb-4">Panic Protocol</h2>
                        <p className="text-slate-500 font-bold text-sm uppercase tracking-widest mb-8">
                            Initiating emergency connection to a Rapid Response Mentor.
                        </p>
                        
                        <div className="bg-slate-100 rounded-2xl p-6 mb-8 border border-slate-200">
                            <div className="flex justify-between items-center mb-2">
                                <span className="text-xs font-black text-slate-500 uppercase tracking-widest">Est. Wait</span>
                                <span className="text-sm font-black text-slate-900">&lt; 30 Seconds</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-xs font-black text-slate-500 uppercase tracking-widest">Cost</span>
                                <span className="text-sm font-black text-slate-900">500 Credits</span>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <button 
                                onClick={handlePanicConnect}
                                disabled={isPanicConnecting}
                                className="w-full py-5 bg-red-600 text-white rounded-2xl text-xs font-black uppercase tracking-[0.2em] shadow-xl hover:bg-red-700 transition-all flex items-center justify-center gap-3"
                            >
                                {isPanicConnecting ? <><Icons.CloudSync className="w-4 h-4 animate-spin" /> DISPATCHING...</> : 'CONFIRM SOS REQUEST'}
                            </button>
                            <button 
                                onClick={() => setShowPanicModal(false)}
                                className="w-full py-4 text-slate-400 font-black text-xs uppercase tracking-widest hover:text-slate-900"
                            >
                                Cancel Alert
                            </button>
                        </div>
                    </div>
                </div>
            )}
          </>
      )}

      {/* Lowered z-index from 30 to 10 to ensure system icons are clickable */}
      <nav className="h-20 flex items-center justify-between px-6 sm:px-8 bg-white/80 backdrop-blur-2xl border-b border-slate-200 z-40 relative">
        <div className="flex items-center gap-4 sm:gap-6">
            {/* Mobile Menu Toggle */}
            <button 
                className="lg:hidden p-2 text-slate-500 hover:text-slate-900 transition-colors"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
                {isMobileMenuOpen ? <Icons.Plus className="w-6 h-6 rotate-45" /> : <Icons.Grid className="w-6 h-6" />}
            </button>

            <div className="flex items-center gap-3 cursor-pointer group" onClick={() => setView(userRole === UserRole.TEACHER ? ViewState.FACULTY_ROOM : ViewState.WALL)}>
                <div className="group-hover:rotate-12 transition-transform duration-500">
                    <Icons.Logo className="w-8 h-8 sm:w-10 sm:h-10" />
                </div>
                <span className="text-xl sm:text-2xl font-black tracking-tighter text-slate-900 uppercase block">CoStudy</span>
            </div>
        </div>

        <div className="hidden lg:flex flex-1 justify-center gap-2 px-4">
          {renderNavItems()}
        </div>

        <div className="flex gap-3 items-center">
          <div className="hidden lg:block h-8 w-px bg-slate-200 mx-2"></div>
          {isLoggedIn ? (
            <div className="flex gap-4 items-center">
              {/* NOTIFICATION BELL */}
              <div className="relative" ref={notificationRef}>
                  <button 
                    onClick={() => setShowNotifications(!showNotifications)} 
                    className={`p-2.5 rounded-xl transition-all relative ${showNotifications ? 'bg-brand text-white shadow-lg' : 'bg-slate-100 text-slate-500 hover:text-brand'}`}
                  >
                     <Icons.Bell className="w-5 h-5" />
                     {unreadCount > 0 && (
                        <div className="absolute top-1.5 right-2 w-2 h-2 bg-rose-500 rounded-full border-2 border-white animate-pulse"></div>
                     )}
                  </button>

                  {/* NOTIFICATION DROPDOWN */}
                  {showNotifications && (
                      <div className="absolute top-full right-0 mt-4 w-72 sm:w-96 bg-white rounded-[2rem] border border-slate-100 shadow-[0_20px_50px_-10px_rgba(0,0,0,0.1)] overflow-hidden animate-in slide-in-from-top-4 z-20">
                          <div className="p-6 border-b border-slate-50 bg-slate-50/50 flex justify-between items-center">
                              <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Notifications</h4>
                              {unreadCount > 0 && (
                                  <button onClick={handleMarkAllRead} className="text-[9px] font-bold text-brand hover:underline">Mark all read</button>
                              )}
                          </div>
                          <div className="max-h-[300px] overflow-y-auto no-scrollbar">
                              {notifications.length === 0 ? (
                                  <div className="p-10 text-center opacity-40">
                                      <Icons.Bell className="w-10 h-10 mx-auto mb-3 text-slate-300" />
                                      <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">All caught up</p>
                                  </div>
                              ) : (
                                  <div className="divide-y divide-slate-50">
                                      {notifications.map(note => (
                                          <div 
                                            key={note.id} 
                                            onClick={() => handleNotificationClick(note)}
                                            className={`p-5 flex gap-4 hover:bg-slate-50 transition-colors cursor-pointer ${!note.is_read ? 'bg-brand/[0.02]' : ''}`}
                                          >
                                              <div className={`mt-1 p-2 rounded-xl shrink-0 ${
                                                  note.type === 'MESSAGE' ? 'bg-brand/10 text-brand' : 
                                                  note.type === 'ALERT' ? 'bg-amber-500/10 text-amber-500' :
                                                  'bg-slate-100 text-slate-400'
                                              }`}>
                                                  {note.type === 'MESSAGE' ? <Icons.MessageCircle className="w-4 h-4" /> : 
                                                   note.type === 'ALERT' ? <Icons.Bell className="w-4 h-4" /> :
                                                   <Icons.CloudSync className="w-4 h-4" />}
                                              </div>
                                              <div className="flex-1 min-w-0">
                                                  <p className={`text-xs font-medium leading-relaxed ${!note.is_read ? 'text-slate-900 font-bold' : 'text-slate-500'}`}>
                                                      {note.content}
                                                  </p>
                                                  <span className="text-[9px] font-bold text-slate-300 mt-1 block uppercase">{new Date(note.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                                              </div>
                                              {!note.is_read && (
                                                  <div className="w-2 h-2 bg-brand rounded-full mt-2"></div>
                                              )}
                                          </div>
                                      ))}
                                  </div>
                              )}
                          </div>
                      </div>
                  )}
              </div>

              <button onClick={() => setView(ViewState.PROFILE)} className="flex items-center gap-3 group">
                <div className="text-right hidden sm:block">
                    <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">{userRole === UserRole.TEACHER ? 'Specialist' : 'Scholar'}</div>
                    <div className="text-[11px] font-black text-slate-900 uppercase tracking-tighter">{userName || 'My Account'}</div>
                </div>
                <img 
                  src={userAvatar || `https://i.pravatar.cc/100?u=${userName || 'me'}`} 
                  className="w-10 h-10 rounded-xl object-cover ring-2 ring-slate-100 group-hover:ring-brand transition-all" 
                  alt="Profile" 
                />
              </button>
            </div>
          ) : (
            <button 
              onClick={onLoginClick}
              className="px-6 sm:px-8 py-3 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-brand transition-all shadow-xl active:scale-95 whitespace-nowrap"
            >
              Log In
            </button>
          )}
        </div>
      </nav>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
          <div className="fixed inset-0 top-20 z-40 bg-white/95 backdrop-blur-xl lg:hidden animate-in slide-in-from-top-10 duration-300 flex flex-col p-6 overflow-y-auto">
              <div className="space-y-2">
                  {renderNavItems(true)}
              </div>
          </div>
      )}

      <main className="flex-1 overflow-y-auto relative no-scrollbar">
        <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-40">
          <div className="absolute top-1/4 -left-1/4 w-[60%] h-[60%] rounded-full bg-brand/5 blur-[140px]"></div>
          <div className="absolute bottom-1/4 -right-1/4 w-[50%] h-[50%] rounded-full bg-blue-500/5 blur-[140px]"></div>
        </div>
        <div className="relative z-10 h-full">
          {children}
        </div>
      </main>
    </div>
  );
};
    