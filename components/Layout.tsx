import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { UserRole } from '../types';
import { Icons } from './Icons';

interface LayoutProps {
  children: React.ReactNode;
  isLoggedIn: boolean;
  userName?: string;
  userRole?: UserRole;
  userAvatar?: string;
  handleLogout: () => void;
}

export const Layout: React.FC<LayoutProps> = ({ children, isLoggedIn, userName, userRole, userAvatar, handleLogout }) => {
  const location = useLocation();
  const navigate = useNavigate();

  // Redirect unauthenticated off Layout (Handled in App.tsx technically, but safeguard)
  if (!isLoggedIn) return <>{children}</>;

  // Define Nav Items
  let navItems = [
    { label: 'Command Deck', path: '/deck', icon: <Icons.Hexagon className="w-5 h-5" /> },
    { label: 'Study Rooms', path: '/rooms', icon: <Icons.Target className="w-5 h-5" /> },
    { label: 'Alignments', path: '/alignments', icon: <Icons.Link className="w-5 h-5" /> },
    { label: 'AI Mastermind', path: '/ai', icon: <Icons.Sparkles className="w-5 h-5" /> },
    { label: 'Profile', path: '/profile', icon: <Icons.User className="w-5 h-5" /> }
  ];

  if (userRole === UserRole.TEACHER) {
    navItems = [
      { label: 'Faculty Deck', path: '/deck', icon: <Icons.Hexagon className="w-5 h-5" /> },
      { label: 'Mentor Dash', path: '/mentor-dashboard', icon: <Icons.PieChart className="w-5 h-5" /> },
      { label: 'Alignments', path: '/alignments', icon: <Icons.Link className="w-5 h-5" /> },
      { label: 'Messages', path: '/messages', icon: <Icons.MessageCircle className="w-5 h-5" /> },
      { label: 'Profile', path: '/profile', icon: <Icons.User className="w-5 h-5" /> }
    ];
  }

  // Mobile Bottom Tabs (Max 5)
  const mobileTabs = navItems.slice(0, 5);

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden font-sans">

      {/* DESKTOP SIDEBAR */}
      <aside className="hidden md:flex flex-col w-[240px] bg-[#0f172a] text-slate-400 shrink-0 h-full border-r border-slate-900 shadow-2xl z-20 transition-all">
        {/* Logo Area */}
        <div className="h-20 flex items-center gap-3 px-6 border-b border-white/5 mb-6">
          <Icons.Logo className="w-8 h-8 text-brand animate-pulse" />
          <span className="text-xl font-black uppercase tracking-tighter text-white">CoStudy</span>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 overflow-y-auto px-4 space-y-2 no-scrollbar">
          {navItems.map(item => {
            const isActive = location.pathname.startsWith(item.path);
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg font-bold text-sm tracking-widest uppercase transition-all ${isActive
                    ? 'bg-white/10 text-white border-l-[3px] border-indigo-500 shadow-inner'
                    : 'hover:bg-white/5 hover:text-slate-200 border-l-[3px] border-transparent'
                  }`}
              >
                {item.icon}
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* User Card & Logout (Bottom) */}
        <div className="p-4 border-t border-white/5">
          <div className="bg-white/5 rounded-xl p-3 flex items-center gap-3 border border-white/10 cursor-pointer hover:bg-white/10 transition-colors" onClick={() => navigate('/profile')}>
            <img src={userAvatar || `https://i.pravatar.cc/150?u=${userName}`} alt="Avatar" className="w-10 h-10 rounded-lg object-cover bg-slate-800" />
            <div className="flex-1 min-w-0">
              <div className="text-[10px] uppercase font-black tracking-widest text-indigo-400 truncate">{userRole || 'Scholar'}</div>
              <div className="text-xs font-bold text-white truncate">{userName || 'Loading...'}</div>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full mt-3 flex items-center justify-center gap-2 px-4 py-3 bg-rose-500/10 text-rose-500 rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-rose-500 hover:text-white transition-all active:scale-95 border border-rose-500/20"
          >
            <Icons.LogOut className="w-4 h-4" /> Log Out
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 flex flex-col h-full relative overflow-hidden bg-slate-50">

        {/* Mobile Header (Only visible on MD down) */}
        <header className="md:hidden h-16 bg-[#0f172a] border-b border-white/5 flex items-center justify-between px-6 shrink-0 z-20">
          <div className="flex items-center gap-2">
            <Icons.Logo className="w-6 h-6 text-brand" />
            <span className="text-lg font-black uppercase tracking-tighter text-white">CoStudy</span>
          </div>
          <button onClick={() => navigate('/profile')}>
            <img src={userAvatar || `https://i.pravatar.cc/150?u=${userName}`} alt="User" className="w-8 h-8 rounded-lg outline outline-2 outline-white/10" />
          </button>
        </header>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto w-full relative z-10 custom-scrollbar pb-20 md:pb-0">
          {children}
        </div>

        {/* MOBILE BOTTOM TAB BAR */}
        <nav className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-[#0f172a] border-t border-white/5 flex justify-around items-center px-2 z-30 pb-safe">
          {mobileTabs.map(item => {
            const isActive = location.pathname.startsWith(item.path);
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex flex-col items-center justify-center w-full h-full gap-1 transition-colors ${isActive ? 'text-indigo-400' : 'text-slate-500 hover:text-slate-300'}`}
              >
                {item.icon}
                <span className="text-[8px] font-black uppercase tracking-widest">{item.label.split(' ')[0]}</span>
              </Link>
            )
          })}
        </nav>
      </main>
    </div>
  );
};
