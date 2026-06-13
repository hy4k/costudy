import React, { useState, useEffect, useRef } from 'react';
import { ViewState, UserRole, Notification } from '../types';
import { Icons } from './Icons';
import { CoStudyLogo } from './CoStudyLogo';
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
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  const notificationRef = useRef<HTMLDivElement>(null);

  const isTeacher = userRole === UserRole.TEACHER;

  // -- THEME SWITCHER --
  // Brand decision (June 2026): faculty green #199a6c everywhere; student coral/red brand.
  useEffect(() => {
    const root = document.documentElement;
    if (isTeacher) {
        root.style.setProperty('--color-brand-50', '#e9f7f0');
        root.style.setProperty('--color-brand-100', '#d3ecde');
        root.style.setProperty('--color-brand-200', '#b5dfc9');
        root.style.setProperty('--color-brand-300', '#7cc9a8');
        root.style.setProperty('--color-brand-400', '#3eae85');
        root.style.setProperty('--color-brand-500', '#199a6c');
        root.style.setProperty('--color-brand-600', '#0f7d58');
        root.style.setProperty('--color-brand-700', '#07614a');
        root.style.setProperty('--color-brand-800', '#084d3c');
        root.style.setProperty('--color-brand-900', '#063d30');
    } else {
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
  }, [isTeacher]);

  // -- NOTIFICATIONS (fetch + realtime, filtered to this user) --
  useEffect(() => {
    if (!isLoggedIn) return;

    let channel: ReturnType<typeof supabase.channel> | null = null;

    const init = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const data = await notificationService.getNotifications(user.id);
        setNotifications(data);
        setUnreadCount(data.filter(n => !n.is_read).length);

        // Realtime — filtered to this user's notifications only (audit P1-1)
        channel = supabase.channel('user-notifications')
            .on(
                'postgres_changes',
                { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${user.id}` },
                (payload) => {
                    const newNote = payload.new as Notification;
                    setNotifications(prev => [newNote, ...prev]);
                    setUnreadCount(prev => prev + 1);
                }
            )
            .subscribe();
    };
    init();

    return () => { if (channel) supabase.removeChannel(channel); };
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

  // -- NAV CONFIG --
  const navItems: { view: keyof ViewState; label: string }[] = isTeacher
    ? [
        { view: ViewState.FACULTY_ROOM, label: 'Faculty Room' },
        { view: ViewState.DASHBOARD, label: 'Command Center' },
        { view: ViewState.AI_DECK, label: 'Teaching Deck' },
        { view: ViewState.MESSAGES, label: 'Messages' },
        { view: ViewState.PROFILE, label: 'Faculty Profile' },
      ]
    : [
        { view: ViewState.WALL, label: 'Study Wall' },
        { view: ViewState.AI_DECK, label: 'AI Deck' },
        { view: ViewState.TESTS, label: 'Mocks' },
        { view: ViewState.ROOMS, label: 'Study Rooms' },
        { view: ViewState.TEACHERS, label: 'Mentors' },
        ...(isLoggedIn ? [{ view: ViewState.MESSAGES as keyof ViewState, label: 'Messages' }] : []),
        { view: ViewState.PROFILE, label: 'My Study' },
      ];

  // Mobile bottom tab bar (redesign TabBar) — 4 key destinations
  const tabItems: { view: keyof ViewState; label: string; icon: React.ReactNode }[] = isTeacher
    ? [
        { view: ViewState.FACULTY_ROOM, label: 'Faculty', icon: <Icons.Home className="w-[21px] h-[21px]" /> },
        { view: ViewState.DASHBOARD, label: 'Command', icon: <Icons.Scale className="w-[21px] h-[21px]" /> },
        { view: ViewState.AI_DECK, label: 'Deck', icon: <Icons.Sparkles className="w-[21px] h-[21px]" /> },
        { view: ViewState.PROFILE, label: 'Profile', icon: <Icons.Users className="w-[21px] h-[21px]" /> },
      ]
    : [
        { view: ViewState.WALL, label: 'Wall', icon: <Icons.Home className="w-[21px] h-[21px]" /> },
        { view: ViewState.ROOMS, label: 'Rooms', icon: <Icons.Users className="w-[21px] h-[21px]" /> },
        { view: ViewState.AI_DECK, label: 'AI Deck', icon: <Icons.Sparkles className="w-[21px] h-[21px]" /> },
        { view: ViewState.PROFILE, label: 'My Study', icon: <Icons.BookOpen className="w-[21px] h-[21px]" /> },
      ];

  return (
    <div className="proto app-chrome" data-theme={isTeacher ? 'faculty' : undefined} style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
      {/* ---------- Top bar (redesign TopBar) ---------- */}
      <header className="topbar">
        <div className="topbar-inner">
          <button
            type="button"
            className="topbar-logo"
            onClick={() => setView(isTeacher ? ViewState.FACULTY_ROOM : ViewState.WALL)}
            aria-label="CoStudy home"
          >
            <CoStudyLogo size="sm" />
            {isTeacher && <span className="topbar-realm">Staff</span>}
          </button>

          <nav className="topnav" aria-label="Sections">
            {navItems.map((item) => (
              <button
                key={item.label}
                type="button"
                className={`topnav-item ${currentView === item.view ? 'on' : ''}`}
                onClick={() => setView(item.view)}
              >
                {item.label}
              </button>
            ))}
          </nav>

          <div className="topbar-icons">
            {isLoggedIn ? (
              <>
                {/* Notification bell */}
                <div style={{ position: 'relative' }} ref={notificationRef}>
                  <button
                    type="button"
                    className="topbar-ic"
                    onClick={() => setShowNotifications(!showNotifications)}
                    aria-label="Notifications"
                  >
                    <Icons.Bell className="w-[19px] h-[19px]" />
                    {unreadCount > 0 && <span className="ic-dot"></span>}
                  </button>

                  {showNotifications && (
                    <div className="notif-panel">
                      <div className="notif-head">
                        <span>Notifications</span>
                        {unreadCount > 0 && (
                          <button type="button" onClick={handleMarkAllRead}>Mark all read</button>
                        )}
                      </div>
                      <div className="notif-list">
                        {notifications.length === 0 ? (
                          <div className="notif-empty">All caught up ✓</div>
                        ) : (
                          notifications.map(note => (
                            <div
                              key={note.id}
                              className={`notif-item ${!note.is_read ? 'unread' : ''}`}
                              onClick={() => handleNotificationClick(note)}
                            >
                              <span className="notif-ic">
                                {note.type === 'MESSAGE' ? <Icons.MessageCircle className="w-4 h-4" /> :
                                 note.type === 'ALERT' ? <Icons.Bell className="w-4 h-4" /> :
                                 <Icons.CloudSync className="w-4 h-4" />}
                              </span>
                              <div className="notif-tx">
                                {note.content}
                                <time>{new Date(note.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</time>
                              </div>
                              {!note.is_read && <span className="notif-dot"></span>}
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Avatar → profile */}
                <button
                  type="button"
                  className="topbar-avatar"
                  onClick={() => setView(ViewState.PROFILE)}
                  title={userName || 'My account'}
                >
                  {userAvatar ? (
                    <img
                      src={userAvatar}
                      alt={userName || 'Profile'}
                      style={{ width: 34, height: 34, borderRadius: '50%', objectFit: 'cover', boxShadow: 'var(--nm-xs)' }}
                    />
                  ) : (
                    <span style={{ width: 34, height: 34, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--accent-soft)', color: 'var(--accent-deep)', fontWeight: 800, fontSize: 14, boxShadow: 'var(--nm-xs)' }}>
                      {(userName || 'U').charAt(0)}
                    </span>
                  )}
                </button>
              </>
            ) : (
              <button type="button" className="topbar-login" onClick={onLoginClick}>
                Log in
              </button>
            )}
          </div>
        </div>
      </header>

      {/* ---------- Main content ---------- */}
      {/* overflowX: hidden prevents the main scroll area from widening due to
          feed-cats negative-margin trick; overflowY: auto gives the scroll. */}
      <main style={{ position: 'relative', flex: 1, overflowY: 'auto', overflowX: 'hidden' }} className="no-scrollbar">
        <div style={{ position: 'relative', zIndex: 10, margin: '0 auto', minHeight: '100%', width: '100%', maxWidth: '90rem', textAlign: 'left' }}>
          {children}
        </div>
      </main>

      {/* ---------- Mobile bottom tab bar (redesign TabBar) ---------- */}
      <nav className="tabbar" aria-label="Primary">
        {tabItems.map((t) => (
          <button
            key={t.label}
            type="button"
            className={`tab ${currentView === t.view ? 'on' : ''}`}
            onClick={() => setView(t.view)}
          >
            <span className="tab-ic">{t.icon}</span>
            <span className="tab-label">{t.label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
};
