import React, { useState, useEffect, useRef } from 'react';
import { ViewState, CoStudyCloudStatus, UserRole, Notification } from '../types';
import { Icons } from './Icons';
import { CoStudyLogo } from './CoStudyLogo';
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

  const NavButton = ({ view, label, isMobile = false }: { view: keyof ViewState; label: string; isMobile?: boolean }) => {
    const isActive = currentView === view;

    if (isMobile) {
        return (
            <button
                type="button"
                onClick={() => handleNavClick(view)}
                className={`w-full rounded-2xl px-4 py-3.5 text-left font-sans text-sm font-semibold tracking-tight transition-all ${
                  isActive
                    ? 'bg-brand text-white shadow-neomorph-inset'
                    : 'bg-slate-100/80 text-slate-700 shadow-neomorph-sm hover:text-brand active:shadow-neomorph-inset'
                }`}
            >
                {label}
            </button>
        );
    }
    return (
        <button
          type="button"
          onClick={() => setView(view)}
          className={`rounded-xl px-3.5 py-2.5 font-sans text-[13px] font-semibold tracking-tight whitespace-nowrap transition-all duration-200 ${
            isActive
              ? 'bg-brand text-white shadow-neomorph-inset'
              : 'text-slate-600 shadow-neomorph-sm hover:text-brand active:bg-slate-100/90'
          }`}
        >
          {label}
        </button>
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
          <NavButton view={ViewState.WALL} label="Study Wall" isMobile={isMobile} />
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
    <div className="relative flex h-screen flex-col overflow-hidden bg-gradient-to-b from-brand/[0.05] via-slate-50 to-slate-100 text-slate-900 selection:bg-brand selection:text-white">
      <nav className="relative z-40 flex h-[4.25rem] items-center justify-center border-b border-slate-200/80 bg-white/75 px-4 font-sans shadow-luxury-sm backdrop-blur-xl backdrop-saturate-150 sm:px-6">
        <div className="flex w-full max-w-[90rem] items-center justify-between gap-4 sm:gap-6">
        <div className="flex items-center gap-4 sm:gap-6">
            {/* Mobile Menu Toggle */}
            <button 
                className="lg:hidden p-2 text-slate-500 hover:text-slate-900 transition-colors"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
                {isMobileMenuOpen ? <Icons.Plus className="w-6 h-6 rotate-45" /> : <Icons.Grid className="w-6 h-6" />}
            </button>

            <div className="cursor-pointer group" onClick={() => setView(userRole === UserRole.TEACHER ? ViewState.FACULTY_ROOM : ViewState.WALL)}>
                <CoStudyLogo size="sm" variant="light" className="group-hover:opacity-90 transition-opacity" />
            </div>
        </div>

        <div className="hidden min-w-0 flex-1 justify-center px-2 lg:flex">
          <div className="flex max-w-full items-center gap-1.5 overflow-x-auto rounded-2xl border border-white/80 bg-slate-200/50 p-1.5 shadow-neomorph-inset-light backdrop-blur-sm no-scrollbar">
            {renderNavItems()}
          </div>
        </div>

        <div className="flex shrink-0 gap-3 items-center">
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
                      <div className="absolute top-full right-0 z-20 mt-4 w-72 overflow-hidden rounded-[1.5rem] border border-slate-200/60 bg-white/95 shadow-luxury backdrop-blur-xl animate-in slide-in-from-top-4">
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
                <div className="hidden text-right sm:block">
                    <div className="font-display mb-0.5 text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500">{userRole === UserRole.TEACHER ? 'Specialist' : 'Scholar'}</div>
                    <div className="font-sans text-xs font-semibold tracking-tight text-slate-900">{userName || 'My Account'}</div>
                </div>
                <img 
                  src={userAvatar || `https://i.pravatar.cc/100?u=${userName || 'me'}`} 
                  className="h-10 w-10 rounded-full object-cover ring-2 ring-slate-200/80 shadow-sm transition-all group-hover:ring-brand" 
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
        </div>
      </nav>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
          <div className="fixed inset-0 top-[4.25rem] z-40 flex flex-col overflow-y-auto bg-gradient-to-b from-brand/[0.1] via-white to-slate-50 p-6 shadow-luxury-sm backdrop-blur-xl animate-in slide-in-from-top-10 duration-300 lg:hidden">
              <div className="space-y-2">
                  {renderNavItems(true)}
              </div>
          </div>
      )}

      <main className="relative flex-1 overflow-y-auto no-scrollbar">
        <div className="pointer-events-none absolute inset-0 overflow-hidden opacity-[0.45]">
          <div className="absolute -left-1/4 top-1/4 h-[55%] w-[55%] rounded-full bg-brand/12 blur-[120px]" />
          <div className="absolute -right-1/4 bottom-1/4 h-[45%] w-[45%] rounded-full bg-slate-300/30 blur-[100px]" />
          <div className="absolute left-1/2 top-0 h-[35%] w-[70%] -translate-x-1/2 rounded-full bg-brand/[0.05] blur-[90px]" />
        </div>
        <div className="relative z-10 mx-auto h-full w-full max-w-[90rem] font-sans text-left">
          {children}
        </div>
      </main>
    </div>
  );
};
    