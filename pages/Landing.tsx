import React, { useState } from 'react';
import { Sprout, AlertCircle, Mail, Lock, Eye, EyeOff } from 'lucide-react';
import * as Auth from 'firebase/auth';
import { auth } from '../lib/firebase';

const {
  signInWithPopup,
  signInWithRedirect,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
} = Auth as any;

interface LandingProps {
  onLogin: (user: any) => void;
}

type AuthMode = 'login' | 'register';

const Landing: React.FC<LandingProps> = () => {
  const [error, setError]       = useState<string | null>(null);
  const [loading, setLoading]   = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [authMode, setAuthMode] = useState<AuthMode>('login');

  // Email/password form state
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');

  // ── Google sign-in ─────────────────────────────────────────────────────────
  const handleGoogleSignIn = async () => {
    setError(null);
    setLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      try {
        await signInWithPopup(auth, provider);
      } catch (popupError: any) {
        if (
          popupError.code === 'auth/popup-blocked' ||
          popupError.code === 'auth/popup-closed-by-user'
        ) {
          await signInWithRedirect(auth, provider);
        } else {
          throw popupError;
        }
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred during authentication.');
      setLoading(false);
    }
  };

  // ── Email / password sign-in or register ───────────────────────────────────
  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      if (authMode === 'login') {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        await createUserWithEmailAndPassword(auth, email, password);
      }
      // onAuthStateChanged in App.tsx handles the rest
    } catch (err: any) {
      setError(friendlyError(err.code) || err.message);
      setLoading(false);
    }
  };

  // ── Human-readable Firebase error codes ───────────────────────────────────
  const friendlyError = (code: string): string | null => {
    const map: Record<string, string> = {
      'auth/user-not-found':        'No account found with that email.',
      'auth/wrong-password':        'Incorrect password. Please try again.',
      'auth/invalid-email':         'That doesn\'t look like a valid email address.',
      'auth/email-already-in-use':  'An account with that email already exists.',
      'auth/weak-password':         'Password must be at least 6 characters.',
      'auth/too-many-requests':     'Too many attempts. Please wait a moment and try again.',
      'auth/network-request-failed':'Network error. Check your connection and try again.',
      'auth/invalid-credential':    'Incorrect email or password.',
    };
    return map[code] ?? null;
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row">

      {/* ── Hero panel ─────────────────────────────────────────────────────── */}
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

      {/* ── Auth panel ─────────────────────────────────────────────────────── */}
      <div className="md:w-1/2 flex items-center justify-center p-8 bg-stone-50">
        <div className="w-full max-w-sm">

          {/* Heading */}
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-stone-900 mb-2">Welcome to PomoGrove</h2>
            <p className="text-stone-500 text-sm">
              {authMode === 'login'
                ? 'Sign in to start growing your productivity tree.'
                : 'Create an account to get started.'}
            </p>
          </div>

          {/* Error alert */}
          {error && (
            <div
              data-testid="error-message"
              className="bg-rose-50 text-rose-600 p-3 rounded-xl flex items-start gap-2 text-sm font-medium leading-tight mb-4"
            >
              <AlertCircle className="shrink-0 mt-0.5" size={18} />
              <span>{error}</span>
            </div>
          )}

          {/* Google button */}
          <button
            data-testid="google-signin-btn"
            onClick={handleGoogleSignIn}
            disabled={loading}
            className={`w-full py-3 bg-white border-2 border-stone-200 text-stone-700 rounded-xl font-bold
              hover:bg-stone-50 transition-colors shadow-lg flex items-center justify-center gap-3
              ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-stone-300 border-t-stone-700 rounded-full animate-spin" />
            ) : (
              <>
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Sign in with Google
              </>
            )}
          </button>

          {/* Divider */}
          <div className="relative my-5">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-stone-200" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-stone-50 text-stone-400">or continue with email</span>
            </div>
          </div>

          {/* Email / password form */}
          <form onSubmit={handleEmailAuth} className="space-y-3" data-testid="email-auth-form">

            {/* Email */}
            <div className="relative">
              <Mail
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 pointer-events-none"
              />
              <input
                data-testid="email-input"
                type="email"
                placeholder="Email address"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full pl-9 pr-4 py-3 bg-white border-2 border-stone-200 rounded-xl text-stone-800
                  placeholder-stone-400 text-sm focus:outline-none focus:border-emerald-500 transition-colors"
              />
            </div>

            {/* Password */}
            <div className="relative">
              <Lock
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 pointer-events-none"
              />
              <input
                data-testid="password-input"
                type={showPassword ? 'text' : 'password'}
                placeholder="Password"
                required
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full pl-9 pr-10 py-3 bg-white border-2 border-stone-200 rounded-xl text-stone-800
                  placeholder-stone-400 text-sm focus:outline-none focus:border-emerald-500 transition-colors"
              />
              <button
                type="button"
                data-testid="toggle-password"
                onClick={() => setShowPassword(v => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>

            {/* Submit */}
            <button
              data-testid="email-submit-btn"
              type="submit"
              disabled={loading}
              className={`w-full py-3 bg-emerald-600 text-white rounded-xl font-bold
                hover:bg-emerald-700 transition-colors shadow-lg
                ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
            >
              {loading
                ? <div className="w-5 h-5 border-2 border-emerald-300 border-t-white rounded-full animate-spin mx-auto" />
                : authMode === 'login' ? 'Sign in' : 'Create account'
              }
            </button>
          </form>

          {/* Toggle login ↔ register */}
          <p className="text-center text-sm text-stone-500 mt-4">
            {authMode === 'login' ? "Don't have an account? " : 'Already have an account? '}
            <button
              data-testid="toggle-auth-mode"
              onClick={() => { setAuthMode(m => m === 'login' ? 'register' : 'login'); setError(null); }}
              className="text-emerald-600 font-semibold hover:underline"
            >
              {authMode === 'login' ? 'Sign up' : 'Sign in'}
            </button>
          </p>

          <p className="text-xs text-stone-400 text-center mt-6">
            By signing in, you agree to our Terms of Service and Privacy Policy.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Landing;