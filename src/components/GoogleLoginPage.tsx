import { AlertCircle, Loader2, Mail, Globe } from 'lucide-react';
import { useState, useEffect } from 'react';
import { signInWithGoogle } from '../lib/authGoogle';
import { GoogleUser } from '../lib/authGoogle';
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
    } catch (err: any) {
      setError(err.message || t('auth.failedToSignIn'));
    } finally {
      setIsLoading(false);
    }
  };

  if (!isMounting) return null;

  const languages: { code: Language; name: string; flag: string }[] = [
    { code: 'ar', name: 'العربية', flag: '🇸🇦' },
    { code: 'en', name: 'English', flag: '🇺🇸' },
    { code: 'fr', name: 'Français', flag: '🇫🇷' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 flex items-center justify-center p-6" dir={dir}>
      {/* Animated Background Pattern */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-indigo-500/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/2 right-0 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
      </div>

      {/* Content */}
      <div className="relative w-full max-w-md">
        {/* Language Selector */}
        <div className="absolute top-0 right-0 flex gap-2">
          {languages.map((lang) => (
            <button
              key={lang.code}
              onClick={() => setLanguage(lang.code)}
              title={lang.name}
              className={`px-3 py-2 rounded-lg font-semibold text-sm transition-all ${
                language === lang.code
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30'
                  : 'bg-white/5 border border-white/10 text-slate-300 hover:bg-white/10'
              }`}
            >
              {lang.flag} {lang.name}
            </button>
          ))}
        </div>

        {/* Logo & Header */}
        <div className="text-center mb-10 mt-20">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-3xl shadow-2xl shadow-indigo-500/40 mb-6 animate-in fade-in duration-500">
            <svg className="w-10 h-10 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 2L2 7v10c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-10-5z" />
            </svg>
          </div>
          <h1 className="text-4xl font-black text-white tracking-tight mb-2">
            {language === 'ar' ? 'فاينل فورم' : 'Final Form'}
          </h1>
          <p className="text-slate-400 text-base">
            {t('landing.tagline')}
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8 shadow-2xl animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="space-y-6">
            {/* Description */}
            <div>
              <h2 className="text-xl font-bold text-white mb-2">
                {t('auth.welcomeBack')}
              </h2>
              <p className="text-sm text-slate-400">
                {t('auth.signInDescription')}
              </p>
            </div>

            {/* Error Message */}
            {error && (
              <div className="flex items-start gap-3 p-4 bg-red-500/10 border border-red-500/20 rounded-xl animate-in fade-in">
                <AlertCircle size={18} className="text-red-400 shrink-0 mt-0.5" />
                <p className="text-sm text-red-300">{error}</p>
              </div>
            )}

            {/* Google Sign-In Button */}
            <button
              onClick={handleGoogleSignIn}
              disabled={isLoading}
              className="w-full bg-white text-slate-900 px-6 py-4 rounded-xl font-bold text-sm uppercase tracking-wider flex items-center justify-center gap-3 transition-all duration-200 hover:bg-slate-100 active:scale-[0.98] shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  {t('auth.signingIn')}
                </>
              ) : (
                <>
                  <Mail size={18} />
                  {t('auth.signInWithGoogle')}
                </>
              )}
            </button>

            {/* Divider */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-white/10" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="px-2 bg-slate-900 text-slate-500">{t('auth.orContinue')}</span>
              </div>
            </div>

            {/* Info Text */}
            <p className="text-xs text-slate-500 text-center">
              {t('auth.termsAgreement')}
            </p>
          </div>
        </div>

        {/* Features Section */}
        <div className="grid grid-cols-3 gap-4 mt-10">
          {[
            { icon: '⚡', label: t('auth.lightningFast') },
            { icon: '✨', label: t('auth.easyToUse') },
            { icon: '🔒', label: t('auth.fullySecure') },
          ].map((feature, i) => (
            <div key={i} className="text-center">
              <div className="w-10 h-10 bg-indigo-500/20 rounded-lg flex items-center justify-center mx-auto mb-2">
                <span className="text-lg">{feature.icon}</span>
              </div>
              <p className="text-xs text-slate-400 font-medium">{feature.label}</p>
            </div>
          ))}
        </div>

        {/* Footer */}
        <p className="text-center text-slate-600 text-xs mt-10">
          Version 4.0.0 · Final Form Pro
        </p>
      </div>
    </div>
  );
};

export default GoogleLoginPage;
