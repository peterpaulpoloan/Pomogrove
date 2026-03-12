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
import { logActivity } from './lib/activityLogger';

const { HashRouter, Routes, Route, Navigate, useLocation } = Router as any;
const { onAuthStateChanged, signOut, getRedirectResult } = Auth as any;

const DEMO_MODE = false;
const FOCUS_TIME = DEMO_MODE ? 2 : 25 * 60;
const BREAK_TIME = DEMO_MODE ? 2 : 5 * 60;
const DEMO_LEVEL_INCREMENT = DEMO_MODE ? 50 : 1;
const API_BASE = (import.meta.env as any).VITE_API_BASE || 'http://localhost:5000/api';

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
  const resetTimer = useCallback(() => { setIsActive(false); setIsBreak(false); setTimeLeft(FOCUS_TIME); }, []);

  useEffect(() => {
    let interval: any = null;
    if (isActive && timeLeft > 0) {
      interval = setInterval(() => setTimeLeft((t) => t - 1), 1000);
    } else if (timeLeft === 0) {
      if (!isBreak) {
        updateUser({ level: (user?.level || 0) + DEMO_LEVEL_INCREMENT, totalSessions: (user?.totalSessions || 0) + 1 });
        if (user) {
          // Log pomodoro activity locally always
          logActivity(user.uid, 'pomodoro');

          // Also try syncing to API
          fetch(`${API_BASE}/pomo/complete`, {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ uid: user.uid }),
          }).catch(() => {});
        }
        setIsBreak(true); setTimeLeft(BREAK_TIME);
      } else { setIsBreak(false); setTimeLeft(FOCUS_TIME); }
      try { new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3').play(); } catch (e) {}
    }
    return () => clearInterval(interval);
  }, [isActive, timeLeft, isBreak, updateUser, user]);

  return (
    <div className="flex min-h-screen bg-stone-50">
      {DEMO_MODE && (
        <div className="fixed top-0 left-0 right-0 z-50 bg-amber-400 text-amber-900 text-center text-xs font-bold py-1">
          🎮 DEMO MODE — 1s cycles, +{DEMO_LEVEL_INCREMENT} levels per session. Set DEMO_MODE = false before deploying.
        </div>
      )}
      {user && <Sidebar user={user} onLogout={handleLogout} isOnline={isOnline} />}
      <main className={`flex-1 ${user ? 'md:ml-64' : ''} ${DEMO_MODE ? 'mt-6' : ''}`}>
        <Routes>
          <Route path="/" element={!user ? <Landing onLogin={handleLogin} /> : <Navigate to="/dashboard" />} />
          <Route path="/dashboard" element={user ? <Dashboard user={user} updateUser={updateUser} /> : <Navigate to="/" />} />
          <Route path="/pomodoro" element={user ? <Pomodoro user={user} timeLeft={timeLeft} isActive={isActive} isBreak={isBreak} toggleTimer={toggleTimer} resetTimer={resetTimer} /> : <Navigate to="/" />} />
          <Route path="/active-recall" element={user ? <ActiveRecall user={user} /> : <Navigate to="/" />} />
          <Route path="/notes" element={user ? <Notes user={user} /> : <Navigate to="/" />} />
          <Route path="/music" element={user ? <Music onSetYoutubeId={setYoutubeId} currentYoutubeId={youtubeId} /> : <Navigate to="/" />} />
        </Routes>
      </main>
      {user && (
        <>
          <FloatingTimer timeLeft={timeLeft} isBreak={isBreak} isVisible={isActive && location.pathname !== '/pomodoro'} />
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
    try { const res = await fetch(`${API_BASE}/health`); setIsOnline(res.ok); } catch (e) { setIsOnline(false); }
  }, []);

  useEffect(() => {
    checkConnection();
    syncTimer.current = setInterval(checkConnection, 30000);
    return () => clearInterval(syncTimer.current);
  }, [checkConnection]);

  // Handle Google redirect result FIRST, before onAuthStateChanged
  useEffect(() => {
    const handleRedirect = async () => {
      try {
        console.log("Checking for redirect result...");
        const result = await getRedirectResult(auth);
        if (result) {
          console.log("Redirect result found:", result.user?.email);
          // The onAuthStateChanged will handle the rest
        } else {
          console.log("No redirect result");
        }
      } catch (error) {
        console.error("Redirect error:", error);
      }
    };
    handleRedirect();
  }, []);

  useEffect(() => {
    console.log("Setting up auth state listener...");
    const unsubscribe = onAuthStateChanged(auth, async (fbUser: any) => {
      console.log("Auth state changed. User:", fbUser?.email || "null");
      
      if (fbUser) {
        try {
          console.log(`Fetching user from API: ${API_BASE}/user/${fbUser.uid}`);
          const res = await fetch(`${API_BASE}/user/${fbUser.uid}`);
          console.log("API response status:", res.status);
          
          if (res.ok) {
            const profile = await res.json();
            console.log("User profile loaded:", profile);
            setUser(profile);
            localStorage.setItem(`user_${fbUser.uid}`, JSON.stringify(profile));
          } else {
            console.log("User not in DB, creating new profile...");
            const initialProfile: UserProfile = {
              uid: fbUser.uid,
              displayName: fbUser.displayName || fbUser.email?.split('@')[0] || 'User',
              photoURL: fbUser.photoURL || '',
              bio: 'Studying in the grove',
              level: 1, streak: 0, totalSessions: 0,
            };
            
            const createRes = await fetch(`${API_BASE}/user`, { 
              method: 'POST', 
              headers: { 'Content-Type': 'application/json' }, 
              body: JSON.stringify(initialProfile) 
            });
            
            console.log("Create user response:", createRes.status);
            
            if (createRes.ok) {
              const savedProfile = await createRes.json();
              console.log("New profile created:", savedProfile);
              setUser(savedProfile);
              localStorage.setItem(`user_${fbUser.uid}`, JSON.stringify(savedProfile));
            } else {
              console.log("Failed to create in DB, using local profile");
              setUser(initialProfile);
              localStorage.setItem(`user_${fbUser.uid}`, JSON.stringify(initialProfile));
            }
          }
        } catch (e) {
          console.error("Error syncing user:", e);
          const localData = localStorage.getItem(`user_${fbUser.uid}`);
          if (localData) {
            console.log("Using cached user data");
            setUser(JSON.parse(localData));
          } else {
            console.log("Creating fallback profile");
            const fallbackProfile = {
              uid: fbUser.uid, 
              displayName: fbUser.displayName || fbUser.email?.split('@')[0] || 'User',
              photoURL: fbUser.photoURL || '', 
              bio: 'Studying in the grove', 
              level: 1, 
              streak: 0, 
              totalSessions: 0,
            };
            setUser(fallbackProfile);
          }
        }

        // ── Log login activity ──
        logActivity(fbUser.uid, 'login');

      } else { 
        console.log("No user logged in");
        setUser(null); 
      }
      
      console.log("Setting loading to false");
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleLogin = (userData: UserProfile) => {
    console.log("handleLogin called with:", userData);
    setUser(userData);
    localStorage.setItem(`user_${userData.uid}`, JSON.stringify(userData));
    logActivity(userData.uid, 'login');
  };

  const handleLogout = async () => { 
    console.log("Logging out...");
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
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ display_name: newUser.displayName, bio: newUser.bio, level: newUser.level, total_sessions: newUser.totalSessions }),
      });
    } catch (e) { console.warn('Sync failed, saved locally.'); }
  }, [user]);

  if (loading) return (
    <div className="h-screen w-screen flex items-center justify-center bg-emerald-50">
      <div className="animate-bounce text-emerald-600 text-4xl font-bold tracking-tight">PomoGrove</div>
    </div>
  );

  return (
    <HashRouter>
      <AppContent user={user} isOnline={isOnline} updateUser={updateUser} handleLogout={handleLogout} handleLogin={handleLogin} />
    </HashRouter>
  );
};

export default App;