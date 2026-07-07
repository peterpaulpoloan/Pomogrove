import React, { useState, useEffect, useCallback } from 'react';
import * as Router from 'react-router-dom';
import {
  LayoutDashboard,
  Timer,
  BrainCircuit,
  StickyNote,
  LogOut,
  Sprout,
  Music2,
  Cloud,
  CloudOff,
  Menu,
  X,
} from 'lucide-react';
import { UserProfile } from '../types';
import { loadXPBreakdown, xpToLevel } from '../lib/xpSystem';

const { NavLink } = Router as any;

interface SidebarProps {
  user: UserProfile;
  onLogout: () => void;
  isOnline: boolean;
}

const Sidebar: React.FC<SidebarProps> = ({ user, onLogout, isOnline }) => {
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const navItems = [
    { to: '/dashboard',     icon: <LayoutDashboard size={20} />, label: 'Dashboard' },
    { to: '/pomodoro',      icon: <Timer size={20} />,           label: 'Pomodoro' },
    { to: '/active-recall', icon: <BrainCircuit size={20} />,    label: 'Active Recall' },
    { to: '/notes',         icon: <StickyNote size={20} />,      label: 'Notes' },
    { to: '/music',         icon: <Music2 size={20} />,          label: 'Music' },
  ];

  // ── Grove Level (from XP system) ──────────────────────────────────────────
  const readGroveLevel = useCallback(
    () => xpToLevel(loadXPBreakdown(user.uid).total).level,
    [user.uid],
  );
  const [groveLevel, setGroveLevel] = useState(readGroveLevel);

  useEffect(() => {
    const refresh = () => setGroveLevel(readGroveLevel());
    // 'xp-updated' fires in the same tab (dispatched by saveXPBreakdown).
    // 'storage' fires when another tab writes to localStorage.
    window.addEventListener('xp-updated', refresh);
    window.addEventListener('storage', refresh);
    return () => {
      window.removeEventListener('xp-updated', refresh);
      window.removeEventListener('storage', refresh);
    };
  }, [readGroveLevel]);

  // Close the drawer automatically whenever the route changes (nav click)
  const closeMobile = () => setIsMobileOpen(false);

  return (
    <>
      {/* Mobile top bar — only visible on small screens */}
      <div className="md:hidden fixed top-0 left-0 right-0 h-16 bg-white border-b border-stone-200 z-40 flex items-center justify-between px-4">
        <div className="flex items-center gap-2 text-emerald-600">
          <Sprout size={26} />
          <span className="brand font-bold text-xl tracking-tight">PomoGrove</span>
        </div>
        <button
          onClick={() => setIsMobileOpen(true)}
          className="p-2 rounded-lg text-stone-500 hover:bg-stone-100 hover:text-stone-900 transition-colors"
          aria-label="Open menu"
        >
          <Menu size={24} />
        </button>
      </div>

      {/* Backdrop, mobile only, tapping it closes the drawer */}
      {isMobileOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black/40 z-50"
          onClick={closeMobile}
        />
      )}

      {/* Sidebar itself: off-canvas drawer on mobile, static column on desktop */}
      <div
        className={`
          fixed inset-y-0 left-0 w-64 bg-white border-r border-stone-200 flex flex-col z-50
          transform transition-transform duration-300 ease-in-out
          md:translate-x-0
          ${isMobileOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        {/* Logo */}
        <div className="p-6 flex items-center justify-between text-emerald-600">
          <div className="flex items-center gap-2">
            <Sprout size={32} />
            <span className="brand font-bold text-2xl tracking-tight">PomoGrove</span>
          </div>
          <div className="flex items-center gap-2">
            <div title={isOnline ? 'Synced to Cloud' : 'Local Mode'}>
              {isOnline
                ? <Cloud size={16} className="text-emerald-500" />
                : <CloudOff size={16} className="text-amber-500" />}
            </div>
            {/* Close button, mobile only */}
            <button
              onClick={closeMobile}
              className="md:hidden p-1 rounded-lg text-stone-400 hover:bg-stone-100 hover:text-stone-900"
              aria-label="Close menu"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-4 space-y-1 mt-4">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={closeMobile}
              className={({ isActive }: { isActive: boolean }) => `
                flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200
                ${isActive
                  ? 'bg-emerald-50 text-emerald-700 font-semibold'
                  : 'text-stone-500 hover:bg-stone-50 hover:text-stone-900'}
              `}
            >
              {item.icon}
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        {/* User block */}
        <div className="p-4 border-t border-stone-100">
          {!isOnline && (
            <div className="mb-4 px-3 py-2 bg-amber-50 text-amber-700 text-[10px] font-bold uppercase tracking-wider rounded-lg flex items-center gap-2">
              <CloudOff size={12} />
              Offline Mode Active
            </div>
          )}

          <div className="flex items-center gap-3 p-3 mb-4 rounded-xl bg-stone-50">
            <img
              src={user.photoURL || '/defaultpfp.png'}
              alt="Profile"
              className="w-10 h-10 rounded-full border-2 border-emerald-200"
            />
            <div className="overflow-hidden">
              <p className="text-sm font-semibold truncate">{user.displayName}</p>
              {/* Grove Level — sourced from XP system, not user.level */}
              <p className="text-xs text-emerald-600 font-bold">
                🌿 Grove Lvl {groveLevel}
              </p>
            </div>
          </div>

          <button
            onClick={onLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-rose-600 hover:bg-rose-50 transition-colors"
          >
            <LogOut size={20} />
            <span className="font-medium">Sign Out</span>
          </button>
        </div>
      </div>
    </>
  );
};

export default Sidebar;