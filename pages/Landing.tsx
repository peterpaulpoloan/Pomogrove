import React, { useState } from 'react';
import { Sprout, AlertCircle } from 'lucide-react';
import * as Auth from 'firebase/auth';
import { auth } from '../lib/firebase';

const { 
  signInWithPopup,
  signInWithRedirect,
  GoogleAuthProvider
} = Auth as any;

interface LandingProps {
  onLogin: (user: any) => void;
}

const Landing: React.FC<LandingProps> = () => {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleGoogleSignIn = async () => {
    setError(null);
    setLoading(true);

    try {
      const provider = new GoogleAuthProvider();
      console.log("Attempting popup sign-in...");
      
      try {
        // Try popup first
        const result = await signInWithPopup(auth, provider);
        console.log("Popup sign-in successful:", result.user.email);
        // App.tsx onAuthStateChanged will handle the rest
      } catch (popupError: any) {
        console.log("Popup failed, trying redirect:", popupError.code);
        
        if (popupError.code === 'auth/popup-blocked' || popupError.code === 'auth/popup-closed-by-user') {
          // If popup is blocked, fall back to redirect
          console.log("Using redirect method instead...");
          await signInWithRedirect(auth, provider);
        } else {
          throw popupError;
        }
      }
    } catch (err: any) {
      console.error("Sign-in error:", err);
      setError(err.message || 'An error occurred during authentication.');
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
              Welcome to PomoGrove
            </h2>
            <p className="text-stone-500">
              Sign in with your Google account to start growing your productivity tree.
            </p>
          </div>

          <div className="space-y-4">
            {error && (
              <div className="bg-rose-50 text-rose-600 p-3 rounded-xl flex items-start gap-2 text-sm font-medium leading-tight">
                <AlertCircle className="shrink-0 mt-0.5" size={18} />
                <span>{error}</span>
              </div>
            )}

            <button
              onClick={handleGoogleSignIn}
              disabled={loading}
              className={`w-full py-3 bg-white border-2 border-stone-200 text-stone-700 rounded-xl font-bold hover:bg-stone-50 transition-colors shadow-lg flex items-center justify-center gap-3 ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
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

            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-stone-200"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-stone-50 text-stone-500">New to PomoGrove?</span>
              </div>
            </div>

            <a
              href="https://accounts.google.com/signup"
              target="_blank"
              rel="noopener noreferrer"
              className="block w-full py-3 bg-stone-900 text-white rounded-xl font-bold hover:bg-stone-800 transition-colors shadow-lg text-center"
            >
              Create Google Account
            </a>

            <p className="text-xs text-stone-400 text-center mt-6">
              By signing in, you agree to our Terms of Service and Privacy Policy.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Landing;