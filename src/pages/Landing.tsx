import { motion } from 'framer-motion';
import { ArrowRight, BarChart3, CheckCircle2, Code, Gauge, Layers, Menu, Shield, Smartphone, Sparkles, X, Zap } from 'lucide-react';
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

  /* 
    DESIGN SYSTEM CONSTANTS
    Primary Gradient: from-orange-600 to-amber-600
    Canvas: bg-[#FAFAFA]
    Surface: bg-white
    Text: slate-900 / slate-500
  */

  return (
    <div className="min-h-screen bg-[#FAFAFA] font-sans selection:bg-orange-100 selection:text-orange-900 overflow-x-hidden" dir={dir}>

      {/* --- Navigation --- */}
      <nav className="fixed top-0 left-0 right-0 h-16 backdrop-blur-md bg-white/70 border-b border-slate-200/60 z-50 transition-all duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-slate-900 to-slate-800 rounded-lg flex items-center justify-center shadow-lg shadow-slate-900/10">
              <Sparkles size={16} className="text-white" />
            </div>
            <span className="font-bold text-slate-900 text-lg tracking-tight">
              {language === 'ar' ? 'فاينل فورم' : 'Final Form'}
            </span>
          </div>

          <div className="hidden sm:flex items-center gap-4">
            <div className="flex gap-1 bg-slate-100/80 rounded-full p-1 border border-slate-200/60">
              {languages.map((lang) => (
                <button
                  key={lang.code}
                  onClick={() => setLanguage(lang.code)}
                  title={lang.name}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition-all duration-300 ${language === lang.code
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-500 hover:text-slate-900'
                    }`}
                >
                  {lang.flag}
                </button>
              ))}
            </div>
            <button
              onClick={() => navigate('/auth')}
              className="h-10 px-6 rounded-full bg-slate-900 text-white font-medium text-sm hover:bg-slate-800 transition-all shadow-lg shadow-slate-900/10 hover:shadow-slate-900/20 active:scale-95"
            >
              {t('auth.welcomeBack')}
            </button>
          </div>

          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="sm:hidden p-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </nav>

      {/* --- Mobile Menu --- */}
      {mobileMenuOpen && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="fixed top-16 left-0 right-0 bg-white border-b border-slate-200 z-40 sm:hidden shadow-xl"
        >
          <div className="px-4 py-6 space-y-4">
            <div className="flex gap-2 bg-slate-50 rounded-xl p-1.5 overflow-x-auto">
              {languages.map((lang) => (
                <button
                  key={lang.code}
                  onClick={() => {
                    setLanguage(lang.code);
                    setMobileMenuOpen(false);
                  }}
                  className={`flex-1 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${language === lang.code
                    ? 'bg-white text-slate-900 shadow-sm ring-1 ring-slate-200'
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
              className="w-full h-12 bg-slate-900 text-white rounded-xl font-bold text-sm shadow-lg shadow-slate-900/20"
            >
              {t('auth.welcomeBack')}
            </button>
          </div>
        </motion.div>
      )}

      {/* --- Hero Section --- */}
      <section className="pt-40 pb-24 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
        {/* Ambient Glows */}
        <div className="absolute top-20 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-orange-400/10 blur-[100px] rounded-full pointer-events-none" />
        <div className="absolute top-40 right-0 w-[600px] h-[600px] bg-amber-300/10 blur-[120px] rounded-full pointer-events-none" />

        <div className="max-w-7xl mx-auto text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-slate-200/60 rounded-full shadow-sm mb-8 backdrop-blur-sm">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-gradient-to-r from-orange-500 to-amber-500"></span>
              </span>
              <span className="text-sm font-semibold text-slate-600 tracking-wide">
                {t('landing.tagline')}
              </span>
            </div>

            <h1 className="text-6xl md:text-7xl font-extrabold text-slate-900 mb-8 leading-[1.1] tracking-tighter">
              {t('landing.title')}
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-orange-600 to-amber-600 mt-2 pb-2">
                {t('landing.subtitle')}
              </span>
            </h1>

            <p className="text-xl text-slate-500 max-w-2xl mx-auto mb-12 leading-relaxed font-medium">
              {t('landing.description')}
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-24">
              <button
                onClick={() => navigate('/auth')}
                className="group h-14 px-10 rounded-full bg-gradient-to-r from-orange-600 to-amber-600 text-white font-bold text-lg shadow-[0_4px_20px_-4px_rgba(234,88,12,0.3)] hover:shadow-[0_8px_25px_-4px_rgba(234,88,12,0.4)] hover:-translate-y-0.5 transition-all duration-300 flex items-center justify-center gap-2"
              >
                {t('landing.getStarted')}
                <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
              </button>
              <button
                onClick={() => navigate('/auth')}
                className="h-14 px-10 rounded-full bg-white border border-slate-200 text-slate-600 font-bold text-lg hover:bg-slate-50 hover:border-slate-300 hover:text-slate-900 transition-all flex items-center justify-center shadow-sm"
              >
                {t('landing.viewDemo')}
              </button>
            </div>
          </motion.div>

          {/* 3D Floating Dashboard Visual */}
          <motion.div
            initial={{ opacity: 0, rotateX: 20, y: 100 }}
            animate={{ opacity: 1, rotateX: 12, y: 0 }}
            transition={{ duration: 1, delay: 0.2, type: "spring" }}
            style={{ perspective: '1000px', transformStyle: 'preserve-3d' }}
            className="relative mx-auto max-w-5xl"
          >
            <div className="relative rounded-3xl bg-white border border-slate-200/60 shadow-2xl shadow-slate-200 overflow-hidden transform transition-all hover:rotate-x-0 duration-700 ease-out group">
              {/* Fake UI Header */}
              <div className="h-14 bg-white border-b border-slate-100 flex items-center px-6 gap-3">
                <div className="flex gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-400/80" />
                  <div className="w-3 h-3 rounded-full bg-amber-400/80" />
                  <div className="w-3 h-3 rounded-full bg-green-400/80" />
                </div>
                <div className="flex-1 flex justify-center">
                  <div className="h-6 w-64 bg-slate-50 rounded-full" />
                </div>
              </div>
              {/* Fake UI Content */}
              <div className="p-8 bg-[#FAFAFA] min-h-[500px] flex gap-8">
                {/* Sidebar */}
                <div className="w-48 hidden md:flex flex-col gap-4">
                  {[1, 2, 3, 4].map(i => (
                    <div key={i} className={`h-10 rounded-xl w-full ${i === 1 ? 'bg-orange-50' : 'bg-slate-100'}`} />
                  ))}
                </div>
                {/* Main Area */}
                <div className="flex-1 flex flex-col gap-6">
                  <div className="grid grid-cols-3 gap-6">
                    <div className="h-32 bg-white rounded-2xl border border-slate-100 shadow-sm" />
                    <div className="h-32 bg-white rounded-2xl border border-slate-100 shadow-sm" />
                    <div className="h-32 bg-white rounded-2xl border border-slate-100 shadow-sm" />
                  </div>
                  <div className="h-64 bg-white rounded-2xl border border-slate-100 shadow-sm" />
                </div>
              </div>

              {/* Overlay Gradient for depth */}
              <div className="absolute inset-0 bg-gradient-to-t from-white/50 to-transparent pointer-events-none" />
            </div>

            {/* Background blurred element behind dashboard for glow */}
            <div className="absolute -inset-4 bg-gradient-to-r from-orange-500/20 to-amber-500/20 blur-3xl -z-10 rounded-[3rem]" />
          </motion.div>
        </div>
      </section>

      {/* --- Bento Grid Features --- */}
      <section className="py-32 px-4 sm:px-6 lg:px-8 relative">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20">
            <h2 className="text-4xl sm:text-5xl font-extrabold text-slate-900 mb-6 tracking-tight">
              {t('landing.everything')}
            </h2>
            <p className="text-lg text-slate-500 max-w-2xl mx-auto">
              {t('landing.features')}
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 grid-rows-2 gap-6 h-auto lg:h-[600px]">

            {/* Large Left Card - Visual Builder */}
            <div className="lg:col-span-2 lg:row-span-2 bg-white rounded-[2rem] border border-slate-100 p-8 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-br from-orange-50/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="relative z-10 h-full flex flex-col">
                <div className="w-14 h-14 bg-orange-100 rounded-2xl flex items-center justify-center mb-6 text-orange-600">
                  <Layers size={28} />
                </div>
                <h3 className="text-3xl font-bold text-slate-900 mb-4">Visual Builder</h3>
                <p className="text-slate-500 text-lg leading-relaxed max-w-md">
                  Drag-and-drop interface to create stunning forms without coding. perfectly aligned with your brand.
                </p>

                <div className="mt-auto pt-10 relative">
                  {/* Abstract Visual representation of Builder */}
                  <div className="bg-slate-50 rounded-t-2xl border-t border-x border-slate-200 h-64 shadow-sm p-6 transform translate-y-4 group-hover:translate-y-2 transition-transform">
                    <div className="flex gap-4 mb-4">
                      <div className="w-1/3 h-8 bg-white rounded-lg border border-slate-200" />
                      <div className="w-2/3 h-8 bg-white rounded-lg border border-slate-200" />
                    </div>
                    <div className="space-y-3">
                      <div className="h-24 bg-white rounded-lg border-2 border-slate-200 border-dashed flex items-center justify-center text-slate-300">
                        Drop elements here
                      </div>
                      <div className="w-full h-10 bg-slate-900/5 rounded-lg" />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Top Right - Analytics */}
            <div className="lg:col-span-1 bg-white rounded-[2rem] border border-slate-100 p-8 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity">
                <BarChart3 size={100} className="text-orange-500" />
              </div>
              <div className="relative z-10">
                <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center mb-4 text-blue-600">
                  <Gauge size={24} />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-2">Real-time Analytics</h3>
                <p className="text-slate-500">Track conversions, drop-offs, and engagement instantly.</p>
              </div>
            </div>

            {/* Bottom Right - Integration */}
            <div className="lg:col-span-1 bg-white rounded-[2rem] border border-slate-100 p-8 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
              <div className="relative z-10">
                <div className="w-12 h-12 bg-purple-50 rounded-2xl flex items-center justify-center mb-4 text-purple-600">
                  <Code size={24} />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-2">Seamless Integration</h3>
                <p className="text-slate-500">Connect with Shopify, Slack, and your favorite tools.</p>
              </div>
            </div>

          </div>

          {/* Secondary Features Grid */}
          <div className="grid sm:grid-cols-3 gap-6 mt-6">
            {[
              { icon: <Shield size={20} />, title: "Enterprise Security", desc: "Bank-grade SSL encryption." },
              { icon: <Smartphone size={20} />, title: "Mobile First", desc: "Looks perfect on any device." },
              { icon: <Zap size={20} />, title: "Lightning Fast", desc: "Optimized for Core Web Vitals." }
            ].map((item, idx) => (
              <div key={idx} className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm flex items-start gap-4 hover:border-slate-200 transition-colors">
                <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-900 shrink-0">
                  {item.icon}
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 text-sm mb-1">{item.title}</h4>
                  <p className="text-slate-500 text-sm leading-relaxed">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* --- CTA Section --- */}
      <section className="py-32 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto">
          <div className="relative bg-slate-900 rounded-[3rem] p-12 md:p-24 text-center overflow-hidden">
            {/* Background effects */}
            <div className="absolute top-0 left-0 w-full h-full bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20" />
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-orange-500/30 blur-[100px] rounded-full" />
            <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-blue-500/20 blur-[100px] rounded-full" />

            <div className="relative z-10">
              <h2 className="text-4xl sm:text-6xl font-extrabold text-white mb-8 tracking-tight">
                {t('landing.ready')}
              </h2>
              <p className="text-xl text-slate-300 mb-12 max-w-2xl mx-auto leading-relaxed">
                {t('landing.subtitle2')}
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                <button
                  onClick={() => navigate('/auth')}
                  className="h-14 px-10 rounded-full bg-white text-slate-900 font-bold text-lg hover:bg-slate-100 transition-all flex items-center gap-2 shadow-xl shadow-white/10"
                >
                  {t('landing.startFreeNow')}
                  <ArrowRight size={20} />
                </button>
                <div className="flex items-center gap-2 text-slate-400 text-sm font-medium px-4">
                  <CheckCircle2 size={16} className="text-green-400" />
                  No credit card required
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* --- Footer --- */}
      <footer className="py-12 px-4 sm:px-6 lg:px-8 border-t border-slate-200/60 bg-white">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-slate-900 rounded-lg flex items-center justify-center">
              <Sparkles size={16} className="text-white" />
            </div>
            <span className="font-bold text-slate-900">Final Form</span>
          </div>
          <div className="flex gap-8 text-sm font-medium text-slate-500">
            <a href="#" className="hover:text-slate-900 transition-colors">Privacy</a>
            <a href="#" className="hover:text-slate-900 transition-colors">Terms</a>
            <a href="#" className="hover:text-slate-900 transition-colors">Contact</a>
          </div>
          <p className="text-sm text-slate-400">
            © 2024 Solvix Studios.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
