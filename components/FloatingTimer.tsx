import React from 'react';
// Fix: Use namespace import and cast to any to resolve "no exported member" errors in this environment
import * as Router from 'react-router-dom';
import { Timer, Coffee, BookOpen } from 'lucide-react';

const { Link } = Router as any;

interface FloatingTimerProps {
  timeLeft: number;
  isBreak: boolean;
  isVisible: boolean;
}

const FloatingTimer: React.FC<FloatingTimerProps> = ({ timeLeft, isBreak, isVisible }) => {
  if (!isVisible) return null;

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <Link 
      to="/pomodoro" 
      className={`
        fixed bottom-6 right-6 z-[100] group
        flex items-center gap-3 px-5 py-3 rounded-2xl shadow-2xl backdrop-blur-md
        border border-white/20 transition-all duration-300 hover:scale-105 active:scale-95
        ${isBreak ? 'bg-amber-500/90 text-white' : 'bg-emerald-600/90 text-white'}
      `}
    >
      <div className="flex items-center gap-2">
        {isBreak ? <Coffee size={18} /> : <BookOpen size={18} />}
        <span className="font-black text-lg tabular-nums">
          {formatTime(timeLeft)}
        </span>
      </div>
      <div className="h-4 w-[1px] bg-white/30" />
      <span className="text-xs font-bold uppercase tracking-widest group-hover:underline">
        {isBreak ? 'Break' : 'Focusing'}
      </span>
    </Link>
  );
};

export default FloatingTimer;