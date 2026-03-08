
import React, { useState } from 'react';
import { Sprout, Mail, Lock, User, AlertCircle } from 'lucide-react';
import * as Auth from 'firebase/auth';
import { auth } from '../lib/firebase';
import { UserProfile } from '../types';

const { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  updateProfile 
} = Auth as any;

interface LandingProps {
  onLogin: (user: UserProfile) => void;
}

const API_BASE = 'http://localhost:5000/api';

const Landing: React.FC<LandingProps> = ({ onLogin }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (isLogin) {
        // 1. Firebase Auth Login
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const fbUser = userCredential.user;
        
        // 2. Sync with local database
        try {
          const response = await fetch(`${API_BASE}/user/${fbUser.uid}`);
          if (response.ok) {
            const profileData = await response.json();
            onLogin(profileData);
          } else {
            // If user exists in Firebase but not DB, create it
            const profileData: UserProfile = {
              uid: fbUser.uid,
              displayName: fbUser.displayName || 'Explorer',
              photoURL: fbUser.photoURL || '',
              bio: 'New explorer in the grove',
              level: 1,
              streak: 0,
              totalSessions: 0
            };
            const createRes = await fetch(`${API_BASE}/user`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(profileData)
            });
            if (!createRes.ok) throw new Error("Could not sync profile to database.");
            const savedProfile = await createRes.json();
            onLogin(savedProfile);
          }
        } catch (apiErr: any) {
          console.error("API Sync Error:", apiErr);
          setError("Connected to Firebase, but local database is offline. Please ensure the Express server is running on port 5000.");
        }
      } else {
        // 1. Firebase Auth Signup
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const fbUser = userCredential.user;
        
        await updateProfile(fbUser, { displayName: name });

        const newProfile: UserProfile = {
          uid: fbUser.uid,
          displayName: name,
          photoURL: '',
          bio: 'Starting my focus journey.',
          level: 1,
          streak: 0,
          totalSessions: 0
        };

        // 2. Local DB Sync
        try {
          const syncResponse = await fetch(`${API_BASE}/user`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(newProfile)
          });

          if (!syncResponse.ok) {
            throw new Error("Account created in Firebase, but database sync failed.");
          }

          const savedProfile = await syncResponse.json();
          onLogin(savedProfile);
        } catch (apiErr: any) {
          setError("Account created, but database is unreachable. Try logging in once the server is online.");
        }
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred during authentication.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      <div className="md:w-1/2 bg-emerald-600 flex flex-col items-center justify-center p-12 text-white">
        <div className="max-w-md text-center">
          <Sprout size={80} className="mx-auto mb-6" />
          <h1 className="text-5xl font-bold mb-4 tracking-tight">Plant your focus.</h1>
          <p className="text-emerald-100 text-lg">
            Pomogrove helps you cultivate healthy study habits through gamified sessions, 
            active recall, and seamless note-taking.
          </p>
          
          <div className="mt-12 grid grid-cols-2 gap-4 text-emerald-900 font-semibold">
            <div className="bg-emerald-400 p-4 rounded-2xl shadow-lg">
              <span className="block text-2xl">25min</span>
              <span className="text-xs uppercase">Focus Time</span>
            </div>
            <div className="bg-emerald-300 p-4 rounded-2xl shadow-lg">
              <span className="block text-2xl">5min</span>
              <span className="text-xs uppercase">Break Time</span>
            </div>
          </div>
        </div>
      </div>

      <div className="md:w-1/2 flex items-center justify-center p-8 bg-stone-50">
        <div className="w-full max-w-sm">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold text-stone-900 mb-2">
              {isLogin ? 'Welcome Back' : 'Join the Grove'}
            </h2>
            <p className="text-stone-500">
              {isLogin ? 'Log in to continue growing your tree.' : 'Start your productivity journey today.'}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="bg-rose-50 text-rose-600 p-3 rounded-xl flex items-start gap-2 text-sm font-medium leading-tight">
                <AlertCircle className="shrink-0 mt-0.5" size={18} />
                <span>{error}</span>
              </div>
            )}
            {!isLogin && (
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" size={20} />
                <input
                  type="text"
                  placeholder="Full Name"
                  className="w-full pl-10 pr-4 py-3 bg-white border border-stone-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>
            )}
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" size={20} />
              <input
                type="email"
                placeholder="Email Address"
                className="w-full pl-10 pr-4 py-3 bg-white border border-stone-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" size={20} />
              <input
                type="password"
                placeholder="Password"
                className="w-full pl-10 pr-4 py-3 bg-white border border-stone-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className={`w-full py-3 bg-stone-900 text-white rounded-xl font-bold hover:bg-stone-800 transition-colors shadow-lg flex items-center justify-center ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                isLogin ? 'Sign In' : 'Create Account'
              )}
            </button>
          </form>

          <p className="text-center mt-10 text-stone-500">
            {isLogin ? "Don't have an account?" : "Already have an account?"}{' '}
            <button 
              onClick={() => {
                setIsLogin(!isLogin);
                setError(null);
              }}
              className="text-emerald-600 font-bold hover:underline"
            >
              {isLogin ? 'Sign Up' : 'Log In'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Landing;
