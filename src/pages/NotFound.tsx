import { ArrowLeft, SearchX } from 'lucide-react';
import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

const NotFound = () => {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#FAFAFA]">
      <div className="text-center px-6">
        <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-5">
          <SearchX size={28} className="text-slate-300" />
        </div>
        <h1 className="text-5xl font-bold text-slate-900 tracking-tight mb-2">404</h1>
        <p className="text-sm text-slate-400 mb-6 max-w-xs mx-auto">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <button
          onClick={() => navigate('/')}
          className="inline-flex items-center gap-2 h-9 px-5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-full shadow-sm transition-all"
        >
          <ArrowLeft size={13} />
          Back to Home
        </button>
      </div>
    </div>
  );
};

export default NotFound;
