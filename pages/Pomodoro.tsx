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
  resetTimer,
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
    <div className="min-h-screen flex flex-col items-center justify-center p-8 relative">

      {/* ── Hero: Tree ── */}
      <div className="flex flex-col items-center gap-6 w-full max-w-lg">
        <div className="text-center">
          <p className={`text-sm font-bold uppercase tracking-widest flex items-center justify-center gap-2 ${isBreak ? 'text-amber-500' : 'text-emerald-600'}`}>
            {isBreak ? <Coffee size={14} /> : <BookOpen size={14} />}
            {isBreak ? 'Break — watering the grove' : 'Focus session in progress'}
          </p>
        </div>

        {/* Tree fills the screen */}
        <div className="w-full flex justify-center">
          <TreeVisual level={user.level} />
        </div>

        <div className="text-center space-y-1">
          <p className="text-2xl font-extrabold text-stone-900">Level {user.level}</p>
          <p className="text-stone-400 text-sm font-medium">
            {Math.floor(user.level / 10)} trees grown · {user.totalSessions} sessions completed
          </p>
        </div>
      </div>

      {/* ── Corner Timer Widget ── */}
      <div className="fixed bottom-6 right-6 z-40">
        <div className="bg-white rounded-2xl shadow-2xl border border-stone-100 overflow-hidden w-48">

          {/* Progress bar */}
          <div className="h-1 bg-stone-100 w-full">
            <div
              className={`h-1 transition-all duration-1000 ease-linear ${isBreak ? 'bg-amber-400' : 'bg-emerald-500'}`}
              style={{ width: `${progress}%` }}
            />
          </div>

          <div className="p-4 space-y-3">
            {/* Time display */}
            <div className="text-center">
              <span className="text-3xl font-black text-stone-900 tabular-nums tracking-tighter">
                {formatTime(timeLeft)}
              </span>
              <p className={`text-xs font-bold uppercase tracking-widest mt-0.5 ${isBreak ? 'text-amber-500' : 'text-emerald-600'}`}>
                {isBreak ? 'Break' : 'Focus'}
              </p>
            </div>

            {/* Controls */}
            <div className="flex items-center justify-center gap-3">
              <button
                onClick={resetTimer}
                className="p-2 rounded-full bg-stone-100 text-stone-500 hover:bg-stone-200 transition-colors"
                aria-label="Reset"
              >
                <RotateCcw size={16} />
              </button>
              <button
                onClick={toggleTimer}
                className={`p-3 rounded-full shadow-md transition-all duration-200 hover:scale-110 ${
                  isActive ? 'bg-rose-500 text-white' : 'bg-emerald-600 text-white'
                }`}
                aria-label={isActive ? 'Pause' : 'Play'}
              >
                {isActive
                  ? <Pause size={20} fill="currentColor" />
                  : <Play size={20} className="ml-0.5" fill="currentColor" />
                }
              </button>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
};

export default Pomodoro;