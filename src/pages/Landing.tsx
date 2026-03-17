import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useI18n } from '../lib/i18n/i18nContext';
import { getStoredUser, GoogleUser, onAuthStateChange } from '../lib/authGoogle';

export default function Landing() {
  const { setLanguage, dir } = useI18n();
  const [user, setUser] = useState<GoogleUser | null>(getStoredUser());

  useEffect(() => {
    const unsubscribe = onAuthStateChange(async (authUser) => {
      setUser(authUser);
    });
    return () => unsubscribe();
  }, []);

  return (
    <div className="min-h-screen bg-obsidian text-white p-8 font-sans" dir={dir}>
      <div className="max-w-md">
        <h1 className="text-2xl font-bold mb-6">Navigation Links</h1>
        
        <div className="flex flex-col gap-4 text-lg">
          <Link to="/dashboard" className="text-blue-400 hover:text-blue-300 hover:underline">
            Dashboard
          </Link>

          <Link to="/admin" className="text-blue-400 hover:text-blue-300 hover:underline">
            Admin Dashboard
          </Link>
          
          {!user && (
            <Link to="/auth" className="text-blue-400 hover:text-blue-300 hover:underline">
              Login
            </Link>
          )}
        </div>

        <div className="mt-12">
          <h2 className="text-xl font-bold mb-4">Languages</h2>
          <div className="flex gap-4">
            <button 
              onClick={() => setLanguage('ar')} 
              className="px-4 py-2 bg-zinc-800 rounded hover:bg-zinc-700"
            >
              AR
            </button>
            <button 
              onClick={() => setLanguage('fr')} 
              className="px-4 py-2 bg-zinc-800 rounded hover:bg-zinc-700"
            >
              FR
            </button>
            <button 
              onClick={() => setLanguage('en')} 
              className="px-4 py-2 bg-zinc-800 rounded hover:bg-zinc-700"
            >
              EN
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
