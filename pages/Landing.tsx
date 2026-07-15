import React, { useState } from 'react';
import { Sprout, AlertCircle, Mail, Lock } from 'lucide-react';
import * as Auth from 'firebase/auth';
import { auth } from '../lib/firebase';

const {
  signInWithPopup,
  signInWithRedirect,
  GoogleAuthProvider,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
} = Auth as any;

interface LandingProps {
  onLogin: (user: any) => void;
}

const Landing: React.FC<LandingProps> = () => {
  const [error, setError]     = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // ── Native email/password state ─────────────────────────────────────────
  const [mode, setMode]         = useState<'signin' | 'signup'>('signin');
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

  // ── Native email/password sign-in / sign-up ─────────────────────────────
  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email || !password) {
      setError('Please enter both email and password.');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    setLoading(true);
    try {
      if (mode === 'signin') {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        await createUserWithEmailAndPassword(auth, email, password);
      }
    } catch (err: any) {
      setError(friendlyAuthError(err.code) || err.message || 'An error occurred during authentication.');
      setLoading(false);
    }
  };

  const friendlyAuthError = (code?: string) => {
    switch (code) {
      case 'auth/invalid-email':
        return 'That email address looks invalid.';
      case 'auth/user-not-found':
        return 'No account found with that email.';
      case 'auth/wrong-password':
      case 'auth/invalid-credential':
        return 'Incorrect email or password.';
      case 'auth/email-already-in-use':
        return 'An account already exists with that email.';
      case 'auth/weak-password':
        return 'Password is too weak. Please use at least 6 characters.';
      default:
        return null;
    }
  };

  const toggleMode = () => {
    setError(null);
    setMode((m) => (m === 'signin' ? 'signup' : 'signin'));
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row">

      {/* ── Hero panel ─────────────────────────────────────────────────────── */}
      <div className="md:w-1/2 bg-emerald-600 flex flex-col items-center justify-center p-8 sm:p-10 md:p-12 text-white">
        <div className="max-w-md text-center">
          <Sprout size={56} className="mx-auto mb-4 sm:mb-6 md:w-20 md:h-20" />
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4 tracking-tight">Plant your focus.</h1>
          <p className="text-emerald-100 text-base sm:text-lg">
            Pomogrove helps you cultivate healthy study habits through gamified sessions,
            active recall, and seamless note-taking.
          </p>
          <div className="mt-8 md:mt-12 grid grid-cols-2 gap-4 text-emerald-900 font-semibold">
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
      <div className="md:w-1/2 flex items-center justify-center p-6 sm:p-8 bg-stone-50">
        <div className="w-full max-w-sm">

          {/* Heading */}
          <div className="text-center mb-8">
            <h2 className="text-2xl sm:text-3xl font-bold text-stone-900 mb-2">Welcome to PomoGrove</h2>
            <p className="text-stone-500 text-sm">
              {mode === 'signin'
                ? 'Sign in to start growing your productivity tree.'
                : 'Create an account to start growing your productivity tree.'}
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

          {/* Native email/password form */}
          <form onSubmit={handleEmailAuth} className="space-y-3 mb-4">
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" size={18} />
              <input
                data-testid="email-input"
                type="email"
                autoComplete="email"
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
                className="w-full py-3 pl-10 pr-4 bg-white border-2 border-stone-200 rounded-xl text-stone-800
                  placeholder:text-stone-400 focus:outline-none focus:border-emerald-500 transition-colors"
              />
            </div>

            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" size={18} />
              <input
                data-testid="password-input"
                type="password"
                autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
                className="w-full py-3 pl-10 pr-4 bg-white border-2 border-stone-200 rounded-xl text-stone-800
                  placeholder:text-stone-400 focus:outline-none focus:border-emerald-500 transition-colors"
              />
            </div>

            <button
              data-testid="email-auth-submit-btn"
              type="submit"
              disabled={loading}
              className={`w-full py-3 bg-emerald-600 text-white rounded-xl font-bold
                hover:bg-emerald-700 transition-colors shadow-lg flex items-center justify-center
                ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-emerald-200 border-t-white rounded-full animate-spin" />
              ) : mode === 'signin' ? (
                'Sign in'
              ) : (
                'Create account'
              )}
            </button>
          </form>

          <p className="text-center text-sm text-stone-500 mb-6">
            {mode === 'signin' ? "Don't have an account? " : 'Already have an account? '}
            <button
              type="button"
              data-testid="toggle-auth-mode-btn"
              onClick={toggleMode}
              disabled={loading}
              className="text-emerald-600 font-semibold hover:underline"
            >
              {mode === 'signin' ? 'Sign up' : 'Sign in'}
            </button>
          </p>

          {/* Divider */}
          <div className="flex items-center gap-3 mb-6">
            <div className="h-px flex-1 bg-stone-200" />
            <span className="text-xs uppercase text-stone-400 font-semibold">or</span>
            <div className="h-px flex-1 bg-stone-200" />
          </div>

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
                <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                <span className="truncate">Sign in with Google</span>
              </>
            )}
          </button>

          <p className="text-xs text-stone-400 text-center mt-6">
            By signing in, you agree to our Terms of Service and Privacy Policy.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Landing;