import { useState, useEffect, useRef } from 'react';
import { Play, Pause, RotateCcw, Coffee, Brain } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLogPomodoro } from '@/hooks/use-pomodoro';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

type TimerMode = 'focus' | 'break';

export function PomodoroTimer() {
  const [mode, setMode] = useState<TimerMode>('focus');
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [isActive, setIsActive] = useState(false);
  const { mutate: logSession } = useLogPomodoro();
  
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (isActive && timeLeft > 0) {
      intervalRef.current = setInterval(() => {
        setTimeLeft((t) => t - 1);
      }, 1000);
    } else if (timeLeft === 0 && isActive) {
      handleComplete();
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isActive, timeLeft]);

  const handleComplete = () => {
    setIsActive(false);
    if (mode === 'focus') {
      logSession({ duration: 25, completed: true });
      // Switch to break automatically or prompt?
      setMode('break');
      setTimeLeft(5 * 60);
    } else {
      setMode('focus');
      setTimeLeft(25 * 60);
    }
  };

  const toggleTimer = () => setIsActive(!isActive);
  
  const resetTimer = () => {
    setIsActive(false);
    setTimeLeft(mode === 'focus' ? 25 * 60 : 5 * 60);
  };

  const switchMode = (newMode: TimerMode) => {
    setMode(newMode);
    setIsActive(false);
    setTimeLeft(newMode === 'focus' ? 25 * 60 : 5 * 60);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const progress = mode === 'focus' 
    ? ((25 * 60 - timeLeft) / (25 * 60)) * 100 
    : ((5 * 60 - timeLeft) / (5 * 60)) * 100;

  return (
    <div className="glass-card rounded-3xl p-8 max-w-md w-full mx-auto relative overflow-hidden">
      {/* Background Gradient Animation */}
      <div 
        className={cn(
          "absolute inset-0 opacity-10 transition-colors duration-1000",
          mode === 'focus' ? "bg-primary" : "bg-blue-500"
        )} 
      />

      <div className="flex justify-center gap-2 mb-8 relative z-10">
        <button
          onClick={() => switchMode('focus')}
          className={cn(
            "px-4 py-2 rounded-full text-sm font-medium transition-all",
            mode === 'focus' 
              ? "bg-primary text-white shadow-lg shadow-primary/25" 
              : "text-muted-foreground hover:bg-primary/10"
          )}
        >
          <Brain className="w-4 h-4 inline mr-2" />
          Focus
        </button>
        <button
          onClick={() => switchMode('break')}
          className={cn(
            "px-4 py-2 rounded-full text-sm font-medium transition-all",
            mode === 'break' 
              ? "bg-blue-500 text-white shadow-lg shadow-blue-500/25" 
              : "text-muted-foreground hover:bg-blue-500/10"
          )}
        >
          <Coffee className="w-4 h-4 inline mr-2" />
          Break
        </button>
      </div>

      <div className="relative flex items-center justify-center mb-8">
        {/* SVG Progress Circle */}
        <svg className="w-64 h-64 transform -rotate-90">
          <circle
            cx="128"
            cy="128"
            r="120"
            stroke="currentColor"
            strokeWidth="8"
            fill="transparent"
            className="text-muted/30"
          />
          <circle
            cx="128"
            cy="128"
            r="120"
            stroke="currentColor"
            strokeWidth="8"
            fill="transparent"
            strokeDasharray={2 * Math.PI * 120}
            strokeDashoffset={2 * Math.PI * 120 * (1 - progress / 100)}
            strokeLinecap="round"
            className={cn(
              "transition-all duration-1000 ease-linear",
              mode === 'focus' ? "text-primary" : "text-blue-500"
            )}
          />
        </svg>
        
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-6xl font-bold font-display tabular-nums tracking-tighter">
            {formatTime(timeLeft)}
          </span>
          <span className="text-sm font-medium text-muted-foreground mt-2 uppercase tracking-widest">
            {isActive ? 'Running' : 'Paused'}
          </span>
        </div>
      </div>

      <div className="flex justify-center gap-4 relative z-10">
        <Button
          size="lg"
          className={cn(
            "w-32 h-14 rounded-2xl text-lg shadow-xl hover:shadow-2xl transition-all hover:-translate-y-1",
            mode === 'focus' ? "bg-primary hover:bg-primary/90" : "bg-blue-500 hover:bg-blue-600"
          )}
          onClick={toggleTimer}
        >
          {isActive ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6 ml-1" />}
        </Button>
        <Button
          size="lg"
          variant="outline"
          className="h-14 w-14 rounded-2xl border-2"
          onClick={resetTimer}
        >
          <RotateCcw className="w-5 h-5 text-muted-foreground" />
        </Button>
      </div>
    </div>
  );
}
