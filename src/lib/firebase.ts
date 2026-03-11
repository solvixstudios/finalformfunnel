import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Replace with your Firebase config
// You'll need to get this from your Firebase project settings
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || 'YOUR_API_KEY',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'YOUR_AUTH_DOMAIN',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'YOUR_PROJECT_ID',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || 'YOUR_STORAGE_BUCKET',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || 'YOUR_MESSAGING_SENDER_ID',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || 'YOUR_APP_ID',
};

// 🛡️ ISOLATION GUARD: Ensure UI never cross-contaminates databases
const isDev = import.meta.env.MODE === 'development';
if (isDev && firebaseConfig.projectId !== 'finalformfunnel-beta') {
  console.error('🚨 UI CRITICAL ERROR: Dev Mode loaded Production Project ID.');
  console.error(`Expected: finalformfunnel-beta | Received: ${firebaseConfig.projectId}`);
  // We don't throw an error here because it might block rendering for the user to see the issue in console
  // but the console error string is loud and clear.
} else if (!isDev && firebaseConfig.projectId !== 'finalformfunnel') {
  console.error('🚨 UI CRITICAL ERROR: Prod Mode loaded Dev Project ID.');
  console.error(`Expected: finalformfunnel | Received: ${firebaseConfig.projectId}`);
}

// Initialize Firebase
export const app = initializeApp(firebaseConfig);

// Get auth instance
export const auth = getAuth(app);

// Get Firestore instance
export const db = getFirestore(app);
