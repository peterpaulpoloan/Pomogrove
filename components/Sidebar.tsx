
import React from 'react';
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
  CloudOff
} from 'lucide-react';
import { UserProfile } from '../types';

const { NavLink } = Router as any;

interface SidebarProps {
  user: UserProfile;
  onLogout: () => void;
  isOnline: boolean;
}

const Sidebar: React.FC<SidebarProps> = ({ user, onLogout, isOnline }) => {
  const navItems = [
    { to: '/dashboard', icon: <LayoutDashboard size={20} />, label: 'Dashboard' },
    { to: '/pomodoro', icon: <Timer size={20} />, label: 'Pomodoro' },
    { to: '/active-recall', icon: <BrainCircuit size={20} />, label: 'Active Recall' },
    { to: '/notes', icon: <StickyNote size={20} />, label: 'Notes' },
    { to: '/music', icon: <Music2 size={20} />, label: 'Music' },
  ];

  return (
    <div className="fixed inset-y-0 left-0 w-64 bg-white border-r border-stone-200 hidden md:flex flex-col z-50">
      <div className="p-6 flex items-center justify-between text-emerald-600">
        <div className="flex items-center gap-2">
          <Sprout size={32} />
          <span className="brand font-bold text-2xl tracking-tight">PomoGrove</span>
        </div>
        <div title={isOnline ? "Synced to Cloud" : "Local Mode"}>
          {isOnline ? (
            <Cloud size={16} className="text-emerald-500" />
          ) : (
            <CloudOff size={16} className="text-amber-500" />
          )}
        </div>
      </div>

      <nav className="flex-1 px-4 space-y-1 mt-4">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
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

      <div className="p-4 border-t border-stone-100">
        {!isOnline && (
          <div className="mb-4 px-3 py-2 bg-amber-50 text-amber-700 text-[10px] font-bold uppercase tracking-wider rounded-lg flex items-center gap-2">
            <CloudOff size={12} />
            Offline Mode Active
          </div>
        )}
        <div className="flex items-center gap-3 p-3 mb-4 rounded-xl bg-stone-50">
          <img 
            src={user.photoURL || `https://picsum.photos/seed/${user.uid}/100`} 
            alt="Profile" 
            className="w-10 h-10 rounded-full border-2 border-emerald-200"
          />
          <div className="overflow-hidden">
            <p className="text-sm font-semibold truncate">{user.displayName}</p>
            <p className="text-xs text-stone-500">Lvl {user.level}</p>
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
  );
};

export default Sidebar;
