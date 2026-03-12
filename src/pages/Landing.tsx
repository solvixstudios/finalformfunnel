import { motion, useInView, AnimatePresence } from 'framer-motion';
import {
  ArrowRight,
  BarChart3,
  CheckCircle2,
  Clock,
  ChevronDown,
  Globe2,
  Layers,
  LogOut,
  Menu,
  Package,
  Shield,
  ShoppingCart,
  Smartphone,
  Star,
  Store,
  TrendingUp,
  X,
  Zap,
} from 'lucide-react';
import { useRef, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useI18n } from '../lib/i18n/i18nContext';
import { Language } from '../lib/i18n/translations';
import { getStoredUser, signOutUser } from '../lib/authGoogle';
import { ADMIN_EMAIL } from '../data/plans';
import { usePlans } from '../hooks/usePaymentConfig';

/* ─── Animated counter component ─── */
function AnimatedNumber({ value, suffix = '' }: { value: string; suffix?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true });
  const [displayed, setDisplayed] = useState('0');

  useEffect(() => {
    if (!isInView) return;
    const num = parseFloat(value.replace(/[^0-9.]/g, ''));
    if (isNaN(num)) { setDisplayed(value); return; }
    const duration = 1200;
    const start = performance.now();
    const tick = (now: number) => {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = Math.floor(eased * num);
      setDisplayed(current.toLocaleString());
      if (progress < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [isInView, value]);

  return <span ref={ref}>{displayed}{suffix}</span>;
}

/* ─── Text reveal word-by-word ─── */
function TextReveal({ text, className, delay = 0 }: { text: string; className?: string; delay?: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true, margin: '-50px' });
  const words = text.split(' ');

  return (
    <span ref={ref} className={className}>
      {words.map((word, i) => (
        <motion.span
          key={i}
          initial={{ opacity: 0, y: 20, filter: 'blur(8px)' }}
          animate={isInView ? { opacity: 1, y: 0, filter: 'blur(0px)' } : {}}
          transition={{ duration: 0.5, delay: delay + i * 0.05, ease: [0.25, 0.46, 0.45, 0.94] }}
          className="inline-block mr-[0.25em]"
        >
          {word}
        </motion.span>
      ))}
    </span>
  );
}

/* ─── Marquee for social proof ─── */
function Marquee({ children }: { children: React.ReactNode }) {
  return (
    <div className="overflow-hidden relative">
      <motion.div
        className="flex gap-16 items-center whitespace-nowrap"
        animate={{ x: ['0%', '-50%'] }}
        transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
      >
        {children}
        {children}
      </motion.div>
    </div>
  );
}

/* ─── page ─── */
export default function Landing() {
  const navigate = useNavigate();
  const { t, language, setLanguage, dir } = useI18n();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { plans } = usePlans();

  const user = getStoredUser();
  const isAdmin = user?.email === ADMIN_EMAIL;
  const isRtl = dir === 'rtl';

  const languages: { code: Language; name: string; flag: string }[] = [
    { code: 'en', name: 'English (US)', flag: '🇺🇸' },
    { code: 'fr', name: 'Français (FR)', flag: '🇫🇷' },
    { code: 'ar', name: 'العربية (DZ)', flag: '🇩🇿' },
  ];

  return (
    <div className="min-h-screen bg-[#F8F7F5] font-sans selection:bg-[#FF5A1F] selection:text-white overflow-x-hidden" dir={dir}>
      
      {/* ════════════════════════════════════════════
          IMMERSIVE REAL-WORLD E-COMMERCE HERO
          ════════════════════════════════════════════ */}
      <section className="relative bg-slate-950 pb-0 overflow-hidden">
        {/* Deep background mesh & grid */}
        <div className="absolute inset-0 pointer-events-none">
          {/* Subtle grid pattern */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]" />
          {/* Central glow under typography */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-indigo-500/10 rounded-full blur-[120px]" />
          <div className="absolute top-[20%] left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-[#FF5A1F]/15 rounded-full blur-[100px]" />
        </div>

        {/* ─── MINIMAL NAV ─── */}
        <motion.nav
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="relative z-30 max-w-7xl mx-auto px-5 sm:px-8 py-5 flex items-center justify-between"
        >
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/10 backdrop-blur-md rounded-xl flex items-center justify-center border border-white/10 shadow-[0_0_15px_rgba(255,255,255,0.05)]">
              <Zap size={18} className="text-white fill-white" />
            </div>
            <span className="font-exquisite text-white text-xl tracking-tight font-extrabold hidden sm:inline-block">
              {language === 'ar' ? 'فاينل فورم' : 'Final Form'}
            </span>
          </div>

          {/* Desktop Right */}
          <div className="hidden md:flex items-center gap-6">
            
            {/* Header Links */}
            <div className="flex items-center gap-6 pr-4 text-sm font-bold text-white/70">
              <a href="#features" className="hover:text-white transition-colors">{t('landing.featureZigzag1Title') ? 'Features' : 'Features'}</a>
              <a href="#pricing" className="hover:text-white transition-colors">Pricing</a>
            </div>

            {/* Language Switcher Dropdown */}
            <div className="relative group">
              <button className="flex items-center gap-2 px-3.5 py-2 rounded-full bg-white/5 border border-white/10 text-white font-bold text-[13px] hover:bg-white/10 transition-colors">
                <span className="text-base leading-none">{languages.find(l => l.code === language)?.flag}</span>
                <span>{languages.find(l => l.code === language)?.name}</span>
              </button>
              {/* Dropdown menu */}
              <div className="absolute right-0 top-full pt-2 w-48 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                <div className="bg-white rounded-2xl shadow-xl border border-slate-100 p-2 transform origin-top group-hover:scale-100 scale-95 transition-transform">
                  {languages.map((lang) => (
                    <button
                      key={lang.code}
                      onClick={() => setLanguage(lang.code)}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left font-bold text-sm transition-colors ${
                        language === lang.code ? 'bg-slate-50 text-[#FF5A1F]' : 'text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      <span className="text-base leading-none">{lang.flag}</span>
                      {lang.name}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="w-px h-5 bg-white/10 ml-0 mr-2" />

            {user ? (
              <div className="relative group ml-1">
                <button className="flex items-center gap-2 h-10 pl-1.5 pr-4 rounded-full bg-white/5 border border-white/10 text-white font-bold text-sm hover:bg-white/10 transition-colors">
                  <img src={user.photoURL || `https://ui-avatars.com/api/?name=${user.email}`} className="w-7 h-7 rounded-full bg-slate-800" alt="Avatar" />
                  <span className="max-w-[100px] truncate">{user.displayName || user.email?.split('@')[0]}</span>
                  <ChevronDown size={14} className="text-white/50 group-hover:text-white transition-colors ml-1" />
                </button>
                {/* Dropdown menu */}
                <div className="absolute right-0 top-full pt-2 w-56 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                  <div className="bg-white rounded-2xl shadow-xl border border-slate-100 p-2 transform origin-top group-hover:scale-100 scale-95 transition-transform">
                    <button onClick={() => navigate('/dashboard')} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-slate-50 text-slate-700 font-bold text-sm transition-colors text-left">
                      <Layers size={16} className="text-slate-400" />
                      Dashboard
                    </button>
                    {isAdmin && (
                      <button onClick={() => navigate('/admin')} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-slate-50 text-slate-700 font-bold text-sm transition-colors text-left">
                        <Shield size={16} className="text-slate-400" />
                        Admin Panel
                      </button>
                    )}
                    <div className="h-px bg-slate-100 my-1 mx-2" />
                    <button onClick={async () => { await signOutUser(); window.location.reload(); }} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-red-50 text-red-600 font-bold text-sm transition-colors text-left">
                      <LogOut size={16} />
                      {t('userMenu.logout') || 'Logout'}
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <button
                onClick={() => navigate('/auth')}
                className="h-10 px-6 rounded-full bg-white text-slate-950 font-bold text-sm hover:bg-slate-100 transition-colors flex items-center gap-2 ml-1"
              >
                {t('landing.getStarted')}
              </button>
            )}
          </div>

          {/* Mobile toggle */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden w-10 h-10 rounded-full bg-white/5 backdrop-blur-md flex items-center justify-center text-white border border-white/10"
          >
            {mobileMenuOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
        </motion.nav>

        {/* Mobile drawer */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, y: -8, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.97 }}
              className="absolute top-[80px] left-4 right-4 bg-slate-900 rounded-3xl shadow-2xl z-50 md:hidden p-5 space-y-3 border border-white/10 backdrop-blur-xl"
            >
              <div className="flex p-1 rounded-full bg-slate-950 border border-white/10 items-center w-full mb-4">
                {languages.map((lang) => (
                  <button
                    key={lang.code}
                    onClick={() => { setLanguage(lang.code); setMobileMenuOpen(false); }}
                    className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-full text-xs font-bold leading-none transition-all duration-300 ${
                      language === lang.code
                        ? 'bg-white text-slate-950 shadow-sm'
                        : 'text-white/40'
                    }`}
                  >
                    <span className="text-sm leading-none">{lang.flag}</span>
                    <span>{lang.code.toUpperCase()}</span>
                  </button>
                ))}
              </div>
              
              {user ? (
                <>
                  <button
                    onClick={() => { navigate('/dashboard'); setMobileMenuOpen(false); }}
                    className="w-full flex items-center justify-center gap-2 h-12 bg-white/10 text-white rounded-full font-bold text-sm"
                  >
                    <Layers size={16} /> Dashboard
                  </button>
                  <button
                    onClick={async () => { await signOutUser(); window.location.reload(); }}
                    className="w-full h-12 text-red-400 font-bold text-sm border border-red-500/20 rounded-full"
                  >
                    {t('userMenu.logout') || 'Logout'}
                  </button>
                </>
              ) : (
                <button
                  onClick={() => { navigate('/auth'); setMobileMenuOpen(false); }}
                  className="w-full h-12 bg-[#FF5A1F] text-white rounded-full font-bold text-sm mt-2"
                >
                  {t('landing.getStarted')}
                </button>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* ─── HERO TYPOGRAPHY & CTAS ─── */}
        <div className="relative z-20 max-w-5xl mx-auto text-center px-4 sm:px-6 pt-16 sm:pt-20 pb-8 flex flex-col justify-center items-center">
          
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-10 relative group cursor-pointer"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 via-[#FF5A1F] to-[#FF8C42] rounded-full blur-md opacity-30 group-hover:opacity-70 transition-opacity duration-500" />
            <div className="relative inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-slate-900 border border-white/20 text-[11px] font-bold text-white uppercase tracking-[0.2em] shadow-[0_4px_24px_rgba(0,0,0,0.5)]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#FF5A1F] animate-pulse" />
              {t('landing.tagline') || 'Next-Gen OS'}
              <ArrowRight size={14} className="ml-1 opacity-50 group-hover:translate-x-1 group-hover:opacity-100 transition-all" />
            </div>
          </motion.div>

          {/* Headline — Massive, centered, gradient accent */}
          <h1 className="text-[2.75rem] sm:text-[4rem] md:text-[4.5rem] lg:text-[5.5rem] font-extrabold text-white leading-[1.05] tracking-[-0.04em] md:tracking-[-0.05em] mb-6 max-w-4xl">
            <TextReveal text={t('landing.title')} />
            <br />
            <TextReveal 
              text={t('landing.subtitle')} 
              className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 via-[#FF5A1F] to-[#FF8C42]" 
              delay={0.2} 
            />
          </h1>

          {/* Description */}
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7, duration: 0.6 }}
            className="text-base sm:text-xl text-white/40 font-medium max-w-2xl mx-auto mb-10 sm:mb-12 leading-relaxed"
          >
            {t('landing.description')}
          </motion.p>

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.9, duration: 0.5 }}
            className="flex flex-col sm:flex-row gap-4 sm:gap-5 w-full sm:w-auto"
          >
            <button
              onClick={() => navigate('/auth')}
              className="h-16 px-10 sm:px-12 rounded-full bg-[#FF5A1F] text-white font-bold text-lg hover:bg-[#FF6C37] hover:-translate-y-1 hover:shadow-[0_12px_40px_-8px_rgba(255,90,31,0.5)] transition-all duration-300 flex items-center justify-center gap-3 w-full sm:w-auto group"
            >
              {t('landing.getStarted')}
              <ArrowRight size={20} className={`transition-transform group-hover:translate-x-1 ${isRtl ? 'rotate-180 group-hover:-translate-x-1' : ''}`} />
            </button>
            <button
              onClick={() => navigate('/auth')}
              className="h-16 px-10 sm:px-12 rounded-full bg-white/5 backdrop-blur-sm text-white font-bold text-lg border border-white/10 hover:bg-white/10 hover:border-white/20 transition-all duration-300 w-full sm:w-auto"
            >
              {t('landing.viewDemo')}
            </button>
          </motion.div>
        </div>

        {/* ─── DASHBOARD PREVIEW ─── */}
        {/* Drops down below the fold, perfectly centered, showing the dashboard UI */}
        <motion.div
          initial={{ opacity: 0, y: 120 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.2, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
          className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 mt-12 sm:mt-16"
        >
          {/* Outer glow for the mockup */}
          <div className="absolute inset-0 bg-white/5 rounded-[2rem] sm:rounded-[2.5rem] blur-2xl max-h-[500px]" />
          
          {/* Browser Mockup */}
          <div className="relative rounded-[1.5rem] sm:rounded-[2rem] bg-white shadow-[0_-20px_80px_rgba(0,0,0,0.3)] border border-white/10 overflow-hidden max-h-[280px]">
            {/* Inner bottom fade so it gracefully gets cut off */}
            <div className="absolute bottom-0 left-0 right-0 h-40 bg-gradient-to-t from-white to-transparent pointer-events-none z-30" />
            
            {/* Browser Header */}
            <div className="h-10 sm:h-12 bg-[#F8F7F5] border-b border-slate-200 flex items-center px-5 gap-2.5">
              <div className="w-3 h-3 rounded-full bg-slate-300" />
              <div className="w-3 h-3 rounded-full bg-slate-300" />
              <div className="w-3 h-3 rounded-full bg-slate-300" />
            </div>

            {/* App UI Payload */}
            <div className="p-4 sm:p-8 bg-[#F8F7F5] flex gap-6 min-h-[400px]">
              {/* Sidebar */}
              <div className="w-56 hidden lg:flex flex-col gap-2 shrink-0 border-r border-slate-200/60 pr-6">
                <div className="h-11 bg-slate-950 rounded-2xl px-4 flex items-center gap-3">
                  <div className="w-4 h-4 rounded-md bg-white/20" />
                  <div className="h-2.5 w-20 bg-white/40 rounded-full" />
                </div>
                {[1, 2, 3, 4].map(i => (
                  <div key={i} className="h-11 rounded-2xl px-4 flex items-center gap-3">
                    <div className="w-4 h-4 rounded-md bg-slate-200" />
                    <div className="h-2.5 w-24 bg-slate-200 rounded-full" />
                  </div>
                ))}
              </div>

              {/* Main Workspace */}
              <div className="flex-1 space-y-6">
                {/* KPI Header */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {[
                    { label: 'Revenue', val: '124.5K', color: 'text-emerald-600 bg-emerald-50' },
                    { label: 'Orders', val: '1,248', color: 'text-blue-600 bg-blue-50' },
                    { label: 'Forms Built', val: '12', color: 'text-slate-600 bg-slate-100' },
                    { label: 'Conv. Rate', val: '4.8%', color: 'text-amber-600 bg-amber-50' },
                  ].map((kpi, i) => (
                    <div key={i} className="bg-white rounded-[1.5rem] p-5 shadow-sm border border-slate-200/60">
                      <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">{kpi.label}</div>
                      <div className="text-2xl font-black text-slate-900 tracking-tight">{kpi.val}</div>
                    </div>
                  ))}
                </div>

                {/* Main Graph Area */}
                <div className="bg-white rounded-[1.5rem] border border-slate-200/60 p-6 h-[280px]">
                  <div className="flex justify-between items-center mb-8">
                    <div className="h-4 w-32 bg-slate-900 rounded-md" />
                    <div className="h-8 w-24 rounded-full bg-slate-100" />
                  </div>
                  <div className="w-full h-full flex items-end gap-2 pb-12">
                     {[40, 60, 45, 70, 50, 90, 80, 100].map((h, i) => (
                       <div key={i} className="flex-1 bg-slate-100 rounded-t-lg relative" style={{ height: `${h}%` }}>
                         {i === 7 && <div className="absolute inset-0 bg-[#FF5A1F] rounded-t-lg" />}
                       </div>
                     ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Bottom fade blending mockup into the next section */}
          <div className="h-40 bg-gradient-to-b from-transparent via-[#F8F7F5]/80 to-[#F8F7F5] -mt-32 relative z-20 pointer-events-none" />
        </motion.div>
      </section>

      {/* ════════════════════════════════════════════
          INFINITE MARQUEE SOCIAL PROOF
          ════════════════════════════════════════════ */}
      <section className="bg-white py-12 border-y border-slate-100 overflow-hidden relative z-30">
        <p className="text-center text-[11px] font-bold text-slate-400 uppercase tracking-[0.25em] mb-8 px-4">
          {t('landing.trustedBy')}
        </p>
        <Marquee>
          {[
            { icon: <Store size={22} />, name: 'Shopify' },
            { icon: <Package size={22} />, name: 'WooCommerce' },
            { icon: <Globe2 size={22} />, name: 'COD Markets' },
            { icon: <Smartphone size={22} />, name: 'Mobile First' },
            { icon: <Shield size={22} />, name: 'SSL Encrypted' },
            { icon: <Zap size={22} />, name: 'Lightning Fast' },
          ].map((item, i) => (
            <div key={i} className="flex items-center gap-3 text-slate-300 font-extrabold text-xl tracking-tight shrink-0">
              {item.icon} {item.name}
            </div>
          ))}
        </Marquee>
      </section>

      {/* ════════════════════════════════════════════
          PREMIUM FEATURES SHOWCASE (Alternating Left/Right)
          ════════════════════════════════════════════ */}
      <section className="py-24 sm:py-32 px-4 sm:px-6 lg:px-8 bg-white overflow-hidden">
        <div className="max-w-7xl mx-auto space-y-32">
          
          {/* Feature 1: Lightning Fast Checkout */}
          <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-24">
            <div className="flex-1 lg:max-w-xl">
              <span className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-emerald-50 text-emerald-600 rounded-full text-[12px] font-bold uppercase tracking-[0.15em] mb-6 border border-emerald-100">
                <Zap size={14} className="fill-emerald-600" /> Speed
              </span>
              <h2 className="text-4xl sm:text-5xl font-extrabold text-slate-900 tracking-[-0.03em] leading-[1.1] mb-6">
                {t('landing.featureZigzag1Title')}
              </h2>
              <p className="text-slate-500 font-medium leading-relaxed text-lg sm:text-xl mb-8">
                {t('landing.featureZigzag1Desc')}
              </p>
              <ul className="space-y-4">
                {[
                  'Sub-second first contentful paint (FCP)',
                  'Global CDN caching for instant delivery',
                  'Optimized specifically for mobile shoppers',
                ].map((item, i) => (
                  <li key={i} className="flex items-center gap-3 text-slate-700 font-bold">
                    <CheckCircle2 size={18} className="text-[#FF5A1F]" /> {item}
                  </li>
                ))}
              </ul>
            </div>
            
            <motion.div 
              initial={{ opacity: 0, x: 40 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="flex-1 w-full relative"
            >
              <div className="absolute inset-0 bg-emerald-400/10 blur-[80px] rounded-full" />
              <div className="relative bg-[#F8F7F5] rounded-[2rem] p-8 border border-slate-100 shadow-xl">
                <div className="flex justify-between items-center mb-10 pb-6 border-b border-slate-200/60">
                  <div className="space-y-1">
                    <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Avg Load Time</div>
                    <div className="text-3xl font-black text-slate-900">0.8s</div>
                  </div>
                  <div className="h-10 px-4 bg-emerald-100 text-emerald-700 rounded-full flex items-center gap-2 font-bold text-sm">
                    <TrendingUp size={16} /> +42% CVR
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="h-4 w-full bg-slate-200 rounded-full overflow-hidden">
                    <motion.div initial={{ width: 0 }} whileInView={{ width: '15%' }} viewport={{ once: true }} transition={{ duration: 1, delay: 0.2 }} className="h-full bg-emerald-500" />
                  </div>
                  <div className="h-4 w-full bg-slate-200 rounded-full overflow-hidden">
                    <motion.div initial={{ width: 0 }} whileInView={{ width: '85%' }} viewport={{ once: true }} transition={{ duration: 1, delay: 0.4 }} className="h-full bg-slate-400" />
                  </div>
                  <div className="flex justify-between text-xs font-bold text-slate-400 pt-2">
                    <span>Final Form (0.8s)</span>
                    <span>Industry Avg (3.2s)</span>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Feature 2: Tracking & Pixels (Right aligned text) */}
          <div className="flex flex-col-reverse lg:flex-row items-center gap-12 lg:gap-24">
            <motion.div 
              initial={{ opacity: 0, x: -40 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="flex-1 w-full relative"
            >
              <div className="absolute inset-0 bg-blue-400/10 blur-[80px] rounded-full" />
              <div className="relative bg-slate-950 rounded-[2rem] p-10 shadow-2xl overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/20 blur-[50px] rounded-full" />
                <div className="grid grid-cols-2 gap-4 relative z-10">
                  {['Meta Pixel', 'TikTok API', 'Snapchat', 'Google Analytics 4', 'GTM', 'Custom Webhooks'].map((pixel, i) => (
                    <div key={i} className="bg-white/5 border border-white/10 rounded-2xl p-5 backdrop-blur-sm group hover:bg-white/10 transition-colors">
                      <div className="w-8 h-8 rounded-full bg-white/10 mb-4 flex items-center justify-center">
                        <BarChart3 size={14} className="text-blue-400 group-hover:text-white transition-colors" />
                      </div>
                      <div className="text-white font-bold text-sm">{pixel}</div>
                      <div className="text-white/40 text-[10px] font-bold uppercase tracking-widest mt-1">Active</div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
            
            <div className="flex-1 lg:max-w-xl">
              <span className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-blue-50 text-blue-600 rounded-full text-[12px] font-bold uppercase tracking-[0.15em] mb-6 border border-blue-100">
                <BarChart3 size={14} className="fill-blue-600" /> Tracking
              </span>
              <h2 className="text-4xl sm:text-5xl font-extrabold text-slate-900 tracking-[-0.03em] leading-[1.1] mb-6">
                {t('landing.featureZigzag2Title')}
              </h2>
              <p className="text-slate-500 font-medium leading-relaxed text-lg sm:text-xl mb-8">
                {t('landing.featureZigzag2Desc')}
              </p>
              <ul className="space-y-4">
                {[
                  'Server-to-Server (CAPI) tracking built-in',
                  'Support for custom multiple pixel IDs',
                  'Fires Purchase, AddToCart, and InitiateCheckout precisely',
                ].map((item, i) => (
                  <li key={i} className="flex items-center gap-3 text-slate-700 font-bold">
                    <CheckCircle2 size={18} className="text-blue-600" /> {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Feature 3: Integrations & Customization (Left/Right) */}
          <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-24">
            <div className="flex-1 lg:max-w-xl">
              <span className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-indigo-50 text-indigo-600 rounded-full text-[12px] font-bold uppercase tracking-[0.15em] mb-6 border border-indigo-100">
                <Layers size={14} className="fill-indigo-600" /> Integrations
              </span>
              <h2 className="text-4xl sm:text-5xl font-extrabold text-slate-900 tracking-[-0.03em] leading-[1.1] mb-6">
                {t('landing.featureZigzag3Title')}
              </h2>
              <p className="text-slate-500 font-medium leading-relaxed text-lg sm:text-xl mb-8">
                {t('landing.featureZigzag3Desc')}
              </p>
              <ul className="space-y-4">
                {[
                  '1-Click Shopify & WooCommerce sync',
                  'Native Algerian shipping providers',
                  'Live syncing to Google Spreadsheets',
                ].map((item, i) => (
                  <li key={i} className="flex items-center gap-3 text-slate-700 font-bold">
                    <CheckCircle2 size={18} className="text-indigo-600" /> {item}
                  </li>
                ))}
              </ul>
            </div>
            
            <motion.div 
              initial={{ opacity: 0, x: 40 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="flex-1 w-full relative"
            >
              <div className="absolute inset-0 bg-indigo-400/10 blur-[80px] rounded-full" />
              <div className="relative border border-slate-200 rounded-[2rem] bg-[#F8F7F5] shadow-xl p-6 sm:p-8">
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {[
                    { name: 'Shopify', icon: <Store size={22} />, bg: 'bg-[#95BF47]/10', color: 'text-[#95BF47]' },
                    { name: 'WooCommerce', icon: <Package size={22} />, bg: 'bg-[#7F54B3]/10', color: 'text-[#7F54B3]' },
                    { name: 'Google Sheets', icon: <Layers size={22} />, bg: 'bg-[#0F9D58]/10', color: 'text-[#0F9D58]' },
                    { name: 'Yalidine', icon: <Globe2 size={22} />, bg: 'bg-[#FF5A1F]/10', color: 'text-[#FF5A1F]' },
                    { name: 'Maystro', icon: <Zap size={22} />, bg: 'bg-indigo-500/10', color: 'text-indigo-500' },
                    { name: 'ZR Express', icon: <Clock size={22} />, bg: 'bg-rose-500/10', color: 'text-rose-500' },
                    { name: 'Ecoway', icon: <Shield size={22} />, bg: 'bg-emerald-500/10', color: 'text-emerald-500' },
                  ].map((tool, i) => (
                    <div key={i} className={`bg-white rounded-xl p-4 border border-slate-100 flex flex-col items-center justify-center text-center hover:-translate-y-1 transition-transform cursor-default shadow-sm ${i === 6 ? 'col-span-2 sm:col-span-1' : ''}`}>
                      <div className={`w-12 h-12 ${tool.bg} ${tool.color} rounded-xl flex items-center justify-center mb-3`}>
                        {tool.icon}
                      </div>
                      <div className="font-extrabold text-slate-900 text-[11px] leading-tight">{tool.name}</div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>
          
        </div>
      </section>

      {/* ════════════════════════════════════════════
          PRICING
          ════════════════════════════════════════════ */}
      <section id="pricing" className="py-24 sm:py-32 px-4 sm:px-6 lg:px-8 bg-[#F8F7F5]">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20">
            <span className="inline-block px-3.5 py-1.5 bg-[#FF5A1F]/5 text-[#FF5A1F] rounded-full text-[12px] font-bold uppercase tracking-[0.15em] mb-5 border border-[#FF5A1F]/10">
              Pricing
            </span>
            <h2 className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-slate-900 tracking-[-0.035em] mb-6">
              Simple, transparent pricing.
            </h2>
            <p className="text-xl text-slate-500 font-medium max-w-2xl mx-auto">
              Start for free, upgrade when you need more power. No hidden fees.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {plans.filter(p => !['free', 'enterprise'].includes(p.id)).slice(0, 3).map((plan) => {
              const isPro = plan.id === 'pro';
              const priceDisplay = plan.price.usd.monthly;
              
              return (
                <div key={plan.id} className={`rounded-[2rem] p-8 sm:p-10 relative flex flex-col ${isPro ? 'bg-slate-950 text-white border-slate-800 shadow-2xl transform lg:-translate-y-6 lg:scale-105 z-10' : 'bg-white border-slate-200 shadow-sm border'}`}>
                  {isPro && (
                    <>
                      <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1.5 bg-[#FF5A1F] text-white text-[11px] font-bold uppercase tracking-widest rounded-full shadow-lg">Most Popular</div>
                      <div className="absolute inset-0 bg-[#FF5A1F]/10 blur-[80px] rounded-[2rem] pointer-events-none" />
                    </>
                  )}
                  <div className="relative z-10 flex-1 flex flex-col">
                    <h3 className={`text-2xl font-extrabold mb-2 ${!isPro ? 'text-slate-900' : ''}`}>{plan.name}</h3>
                    <p className={`${isPro ? 'text-slate-400' : 'text-slate-500'} font-medium mb-6 leading-relaxed`}>
                      {plan.id === 'starter' ? 'Perfect for new stores testing the waters.' : plan.id === 'pro' ? 'For scaling brands that need advanced tracking.' : 'For highest volume and custom requirements.'}
                    </p>
                    <div className={`text-5xl font-black tracking-tight mb-8 ${!isPro ? 'text-slate-900' : ''}`}>
                      ${priceDisplay}<span className={`text-lg font-medium tracking-normal ${isPro ? 'text-slate-500' : 'text-slate-400'}`}>/mo</span>
                    </div>
                    <ul className="space-y-4 mb-10 flex-1">
                      {[
                        plan.features.activeFunnels === -1 ? 'Unlimited Stores' : `${plan.features.activeFunnels} Active Stores`,
                        plan.monthlyOrders === -1 ? 'Unlimited Orders' : `${plan.monthlyOrders} Orders / month`,
                        `${plan.features.metaPixels === -1 ? 'Unlimited' : plan.features.metaPixels} Meta & TikTok Pixels`,
                        `${plan.features.googleSheets === -1 ? 'Unlimited' : plan.features.googleSheets} Google Sheets Syncs`,
                        plan.features.brandingRemoved ? 'No "Final Form" Branding' : 'Basic Form Builder',
                        plan.features.integrationSupport ? 'Priority Support & Setup' : false,
                      ].filter(Boolean).map((feature, i) => (
                        <li key={i} className={`flex items-center gap-3 font-bold text-sm ${isPro ? 'text-white' : 'text-slate-700'}`}>
                          <CheckCircle2 size={18} className={isPro ? 'text-[#FF5A1F]' : 'text-emerald-500'} /> {feature}
                        </li>
                      ))}
                    </ul>
                    <button onClick={() => navigate('/auth')} className={`w-full h-14 rounded-xl font-bold transition-colors ${isPro ? 'bg-[#FF5A1F] text-white hover:bg-[#FF6C37] shadow-[0_8px_25px_-5px_rgba(255,90,31,0.5)]' : 'bg-slate-100 text-slate-900 hover:bg-slate-200'}`}>
                      {isPro ? 'Start 14-Day Free Trial' : 'Get Started'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════
          LIVE COUNTER + TESTIMONIALS
          ════════════════════════════════════════════ */}
      <section className="py-24 sm:py-32 bg-slate-950 relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wMiI+PGNpcmNsZSBjeD0iMzAiIGN5PSIzMCIgcj0iMSIvPjwvZz48L2c+PC9zdmc+')] pointer-events-none" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-[#FF5A1F]/10 rounded-full blur-[150px] pointer-events-none" />
        
        {/* Live counter */}
        <div className="flex justify-center mb-16 relative z-10">
          <div className="bg-white/10 backdrop-blur-md border border-white/10 rounded-full px-8 py-4 flex items-center gap-3 shadow-2xl">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_10px_rgba(52,211,153,0.8)]" />
            <span className="text-white/70 text-base font-bold tracking-wide">
              <span className="text-white font-extrabold tabular-nums px-1"><AnimatedNumber value="6,447" /></span> orders processed today
            </span>
          </div>
        </div>

        {/* Marquee Reviews */}
        <div className="relative z-10 w-full overflow-hidden flex flex-col gap-6">
          <Marquee>
            {[
              { text: "Switching to Final Form boosted our COD completion rate from 40% to 85% overnight.", name: "Amine B.", role: "E-commerce Founder" },
              { text: "The fastest checkout builder we've ever used. The Google Sheets sync is a lifesaver.", name: "Sarah L.", role: "Dropshipper" },
              { text: "Finally an optimized COD solution that natively supports Algerian delivery providers.", name: "Karim D.", role: "Store Owner" },
              { text: "Our server-side events are firing perfectly. Our CAC dropped by 30% in two weeks.", name: "Youssef M.", role: "Media Buyer" },
              { text: "Setup took literally 5 minutes. The integrations work exactly as advertised.", name: "Meriam S.", role: "Brand Owner" },
            ].map((review, idx) => (
              <div key={idx} className="w-[350px] h-[200px] bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-sm shrink-0 mx-4 flex flex-col hover:bg-white/10 transition-colors">
                <div className="flex gap-1 mb-4">
                  {[1,2,3,4,5].map(i => <Star key={i} size={14} className="text-amber-400 fill-amber-400" />)}
                </div>
                <p className="text-white/90 text-sm font-medium leading-relaxed mb-6 flex-1">
                  "{review.text}"
                </p>
                <div className="flex items-center gap-3 mt-auto">
                  <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-white font-bold text-xs ring-2 ring-white/10">
                    {review.name.charAt(0)}
                  </div>
                  <div>
                    <div className="text-white font-bold text-[13px]">{review.name}</div>
                    <div className="text-white/50 text-[10px] uppercase tracking-wider font-bold">{review.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </Marquee>
          
        </div>
      </section>

      {/* ════════════════════════════════════════════
          FINAL CTA
          ════════════════════════════════════════════ */}
      <section className="py-32 sm:py-40 px-4 sm:px-6 lg:px-8 bg-white relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-[#FF5A1F]/5 rounded-full blur-[100px]" />
        </div>
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <h2 className="text-5xl sm:text-6xl md:text-7xl font-extrabold text-slate-900 tracking-[-0.04em] mb-8 leading-[1.05]">
            <TextReveal text={t('landing.ctaHeading') || "Stop losing sales at checkout."} />
          </h2>
          <p className="text-xl sm:text-2xl text-slate-500 font-medium mb-12 max-w-2xl mx-auto">
            Join modern e-commerce brands using Final Form to maximize every single visitor.
          </p>
          <div className="flex flex-col sm:flex-row gap-5 justify-center items-center">
            <motion.button
              whileHover={{ scale: 1.04, y: -4 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => navigate('/auth')}
              className="h-16 sm:h-20 px-12 sm:px-14 rounded-full bg-[#FF5A1F] text-white font-extrabold text-lg sm:text-xl shadow-[0_20px_40px_-10px_rgba(255,90,31,0.4)] flex items-center gap-3 transition-shadow"
            >
              {t('landing.getStarted')}
            </motion.button>
            <span className="flex items-center gap-2 text-slate-400 text-base font-bold mt-4 sm:mt-0">
              <CheckCircle2 size={18} className="text-emerald-500" />
              {t('landing.noCreditCard')}
            </span>
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════
          FOOTER
          ════════════════════════════════════════════ */}
      <footer className="py-16 px-4 sm:px-6 lg:px-8 bg-[#F8F7F5] border-t border-slate-200 leading-relaxed">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-start gap-12 mb-16">
            <div className="flex flex-col items-start gap-8">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-[#FF5A1F] rounded-xl flex items-center justify-center shadow-sm">
                  <Zap size={18} className="text-white fill-white" />
                </div>
                <span className="font-exquisite text-slate-900 text-xl font-extrabold tracking-tight">Final Form</span>
              </div>
              
              {/* Footer Language Switcher */}
              <div className="relative group">
                <button className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white border border-slate-200 shadow-sm text-slate-700 font-bold text-[13px] hover:bg-slate-50 transition-colors">
                  <span className="text-base leading-none">{languages.find(l => l.code === language)?.flag}</span>
                  <span>{languages.find(l => l.code === language)?.name}</span>
                  <ChevronDown size={14} className="text-slate-400 ml-1" />
                </button>
                {/* Dropdown menu (Upwards) */}
                <div className="absolute left-0 bottom-full pb-2 w-48 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                  <div className="bg-white rounded-2xl shadow-[0_4px_30px_rgba(0,0,0,0.1)] border border-slate-100 p-2 transform origin-bottom group-hover:scale-100 scale-95 transition-transform">
                    {languages.map((lang) => (
                      <button
                        key={lang.code}
                        onClick={() => setLanguage(lang.code)}
                        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left font-bold text-sm transition-colors ${
                          language === lang.code ? 'bg-slate-50 text-[#FF5A1F]' : 'text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        <span className="text-base leading-none">{lang.flag}</span>
                        {lang.name}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
            <div className="flex gap-16 md:gap-24">
              <div>
                <h5 className="text-[12px] font-extrabold text-slate-900 uppercase tracking-[0.2em] mb-6">Product</h5>
                <ul className="space-y-4 text-base font-bold text-slate-500">
                  <li><a href="#" className="hover:text-slate-900 transition-colors">Features</a></li>
                  <li><a href="#" className="hover:text-slate-900 transition-colors">Pricing</a></li>
                  <li><a href="#" className="hover:text-slate-900 transition-colors">Integrations</a></li>
                </ul>
              </div>
              <div>
                <h5 className="text-[12px] font-extrabold text-slate-900 uppercase tracking-[0.2em] mb-6">Company</h5>
                <ul className="space-y-4 text-base font-bold text-slate-500">
                  <li><a href="#" className="hover:text-slate-900 transition-colors">Privacy</a></li>
                  <li><a href="#" className="hover:text-slate-900 transition-colors">Terms</a></li>
                  <li><a href="#" className="hover:text-slate-900 transition-colors">Contact</a></li>
                </ul>
              </div>
            </div>
          </div>
          <div className="h-px bg-slate-200 mb-8" />
          <p className="text-sm font-bold text-slate-400 text-center md:text-left">
            © {new Date().getFullYear()} Solvix Studios. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
