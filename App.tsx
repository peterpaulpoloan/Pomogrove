
import React, { useState, useEffect, useCallback, useRef } from 'react';
import * as Router from 'react-router-dom';
import * as Auth from 'firebase/auth';
import { auth } from './lib/firebase';
import Landing from './pages/Landing';
import Dashboard from './pages/Dashboard';
import Pomodoro from './pages/Pomodoro';
import ActiveRecall from './pages/ActiveRecall';
import Notes from './pages/Notes';
import Music from './pages/Music';
import Sidebar from './components/Sidebar';
import FloatingTimer from './components/FloatingTimer';
import GlobalMusicPlayer from './components/GlobalMusicPlayer';
import { UserProfile } from './types';

const { HashRouter, Routes, Route, Navigate, useLocation } = Router as any;
const { onAuthStateChanged, signOut } = Auth as any;

const FOCUS_TIME = 25 * 60;
const BREAK_TIME = 5 * 60;
const API_BASE = 'http://localhost:5000/api';

const AppContent: React.FC<{
  user: UserProfile | null;
  isOnline: boolean;
  updateUser: (updated: Partial<UserProfile>) => void;
  handleLogout: () => void;
  handleLogin: (u: UserProfile) => void;
}> = ({ user, isOnline, updateUser, handleLogout, handleLogin }) => {
  const location = useLocation();
  const [timeLeft, setTimeLeft] = useState(FOCUS_TIME);
  const [isActive, setIsActive] = useState(false);
  const [isBreak, setIsBreak] = useState(false);
  const [youtubeId, setYoutubeId] = useState<string | null>(null);

  const toggleTimer = () => setIsActive(!isActive);
  
  const resetTimer = useCallback(() => {
    setIsActive(false);
    setIsBreak(false);
    setTimeLeft(FOCUS_TIME);
  }, []);

  useEffect(() => {
    let interval: any = null;
    if (isActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((t) => t - 1);
      }, 1000);
    } else if (timeLeft === 0) {
      if (!isBreak) {
        const newLevel = (user?.level || 0) + 1;
        const newSessions = (user?.totalSessions || 0) + 1;
        
        updateUser({ 
          level: newLevel,
          totalSessions: newSessions 
        });
        
        if (user) {
          fetch(`${API_BASE}/pomo/complete`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ uid: user.uid })
          }).catch(() => {
            const localStats = JSON.parse(localStorage.getItem(`stats_${user.uid}`) || '[]');
            localStats.push(new Date().toISOString());
            localStorage.setItem(`stats_${user.uid}`, JSON.stringify(localStats));
          });
        }

        setIsBreak(true);
        setTimeLeft(BREAK_TIME);
      } else {
        setIsBreak(false);
        setTimeLeft(FOCUS_TIME);
      }
      
      try {
        const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
        audio.play();
      } catch (e) {}
    }
    return () => clearInterval(interval);
  }, [isActive, timeLeft, isBreak, updateUser, user]);

  const showFloatingTimer = isActive && location.pathname !== '/pomodoro';

  return (
    <div className="flex min-h-screen bg-stone-50">
      {user && <Sidebar user={user} onLogout={handleLogout} isOnline={isOnline} />}
      <main className={`flex-1 ${user ? 'md:ml-64' : ''}`}>
        <Routes>
          <Route path="/" element={!user ? <Landing onLogin={handleLogin} /> : <Navigate to="/dashboard" />} />
          <Route path="/dashboard" element={user ? <Dashboard user={user} updateUser={updateUser} /> : <Navigate to="/" />} />
          <Route path="/pomodoro" element={user ? (
            <Pomodoro 
              user={user} 
              timeLeft={timeLeft} 
              isActive={isActive} 
              isBreak={isBreak} 
              toggleTimer={toggleTimer} 
              resetTimer={resetTimer} 
            />
          ) : <Navigate to="/" />} />
          <Route path="/active-recall" element={user ? <ActiveRecall /> : <Navigate to="/" />} />
          <Route path="/notes" element={user ? <Notes /> : <Navigate to="/" />} />
          <Route path="/music" element={user ? <Music onSetYoutubeId={setYoutubeId} currentYoutubeId={youtubeId} /> : <Navigate to="/" />} />
        </Routes>
      </main>
      
      {user && (
        <>
          <FloatingTimer 
            timeLeft={timeLeft} 
            isBreak={isBreak} 
            isVisible={showFloatingTimer} 
          />
          <GlobalMusicPlayer youtubeId={youtubeId} onSetYoutubeId={setYoutubeId} />
        </>
      )}
    </div>
  );
};

const App: React.FC = () => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isOnline, setIsOnline] = useState(false);
  const syncTimer = useRef<any>(null);

  const checkConnection = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/health`);
      setIsOnline(res.ok);
    } catch (e) {
      setIsOnline(false);
    }
  }, []);

  useEffect(() => {
    checkConnection();
    syncTimer.current = setInterval(checkConnection, 30000);
    return () => clearInterval(syncTimer.current);
  }, [checkConnection]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (fbUser: any) => {
      if (fbUser) {
        try {
          const res = await fetch(`${API_BASE}/user/${fbUser.uid}`);
          if (res.ok) {
            const profile = await res.json();
            setUser(profile);
            localStorage.setItem(`user_${fbUser.uid}`, JSON.stringify(profile));
          } else {
            const localData = localStorage.getItem(`user_${fbUser.uid}`);
            if (localData) {
              setUser(JSON.parse(localData));
            } else {
              const initialProfile: UserProfile = {
                uid: fbUser.uid,
                displayName: fbUser.displayName || 'Explorer',
                photoURL: fbUser.photoURL || '',
                bio: 'Studying in the grove',
                level: 1,
                streak: 0,
                totalSessions: 0
              };
              setUser(initialProfile);
              localStorage.setItem(`user_${fbUser.uid}`, JSON.stringify(initialProfile));
            }
          }
        } catch (e) {
          const localData = localStorage.getItem(`user_${fbUser.uid}`);
          if (localData) {
            setUser(JSON.parse(localData));
          } else {
            setUser(null);
          }
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleLogin = (userData: UserProfile) => {
    setUser(userData);
    localStorage.setItem(`user_${userData.uid}`, JSON.stringify(userData));
  };

  const handleLogout = async () => {
    await signOut(auth);
    setUser(null);
  };

  const updateUser = useCallback(async (updated: Partial<UserProfile>) => {
    if (!user) return;
    const newUser = { ...user, ...updated };
    setUser(newUser);
    localStorage.setItem(`user_${user.uid}`, JSON.stringify(newUser));
    
    try {
      await fetch(`${API_BASE}/user/${user.uid}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          display_name: newUser.displayName,
          bio: newUser.bio,
          level: newUser.level,
          total_sessions: newUser.totalSessions
        })
      });
    } catch (e) {
      console.warn("Sync failed, saved to local storage.");
    }
  }, [user]);

  if (loading) return (
    <div className="h-screen w-screen flex items-center justify-center bg-emerald-50">
      <div className="animate-bounce text-emerald-600 text-4xl font-bold tracking-tight">PomoGrove</div>
    </div>
  );

  return (
    <HashRouter>
      <AppContent 
        user={user} 
        isOnline={isOnline}
        updateUser={updateUser} 
        handleLogout={handleLogout} 
        handleLogin={handleLogin} 
      />
    </HashRouter>
  );
};

export default App;
  