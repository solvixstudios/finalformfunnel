import { ArrowRight, Layers, Gauge, Shield, Code, Smartphone, Check, Sparkles, Menu, X } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useI18n } from '../lib/i18n/i18nContext';
import { Language } from '../lib/i18n/translations';

const Landing = () => {
  const navigate = useNavigate();
  const { t, language, setLanguage, dir } = useI18n();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const languages: { code: Language; name: string; flag: string }[] = [
    { code: 'ar', name: 'العربية', flag: '🇸🇦' },
    { code: 'en', name: 'English', flag: '🇺🇸' },
    { code: 'fr', name: 'Français', flag: '🇫🇷' },
  ];

  const features = [
    {
      icon: <Layers size={20} />,
      title: 'Visual Builder',
      description: 'Drag-and-drop interface to create stunning forms without coding',
    },
    {
      icon: <Gauge size={20} />,
      title: 'High Performance',
      description: 'Optimized for conversion with analytics and insights',
    },
    {
      icon: <Shield size={20} />,
      title: 'Enterprise Security',
      description: 'Enterprise-grade security with SSL encryption and data protection',
    },
    {
      icon: <Code size={20} />,
      title: 'Developer Friendly',
      description: 'Export JSON, integrate with webhooks, and build custom integrations',
    },
    {
      icon: <Smartphone size={20} />,
      title: 'Mobile First',
      description: 'Fully responsive forms that work perfectly on all devices',
    },
    {
      icon: <Sparkles size={20} />,
      title: 'Lightning Fast',
      description: 'Optimized performance with instant loading and smooth interactions',
    },
  ];

  const benefits = [
    'No credit card required',
    'Free trial available',
    'Cancel anytime',
    '24/7 support',
  ];

  return (
    <div className="min-h-screen bg-white" dir={dir}>
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 h-16 bg-white border-b border-slate-200 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-slate-900 rounded-lg flex items-center justify-center">
              <Sparkles size={16} className="text-white" />
            </div>
            <span className="font-bold text-slate-900 text-lg tracking-tight">
              {language === 'ar' ? 'فاينل فورم' : 'Final Form'}
            </span>
          </div>
          <div className="hidden sm:flex items-center gap-4">
            <div className="flex gap-1 bg-slate-100 rounded-lg p-1">
              {languages.map((lang) => (
                <button
                  key={lang.code}
                  onClick={() => setLanguage(lang.code)}
                  title={lang.name}
                  className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                    language === lang.code
                      ? 'bg-white text-slate-900 shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {lang.flag}
                </button>
              ))}
            </div>
            <button
              onClick={() => navigate('/auth')}
              className="px-5 py-2 bg-slate-900 text-white rounded-lg font-medium text-sm hover:bg-slate-800 transition-colors"
            >
              {t('auth.welcomeBack')}
            </button>
          </div>
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="sm:hidden p-2 text-slate-600"
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </nav>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="fixed top-16 left-0 right-0 bg-white border-b border-slate-200 z-40 sm:hidden">
          <div className="px-4 py-4 space-y-3">
            <div className="flex gap-1 bg-slate-100 rounded-lg p-1">
              {languages.map((lang) => (
                <button
                  key={lang.code}
                  onClick={() => {
                    setLanguage(lang.code);
                    setMobileMenuOpen(false);
                  }}
                  className={`flex-1 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    language === lang.code
                      ? 'bg-white text-slate-900 shadow-sm'
                      : 'text-slate-600'
                  }`}
                >
                  {lang.flag} {lang.name}
                </button>
              ))}
            </div>
            <button
              onClick={() => {
                navigate('/auth');
                setMobileMenuOpen(false);
              }}
              className="w-full px-5 py-2.5 bg-slate-900 text-white rounded-lg font-medium text-sm"
            >
              {t('auth.welcomeBack')}
            </button>
          </div>
        </div>
      )}

      {/* Hero Section */}
      <section className="pt-32 pb-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-slate-100 border border-slate-200 rounded-full mb-8">
            <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
            <span className="text-xs font-medium text-slate-600 uppercase tracking-wider">
              {t('landing.tagline')}
            </span>
          </div>

          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold text-slate-900 mb-6 leading-tight tracking-tight">
            {t('landing.title')}
            <span className="block text-slate-600 mt-2">
              {t('landing.subtitle')}
            </span>
          </h1>

          <p className="text-xl text-slate-600 max-w-2xl mx-auto mb-12 leading-relaxed">
            {t('landing.description')}
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
            <button
              onClick={() => navigate('/auth')}
              className="group px-8 py-4 bg-slate-900 text-white rounded-lg font-semibold text-base hover:bg-slate-800 transition-colors flex items-center justify-center gap-2"
            >
              {t('landing.getStarted')}
              <ArrowRight size={20} className="group-hover:translate-x-0.5 transition-transform" />
            </button>
            <button
              onClick={() => navigate('/auth')}
              className="px-8 py-4 border-2 border-slate-200 text-slate-900 rounded-lg font-semibold text-base hover:border-slate-300 hover:bg-slate-50 transition-colors"
            >
              {t('landing.viewDemo')}
            </button>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-8 text-sm text-slate-600">
            {benefits.map((benefit, index) => (
              <div key={index} className="flex items-center gap-2">
                <Check size={16} className="text-slate-400" />
                <span>{benefit}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 bg-slate-50 border-y border-slate-200">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl sm:text-5xl font-extrabold text-slate-900 mb-4 tracking-tight">
              {t('landing.everything')}
            </h2>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              {t('landing.features')}
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <div
                key={index}
                className="p-8 bg-white border border-slate-200 rounded-xl hover:border-slate-300 hover:shadow-sm transition-all"
              >
                <div className="w-12 h-12 bg-slate-100 rounded-lg flex items-center justify-center text-slate-900 mb-6">
                  {feature.icon}
                </div>
                <h3 className="font-bold text-slate-900 mb-3 text-lg">{feature.title}</h3>
                <p className="text-slate-600 leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-slate-100 rounded-2xl mb-8">
            <Sparkles size={24} className="text-slate-900" />
          </div>
          <h2 className="text-4xl sm:text-5xl font-extrabold text-slate-900 mb-6 tracking-tight">
            {t('landing.ready')}
          </h2>
          <p className="text-xl text-slate-600 mb-12 max-w-2xl mx-auto leading-relaxed">
            {t('landing.subtitle2')}
          </p>
          <button
            onClick={() => navigate('/auth')}
            className="group px-8 py-4 bg-slate-900 text-white rounded-lg font-semibold text-base hover:bg-slate-800 transition-colors flex items-center gap-2 mx-auto"
          >
            {t('landing.startFreeNow')}
            <ArrowRight size={20} className="group-hover:translate-x-0.5 transition-transform" />
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 sm:px-6 lg:px-8 border-t border-slate-200 bg-white">
        <div className="max-w-7xl mx-auto text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="w-6 h-6 bg-slate-900 rounded flex items-center justify-center">
              <Sparkles size={12} className="text-white" />
            </div>
            <span className="font-bold text-slate-900">Final Form</span>
          </div>
          <p className="text-sm text-slate-500">
            © 2024 Final Form. {t('landing.everything')}. | Version 4.0.0
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
