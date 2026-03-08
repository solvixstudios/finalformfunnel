import { motion } from 'framer-motion';
import { ArrowRight, BarChart3, CheckCircle2, Code, Gauge, Layers, Menu, Shield, Smartphone, Sparkles, X, Zap } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useI18n } from '../lib/i18n/i18nContext';
import { Language } from '../lib/i18n/translations';

const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08 } },
};

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 60, damping: 18 } },
} as const;

const Landing = () => {
  const navigate = useNavigate();
  const { t, language, setLanguage, dir } = useI18n();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const languages: { code: Language; name: string; flag: string }[] = [
    { code: 'ar', name: 'العربية', flag: '🇸🇦' },
    { code: 'en', name: 'English', flag: '🇺🇸' },
    { code: 'fr', name: 'Français', flag: '🇫🇷' },
  ];

  return (
    <div className="min-h-screen bg-slate-50 font-sans selection:bg-violet-100 selection:text-violet-900 overflow-x-hidden" dir={dir}>

      {/* ═══════════════════════════════════
          NAVIGATION
      ═══════════════════════════════════ */}
      <nav className="fixed top-0 left-0 right-0 h-16 glass-dark border-b border-white/[0.06] z-50 transition-all duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-gradient-to-br from-violet-600 to-violet-400 rounded-lg flex items-center justify-center shadow-brand-sm">
              <Zap size={15} className="text-white fill-white" />
            </div>
            <span className="font-bold text-white text-lg tracking-tight">
              {language === 'ar' ? 'فاينل فورم' : 'Final Form'}
            </span>
          </div>

          <div className="hidden sm:flex items-center gap-4">
            <div className="flex gap-1 bg-white/[0.06] rounded-full p-1 border border-white/[0.08]">
              {languages.map((lang) => (
                <button
                  key={lang.code}
                  onClick={() => setLanguage(lang.code)}
                  title={lang.name}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition-all duration-300 ${language === lang.code
                    ? 'bg-white/15 text-white shadow-sm'
                    : 'text-white/50 hover:text-white/80'
                    }`}
                >
                  {lang.flag}
                </button>
              ))}
            </div>
            <button
              onClick={() => navigate('/auth')}
              className="h-9 px-5 rounded-full bg-white text-slate-900 font-semibold text-sm hover:bg-white/90 transition-all shadow-lg shadow-white/5 active:scale-95"
            >
              {t('auth.welcomeBack')}
            </button>
          </div>

          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="sm:hidden p-2 text-white/70 hover:bg-white/10 rounded-lg transition-colors"
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </nav>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="fixed top-16 left-0 right-0 bg-slate-900 border-b border-white/[0.06] z-40 sm:hidden shadow-xl"
        >
          <div className="px-4 py-6 space-y-4">
            <div className="flex gap-2 bg-white/[0.04] rounded-xl p-1.5">
              {languages.map((lang) => (
                <button
                  key={lang.code}
                  onClick={() => {
                    setLanguage(lang.code);
                    setMobileMenuOpen(false);
                  }}
                  className={`flex-1 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${language === lang.code
                    ? 'bg-white/10 text-white shadow-sm'
                    : 'text-white/50'
                    }`}
                >
                  {lang.flag} {lang.name}
                </button>
              ))}
            </div>
            <button
              onClick={() => { navigate('/auth'); setMobileMenuOpen(false); }}
              className="w-full h-12 bg-gradient-to-r from-violet-600 to-violet-500 text-white rounded-xl font-bold text-sm shadow-brand"
            >
              {t('auth.welcomeBack')}
            </button>
          </div>
        </motion.div>
      )}

      {/* ═══════════════════════════════════
          HERO — Dark Mode
      ═══════════════════════════════════ */}
      <section className="relative pt-32 pb-24 sm:pt-40 sm:pb-32 px-4 sm:px-6 lg:px-8 bg-[#0A0A0F] overflow-hidden">
        {/* Gradient Mesh Background */}
        <div className="absolute inset-0 overflow-hidden">
          <motion.div
            animate={{ scale: [1, 1.1, 1], opacity: [0.3, 0.5, 0.3] }}
            transition={{ repeat: Infinity, duration: 10, ease: 'easeInOut' }}
            className="absolute top-[-20%] left-[20%] w-[700px] h-[700px] bg-violet-600/25 rounded-full blur-[140px]"
          />
          <motion.div
            animate={{ scale: [1.1, 1, 1.1], opacity: [0.2, 0.35, 0.2] }}
            transition={{ repeat: Infinity, duration: 14, ease: 'easeInOut' }}
            className="absolute top-[10%] right-[-10%] w-[600px] h-[600px] bg-blue-600/20 rounded-full blur-[120px]"
          />
          <motion.div
            animate={{ scale: [1, 1.15, 1] }}
            transition={{ repeat: Infinity, duration: 12, ease: 'easeInOut' }}
            className="absolute bottom-[-20%] left-[-10%] w-[500px] h-[500px] bg-violet-400/15 rounded-full blur-[100px]"
          />
        </div>
        {/* Subtle noise */}
        <div className="absolute inset-0 bg-noise pointer-events-none" />

        <div className="max-w-7xl mx-auto text-center relative z-10">
          <motion.div
            initial="hidden"
            animate="visible"
            variants={stagger}
          >
            {/* Badge */}
            <motion.div variants={fadeUp} className="flex justify-center mb-8">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/[0.06] border border-white/[0.08] rounded-full backdrop-blur-sm">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-violet-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-gradient-to-r from-violet-500 to-violet-300" />
                </span>
                <span className="text-sm font-semibold text-white/70 tracking-wide">
                  {t('landing.tagline')}
                </span>
              </div>
            </motion.div>

            {/* Title */}
            <motion.h1
              variants={fadeUp}
              className="text-4xl sm:text-5xl md:text-7xl font-extrabold text-white mb-8 leading-[1.05] tracking-[-0.04em]"
            >
              {t('landing.title')}
              <span className="block text-gradient mt-2 pb-2">
                {t('landing.subtitle')}
              </span>
            </motion.h1>

            {/* Description */}
            <motion.p
              variants={fadeUp}
              className="text-lg sm:text-xl text-white/50 max-w-2xl mx-auto mb-12 leading-relaxed font-medium"
            >
              {t('landing.description')}
            </motion.p>

            {/* CTAs */}
            <motion.div variants={fadeUp} className="flex flex-col sm:flex-row gap-4 justify-center mb-20 sm:mb-28">
              <button
                onClick={() => navigate('/auth')}
                className="group h-14 px-10 rounded-full bg-gradient-to-r from-violet-600 to-violet-500 text-white font-bold text-lg shadow-brand-lg hover:shadow-brand-xl hover:-translate-y-0.5 transition-all duration-300 flex items-center justify-center gap-2"
              >
                {t('landing.getStarted')}
                <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
              </button>
              <button
                onClick={() => navigate('/auth')}
                className="h-14 px-10 rounded-full bg-white/[0.06] border border-white/[0.1] text-white/80 font-bold text-lg hover:bg-white/[0.1] hover:text-white transition-all flex items-center justify-center backdrop-blur-sm"
              >
                {t('landing.viewDemo')}
              </button>
            </motion.div>
          </motion.div>

          {/* ── Floating Dashboard Mockup ── */}
          <motion.div
            initial={{ opacity: 0, rotateX: 20, y: 80 }}
            animate={{ opacity: 1, rotateX: 8, y: 0 }}
            transition={{ duration: 1.2, delay: 0.3, type: 'spring', stiffness: 40 }}
            style={{ perspective: '1400px', transformStyle: 'preserve-3d' }}
            className="relative mx-auto max-w-5xl"
          >
            <motion.div
              animate={{ y: [0, -10, 0] }}
              transition={{ repeat: Infinity, duration: 6, ease: 'easeInOut' }}
              className="relative rounded-3xl bg-white/[0.04] backdrop-blur-xl border border-white/[0.08] shadow-2xl shadow-violet-500/5 overflow-hidden group"
            >
              {/* Mock Header */}
              <div className="h-12 bg-white/[0.03] border-b border-white/[0.06] flex items-center px-5 gap-3">
                <div className="flex gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-white/10" />
                  <div className="w-2.5 h-2.5 rounded-full bg-white/10" />
                  <div className="w-2.5 h-2.5 rounded-full bg-white/10" />
                </div>
                <div className="flex-1 flex justify-center">
                  <div className="h-5 w-52 bg-white/[0.04] rounded-full" />
                </div>
              </div>
              {/* Mock Content */}
              <div className="p-6 sm:p-8 min-h-[400px] sm:min-h-[480px] flex gap-6">
                {/* Sidebar */}
                <div className="w-44 hidden md:flex flex-col gap-3">
                  <div className="h-9 rounded-xl bg-violet-500/15 border border-violet-500/10" />
                  <div className="h-9 rounded-xl bg-white/[0.03]" />
                  <div className="h-9 rounded-xl bg-white/[0.03]" />
                  <div className="h-9 rounded-xl bg-white/[0.03]" />
                </div>
                {/* Main */}
                <div className="flex-1 flex flex-col gap-5">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="h-28 bg-white/[0.03] rounded-2xl border border-white/[0.06] flex flex-col justify-end p-4">
                      <div className="h-2 w-16 bg-white/10 rounded-full mb-1.5" />
                      <div className="h-5 w-20 bg-violet-500/20 rounded-lg" />
                    </div>
                    <div className="h-28 bg-white/[0.03] rounded-2xl border border-white/[0.06] flex flex-col justify-end p-4">
                      <div className="h-2 w-16 bg-white/10 rounded-full mb-1.5" />
                      <div className="h-5 w-24 bg-blue-500/20 rounded-lg" />
                    </div>
                    <div className="h-28 bg-white/[0.03] rounded-2xl border border-white/[0.06] flex flex-col justify-end p-4">
                      <div className="h-2 w-16 bg-white/10 rounded-full mb-1.5" />
                      <div className="h-5 w-16 bg-emerald-500/20 rounded-lg" />
                    </div>
                  </div>
                  <div className="flex-1 bg-white/[0.03] rounded-2xl border border-white/[0.06] min-h-[200px]" />
                </div>
              </div>
            </motion.div>

            {/* Back-glow */}
            <div className="absolute -inset-8 bg-gradient-to-r from-violet-500/15 via-blue-500/10 to-violet-400/15 blur-3xl -z-10 rounded-[4rem]" />
          </motion.div>
        </div>

        {/* Bottom edge fade to light section */}
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-slate-50 to-transparent" />
      </section>

      {/* ═══════════════════════════════════
          STATS BAR
      ═══════════════════════════════════ */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 border-b border-slate-200">
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-8 text-center">
            {[
              { value: '10K+', label: 'Forms Created' },
              { value: '2M+', label: 'Submissions' },
              { value: '99.9%', label: 'Uptime' },
              { value: '4.9★', label: 'User Rating' },
            ].map((stat, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1, duration: 0.5 }}
              >
                <div className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">{stat.value}</div>
                <div className="text-sm font-medium text-slate-500 mt-1">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════
          BENTO GRID FEATURES
      ═══════════════════════════════════ */}
      <section className="py-24 sm:py-32 px-4 sm:px-6 lg:px-8 relative">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16 sm:mb-20">
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-slate-900 mb-4 tracking-[-0.03em]"
            >
              {t('landing.everything')}
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="text-lg text-slate-500 max-w-2xl mx-auto"
            >
              {t('landing.features')}
            </motion.p>
          </div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-80px' }}
            variants={stagger}
            className="grid grid-cols-1 lg:grid-cols-3 grid-rows-2 gap-5 h-auto lg:h-[600px]"
          >
            {/* Large Left — Visual Builder */}
            <motion.div
              variants={fadeUp}
              className="lg:col-span-2 lg:row-span-2 bg-white rounded-3xl border border-slate-200 p-8 shadow-sm card-hover relative overflow-hidden group"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-violet-50/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="relative z-10 h-full flex flex-col">
                <div className="w-14 h-14 bg-violet-100 rounded-2xl flex items-center justify-center mb-6 text-violet-600">
                  <Layers size={28} />
                </div>
                <h3 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-3">Visual Builder</h3>
                <p className="text-slate-500 text-base sm:text-lg leading-relaxed max-w-md">
                  Drag-and-drop interface to create stunning forms without coding. Perfectly aligned with your brand.
                </p>

                <div className="mt-auto pt-10 relative">
                  <div className="bg-[#F8F7F5] rounded-t-2xl border-t border-x border-[#E4E5E9] h-56 sm:h-64 shadow-sm p-5 transform translate-y-4 group-hover:translate-y-1 transition-transform duration-500">
                    <div className="flex gap-3 mb-4">
                      <div className="w-1/3 h-8 bg-white rounded-xl border border-[#E4E5E9]" />
                      <div className="w-2/3 h-8 bg-white rounded-xl border border-[#E4E5E9]" />
                    </div>
                    <div className="space-y-3">
                      <div className="h-20 bg-white rounded-xl border-2 border-dashed border-violet-200 flex items-center justify-center text-violet-300 text-sm font-medium">
                        Drop elements here
                      </div>
                      <div className="w-full h-9 bg-gradient-to-r from-violet-600/10 to-violet-400/10 rounded-xl" />
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Top Right — Analytics */}
            <motion.div
              variants={fadeUp}
              className="lg:col-span-1 bg-white rounded-3xl border border-slate-200 p-8 shadow-sm card-hover relative overflow-hidden group"
            >
              <div className="absolute top-0 right-0 p-6 opacity-[0.06] group-hover:opacity-[0.12] transition-opacity duration-500 transform group-hover:scale-110">
                <BarChart3 size={100} className="text-blue-600" />
              </div>
              <div className="relative z-10">
                <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center mb-4 text-blue-600">
                  <Gauge size={24} />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-2">Real-time Analytics</h3>
                <p className="text-slate-500 text-sm leading-relaxed">Track conversions, drop-offs, and engagement instantly.</p>
              </div>
            </motion.div>

            {/* Bottom Right — Integration */}
            <motion.div
              variants={fadeUp}
              className="lg:col-span-1 bg-white rounded-3xl border border-slate-200 p-8 shadow-sm card-hover relative overflow-hidden group"
            >
              <div className="relative z-10">
                <div className="w-12 h-12 bg-violet-50 rounded-2xl flex items-center justify-center mb-4 text-violet-600">
                  <Code size={24} />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-2">Seamless Integration</h3>
                <p className="text-slate-500 text-sm leading-relaxed">Connect with Shopify, Slack, and your favorite tools.</p>
              </div>
            </motion.div>
          </motion.div>

          {/* Secondary Features */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-5 mt-5">
            {[
              { icon: <Shield size={20} />, title: 'Enterprise Security', desc: 'Bank-grade SSL encryption.', color: 'text-emerald-600 bg-emerald-50' },
              { icon: <Smartphone size={20} />, title: 'Mobile First', desc: 'Looks perfect on any device.', color: 'text-blue-600 bg-blue-50' },
              { icon: <Zap size={20} />, title: 'Lightning Fast', desc: 'Optimized for Core Web Vitals.', color: 'text-amber-600 bg-amber-50' },
            ].map((item, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
                className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex items-start gap-4 card-hover"
              >
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${item.color}`}>
                  {item.icon}
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 text-sm mb-1">{item.title}</h4>
                  <p className="text-slate-500 text-sm leading-relaxed">{item.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════
          CTA SECTION — Dark
      ═══════════════════════════════════ */}
      <section className="py-24 sm:py-32 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto">
          <div className="relative bg-[#0A0A0F] rounded-[2rem] sm:rounded-[3rem] p-8 sm:p-14 md:p-24 text-center overflow-hidden">
            {/* Mesh BG */}
            <div className="absolute inset-0 overflow-hidden">
              <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-violet-500/20 blur-[100px] rounded-full" />
              <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-blue-500/15 blur-[100px] rounded-full" />
            </div>
            <div className="absolute inset-0 bg-noise pointer-events-none" />

            <div className="relative z-10">
              <h2 className="text-3xl sm:text-4xl md:text-6xl font-extrabold text-white mb-6 sm:mb-8 tracking-[-0.03em]">
                {t('landing.ready')}
              </h2>
              <p className="text-lg sm:text-xl text-white/45 mb-12 max-w-2xl mx-auto leading-relaxed">
                {t('landing.subtitle2')}
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                <button
                  onClick={() => navigate('/auth')}
                  className="h-14 px-10 rounded-full bg-white text-slate-900 font-bold text-lg hover:bg-white/90 transition-all flex items-center gap-2 shadow-xl shadow-white/5"
                >
                  {t('landing.startFreeNow')}
                  <ArrowRight size={20} />
                </button>
                <div className="flex items-center gap-2 text-white/40 text-sm font-medium px-4">
                  <CheckCircle2 size={16} className="text-emerald-400" />
                  No credit card required
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════
          FOOTER — Dark
      ═══════════════════════════════════ */}
      <footer className="relative bg-[#0A0A0F] pt-16 pb-10 px-4 sm:px-6 lg:px-8 overflow-hidden">
        <div className="absolute inset-0 bg-noise pointer-events-none" />
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="flex flex-col md:flex-row justify-between items-start gap-12 mb-12">
            {/* Brand */}
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 bg-gradient-to-br from-violet-600 to-violet-400 rounded-lg flex items-center justify-center shadow-brand-sm">
                  <Zap size={15} className="text-white fill-white" />
                </div>
                <span className="font-bold text-white text-lg tracking-tight">Final Form</span>
              </div>
              <p className="text-sm text-white/30 max-w-xs leading-relaxed">
                The modern order & form management platform for e-commerce businesses.
              </p>
            </div>

            {/* Links */}
            <div className="flex gap-16">
              <div>
                <h5 className="text-xs font-bold text-white/50 uppercase tracking-wider mb-4">Product</h5>
                <ul className="space-y-2.5 text-sm">
                  <li><a href="#" className="text-white/40 hover:text-white transition-colors">Features</a></li>
                  <li><a href="#" className="text-white/40 hover:text-white transition-colors">Pricing</a></li>
                  <li><a href="#" className="text-white/40 hover:text-white transition-colors">Integrations</a></li>
                </ul>
              </div>
              <div>
                <h5 className="text-xs font-bold text-white/50 uppercase tracking-wider mb-4">Company</h5>
                <ul className="space-y-2.5 text-sm">
                  <li><a href="#" className="text-white/40 hover:text-white transition-colors">Privacy</a></li>
                  <li><a href="#" className="text-white/40 hover:text-white transition-colors">Terms</a></li>
                  <li><a href="#" className="text-white/40 hover:text-white transition-colors">Contact</a></li>
                </ul>
              </div>
            </div>
          </div>

          <div className="h-px bg-white/[0.06] mb-6" />
          <p className="text-sm text-white/25">
            © {new Date().getFullYear()} Solvix Studios. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
