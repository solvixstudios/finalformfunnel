import {
  signInWithPopup,
  signOut,
  GoogleAuthProvider,
  onAuthStateChanged,
  User,
  setPersistence,
  browserLocalPersistence,
} from 'firebase/auth';
import { auth } from './firebase';

export interface GoogleUser {
  id: string;
  email: string;
  displayName: string;
  photoURL: string | null;
  createdAt: string;
}

const SESSION_KEY = 'google_user_session';

export const getStoredUser = (): GoogleUser | null => {
  try {
    const stored = localStorage.getItem(SESSION_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (e) {
    console.error('Failed to parse stored user session', e);
    localStorage.removeItem(SESSION_KEY);
  }
  return null;
};

export const storeUser = (user: GoogleUser): void => {
  localStorage.setItem(SESSION_KEY, JSON.stringify(user));
};

export const clearUser = (): void => {
  localStorage.removeItem(SESSION_KEY);
};

export const signInWithGoogle = async (): Promise<GoogleUser> => {
  try {
    // Enable persistence
    await setPersistence(auth, browserLocalPersistence);

    const provider = new GoogleAuthProvider();
    // Request additional scopes if needed
    provider.addScope('profile');
    provider.addScope('email');

    const result = await signInWithPopup(auth, provider);
    const firebaseUser = result.user;

    const user: GoogleUser = {
      id: firebaseUser.uid,
      email: firebaseUser.email || '',
      displayName: firebaseUser.displayName || 'User',
      photoURL: firebaseUser.photoURL,
      createdAt: new Date().toISOString(),
    };

    storeUser(user);
    return user;
  } catch (error: any) {
    console.error('Google sign-in error:', error);
    throw new Error(error.message || 'Failed to sign in with Google');
  }
};

export const signOutUser = async (): Promise<void> => {
  try {
    await signOut(auth);
    clearUser();
  } catch (error: any) {
    console.error('Sign out error:', error);
    throw new Error(error.message || 'Failed to sign out');
  }
};

export const onAuthStateChange = (callback: (user: GoogleUser | null) => void) => {
  return onAuthStateChanged(auth, (firebaseUser) => {
    if (firebaseUser) {
      const user: GoogleUser = {
        id: firebaseUser.uid,
        email: firebaseUser.email || '',
        displayName: firebaseUser.displayName || 'User',
        photoURL: firebaseUser.photoURL,
        createdAt: firebaseUser.metadata?.creationTime || new Date().toISOString(),
      };
      storeUser(user);
      callback(user);
    } else {
      clearUser();
      callback(null);
    }
  });
};
