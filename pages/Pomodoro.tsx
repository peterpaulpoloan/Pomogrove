
import React from 'react';
import { Play, Pause, RotateCcw, Coffee, BookOpen } from 'lucide-react';
import TreeVisual from '../components/TreeVisual';
import { UserProfile } from '../types';

interface PomodoroProps {
  user: UserProfile;
  timeLeft: number;
  isActive: boolean;
  isBreak: boolean;
  toggleTimer: () => void;
  resetTimer: () => void;
}

const Pomodoro: React.FC<PomodoroProps> = ({ 
  user, 
  timeLeft, 
  isActive, 
  isBreak, 
  toggleTimer, 
  resetTimer 
}) => {
  const FOCUS_TIME = 25 * 60;
  const BREAK_TIME = 5 * 60;

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const progress = isBreak 
    ? ((BREAK_TIME - timeLeft) / BREAK_TIME) * 100 
    : ((FOCUS_TIME - timeLeft) / FOCUS_TIME) * 100;

  return (
    <div className="min-h-full flex flex-col items-center justify-center p-8">
      <div className="w-full max-w-xl text-center space-y-12">
        
        {/* Visual Growth Section */}
        <div className="flex flex-col items-center">
          <TreeVisual level={user.level} />
          <div className="mt-8 space-y-2">
            <h1 className="text-4xl font-extrabold text-stone-900 tracking-tight">
              {isBreak ? 'Relaxation Time' : 'Focus Session'}
            </h1>
            <p className="text-stone-500 font-medium">
              {isBreak ? 'Time to water the grove.' : 'Stay focused to grow your sapling.'}
            </p>
          </div>
        </div>

        {/* Timer Card */}
        <div className="bg-white rounded-[2.5rem] shadow-2xl border border-stone-100 p-12 relative overflow-hidden">
          {/* Progress Bar Background */}
          <div 
            className={`absolute top-0 left-0 h-2 transition-all duration-1000 ease-linear ${isBreak ? 'bg-amber-500' : 'bg-emerald-500'}`}
            style={{ width: `${progress}%` }}
          />
          
          <div className={`flex items-center justify-center gap-3 mb-4 font-bold uppercase tracking-widest text-sm ${isBreak ? 'text-amber-600' : 'text-emerald-600'}`}>
            {isBreak ? <Coffee size={18} /> : <BookOpen size={18} />}
            {isBreak ? 'On Break' : 'Studying'}
          </div>

          <div className="text-8xl font-black text-stone-900 tabular-nums mb-12 tracking-tighter">
            {formatTime(timeLeft)}
          </div>

          <div className="flex items-center justify-center gap-6">
            <button 
              onClick={resetTimer}
              className="p-5 rounded-full bg-stone-100 text-stone-600 hover:bg-stone-200 transition-colors shadow-sm"
              aria-label="Reset"
            >
              <RotateCcw size={28} />
            </button>
            <button 
              onClick={toggleTimer}
              className={`
                p-8 rounded-full shadow-xl transition-all duration-300 scale-110
                ${isActive ? 'bg-rose-500 text-white' : 'bg-emerald-600 text-white'}
                hover:scale-125
              `}
            >
              {isActive ? <Pause size={40} fill="currentColor" /> : <Play size={40} className="ml-2" fill="currentColor" />}
            </button>
            <div className="p-5 w-16 invisible" /> {/* Placeholder for balance */}
          </div>
        </div>

        <div className="text-stone-400 font-medium">
          Level {user.level} / 300
        </div>
      </div>
    </div>
  );
};

export default Pomodoro;
