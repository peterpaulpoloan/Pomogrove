
import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";

// The values are primarily read from window.process.env (polyfilled in index.html)
const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_FIREBASE_APP_ID
};

// Initialize Firebase App only once
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Initialize Firebase Auth using the initialized app instance
// This is critical to ensure the 'auth' component is registered to this specific app instance
export const auth = getAuth(app);

// Connectivity sanity check
if (!firebaseConfig.apiKey || firebaseConfig.apiKey.includes('MOCK')) {
  console.warn("Pomogrove Warning: Firebase API Key might be missing. Using values from index.html polyfill.");
} else {
  console.log("Pomogrove: Firebase initialized successfully with project", firebaseConfig.projectId);
}
