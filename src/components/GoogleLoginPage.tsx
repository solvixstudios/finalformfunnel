import { motion } from 'framer-motion';
import { AlertCircle, CheckCircle2, Loader2, Quote, Star } from 'lucide-react';
import { useEffect, useState } from 'react';
import { GoogleUser, signInWithGoogle } from '../lib/authGoogle';
import { useI18n } from '../lib/i18n/i18nContext';
import { Language } from '../lib/i18n/translations';

interface GoogleLoginPageProps {
  onLoginSuccess: (user: GoogleUser) => void;
}

const GoogleLoginPage = ({ onLoginSuccess }: GoogleLoginPageProps) => {
  const { t, language, setLanguage, dir } = useI18n();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [isMounting, setIsMounting] = useState(false);

  useEffect(() => {
    setIsMounting(true);
  }, []);

  const handleGoogleSignIn = async () => {
    setError('');
    setIsLoading(true);

    try {
      const user = await signInWithGoogle();
      onLoginSuccess(user);
    } catch (err: unknown) {
      setError(err.message || t('auth.failedToSignIn'));
    } finally {
      setIsLoading(false);
    }
  };

  const languages: { code: Language; name: string; flag: string }[] = [
    { code: 'ar', name: 'العربية', flag: '🇸🇦' },
    { code: 'en', name: 'English', flag: '🇺🇸' },
    { code: 'fr', name: 'Français', flag: '🇫🇷' },
  ];

  if (!isMounting) return null;

  return (
    <div className="min-h-screen w-full flex bg-[#FAFAFA] font-sans" dir={dir}>

      {/* --- Left Panel: Auth Form (50%) --- */}
      <div className="w-full lg:w-1/2 flex flex-col p-6 sm:p-12 lg:p-20 justify-between bg-white relative z-10">

        {/* Header / Language */}
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-slate-900 rounded-lg flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <span className="font-bold text-slate-900 tracking-tight">Final Form</span>
          </div>

          <div className="flex gap-2">
            {languages.map((lang) => (
              <button
                key={lang.code}
                onClick={() => setLanguage(lang.code)}
                title={lang.name}
                className={`w-8 h-8 flex items-center justify-center rounded-full text-sm transition-all ${language === lang.code
                  ? 'bg-slate-100 text-slate-900 ring-1 ring-slate-200'
                  : 'text-slate-400 hover:bg-slate-50'
                  }`}
              >
                {lang.flag}
              </button>
            ))}
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-sm w-full mx-auto space-y-8">
          <div className="text-center sm:text-left">
            <h1 className="text-3xl font-extrabold text-slate-900 mb-3 tracking-tight">
              {t('auth.welcomeBack')}
            </h1>
            <p className="text-slate-500 text-lg">
              {t('auth.signInDescription')}
            </p>
          </div>

          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-start gap-3 p-4 bg-red-50 text-red-600 rounded-xl border border-red-100 text-sm"
            >
              <AlertCircle size={18} className="shrink-0 mt-0.5" />
              <p>{error}</p>
            </motion.div>
          )}

          <button
            onClick={handleGoogleSignIn}
            disabled={isLoading}
            className="w-full h-14 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300 rounded-full font-semibold text-base flex items-center justify-center gap-3 transition-all duration-200 active:scale-[0.98] shadow-sm hover:shadow-md disabled:opacity-70 disabled:cursor-not-allowed group"
          >
            {isLoading ? (
              <Loader2 size={20} className="animate-spin text-slate-400" />
            ) : (
              <div className="flex items-center gap-3">
                {/* Google Logo */}
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                </svg>
                <span>{t('auth.signInWithGoogle')}</span>
              </div>
            )}
          </button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-100" />
            </div>
            <div className="relative flex justify-center text-xs uppercase tracking-wide">
              <span className="px-4 bg-white text-slate-400 font-medium">Trusted by teams at</span>
            </div>
          </div>

          <div className="flex justify-center gap-6 opacity-40 grayscale">
            {/* Dummy logos for social proof */}
            <div className="h-6 w-20 bg-slate-900 rounded" />
            <div className="h-6 w-20 bg-slate-900 rounded" />
            <div className="h-6 w-20 bg-slate-900 rounded" />
          </div>
        </div>

        {/* Footer */}
        <div className="text-center sm:text-left text-sm text-slate-400">
          © 2024 Final Form. All rights reserved.
        </div>
      </div>

      {/* --- Right Panel: Art Direction (50%) --- */}
      <div className="hidden lg:flex w-1/2 bg-[#FFF4ED] relative items-center justify-center p-20 overflow-hidden">

        {/* Abstract Shapes */}
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-gradient-to-br from-orange-300/20 to-amber-300/20 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-white/60 rounded-full blur-[80px] pointer-events-none" />

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="relative z-10 max-w-md"
        >
          {/* Testimonial Card */}
          <div className="bg-white p-10 rounded-[2.5rem] shadow-[0_20px_50px_-12px_rgba(0,0,0,0.05)] border border-slate-100/50 relative">
            <Quote className="absolute top-10 left-8 text-orange-100 fill-orange-50 w-16 h-16 -z-10 transform -translate-x-2 -translate-y-2" />

            <div className="mb-6 flex gap-1">
              {[1, 2, 3, 4, 5].map(i => (
                <Star key={i} size={16} className="text-amber-400 fill-amber-400" />
              ))}
            </div>

            <p className="text-xl font-medium text-slate-900 leading-relaxed mb-8">
              "Final Form transformed how we collect leads. The designs are stunning and conversion rates doubled overnight."
            </p>

            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-slate-100 overflow-hidden">
                <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Felix" alt="User" />
              </div>
              <div>
                <div className="font-bold text-slate-900">Sarah Jenkins</div>
                <div className="text-sm text-slate-500">Product Designer @ Solvix</div>
              </div>
            </div>
          </div>

          {/* Floating decoration */}
          <motion.div
            animate={{ y: [0, -10, 0] }}
            transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
            className="absolute -right-12 -top-12 bg-orange-500 text-white p-4 rounded-2xl shadow-lg shadow-orange-500/20 rotate-12"
          >
            <CheckCircle2 size={32} />
          </motion.div>

        </motion.div>
      </div>

    </div>
  );
};

export default GoogleLoginPage;
