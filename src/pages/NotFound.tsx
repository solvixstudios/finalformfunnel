import { motion } from 'framer-motion';
import { ArrowLeft, SearchX, Sparkles, Zap } from 'lucide-react';
import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

const NotFound = () => {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-[#0A0A0F] overflow-hidden">
      {/* Gradient Mesh */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-violet-600/20 blur-[140px] rounded-full pointer-events-none" />
      <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-blue-500/15 blur-[100px] rounded-full pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-violet-400/10 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute inset-0 bg-noise pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, type: 'spring' }}
        className="relative z-10 text-center px-6 max-w-md w-full"
      >
        <motion.div
          animate={{ y: [0, -10, 0] }}
          transition={{ repeat: Infinity, duration: 4, ease: 'easeInOut' }}
          className="w-24 h-24 bg-white/[0.04] backdrop-blur-xl shadow-brand-lg border border-white/[0.08] rounded-3xl flex items-center justify-center mx-auto mb-8 relative"
        >
          <SearchX size={40} className="text-violet-400" />
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 8, ease: 'linear' }}
            className="absolute -top-3 -right-3 text-violet-400"
          >
            <Sparkles size={20} fill="currentColor" />
          </motion.div>
        </motion.div>

        <h1 className="text-7xl font-extrabold text-white tracking-[-0.04em] mb-4">
          <span className="text-gradient">404</span>
        </h1>
        <h2 className="text-2xl font-bold text-white/80 tracking-tight mb-4">
          Page Not Found
        </h2>
        <p className="text-white/40 mb-10 leading-relaxed text-lg">
          We looked everywhere, but the page you requested doesn&apos;t seem to exist or might have been moved.
        </p>

        <button
          onClick={() => navigate('/')}
          className="group inline-flex items-center justify-center gap-2 h-14 px-8 bg-gradient-to-r from-violet-600 to-violet-500 text-white font-semibold rounded-full shadow-brand-lg hover:shadow-brand-xl hover:-translate-y-0.5 transition-all w-full sm:w-auto"
        >
          <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
          Back to Home
        </button>

        {/* Brand mark */}
        <div className="mt-16 flex items-center justify-center gap-2 opacity-30">
          <div className="w-5 h-5 bg-gradient-to-br from-violet-600 to-violet-400 rounded flex items-center justify-center">
            <Zap size={10} className="text-white fill-white" />
          </div>
          <span className="text-xs font-medium text-white/50">Final Form</span>
        </div>
      </motion.div>
    </div>
  );
};

export default NotFound;
