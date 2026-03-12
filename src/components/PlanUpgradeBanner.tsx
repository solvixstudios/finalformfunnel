/**
 * PlanUpgradeBanner
 * Dismissable banner at the top of the dashboard for free-plan users.
 * Re-appears on every new session (uses sessionStorage for dismiss state).
 * Accepts an onUpgrade callback to open the plan picker popup.
 */

import { Crown, X, ArrowRight } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

interface PlanUpgradeBannerProps {
  planName?: string;
  onUpgrade?: () => void;
}

const PlanUpgradeBanner = ({ planName = 'Free', onUpgrade }: PlanUpgradeBannerProps) => {
  const [dismissed, setDismissed] = useState(() => {
    return sessionStorage.getItem('plan_banner_dismissed') === 'true';
  });
  const navigate = useNavigate();

  if (dismissed) return null;

  const handleDismiss = () => {
    sessionStorage.setItem('plan_banner_dismissed', 'true');
    setDismissed(true);
  };

  const handleUpgrade = () => {
    if (onUpgrade) {
      onUpgrade();
    } else {
      navigate('/dashboard/subscription');
    }
  };

  return (
    <div className="relative overflow-hidden bg-gradient-to-r from-[#FF5A1F] via-[#FF6B35] to-[#E04812] text-white px-4 py-3 sm:px-6 flex items-center justify-between gap-3 shadow-md">
      {/* Decorative background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-6 -right-6 w-32 h-32 bg-white/10 rounded-full blur-2xl" />
        <div className="absolute -bottom-4 -left-4 w-24 h-24 bg-white/5 rounded-full blur-xl" />
      </div>

      <div className="relative z-10 flex items-center gap-3 flex-1 min-w-0">
        <div className="w-8 h-8 rounded-lg bg-white/15 backdrop-blur-sm flex items-center justify-center shrink-0 border border-white/20">
          <Crown size={16} className="text-white" />
        </div>
        <div className="min-w-0">
          <p className="text-[13px] font-bold text-white leading-tight">
            You're on the <span className="text-yellow-200">{planName}</span> plan
          </p>
          <p className="text-[11px] text-white/75 font-medium mt-0.5 hidden sm:block">
            Unlock more funnels, integrations, and remove branding with a paid plan.
          </p>
        </div>
      </div>

      <div className="relative z-10 flex items-center gap-2 shrink-0">
        <button
          onClick={handleUpgrade}
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-white text-[#FF5A1F] text-[12px] font-bold hover:bg-white/90 transition-all shadow-sm hover:shadow-md active:scale-[0.97]"
        >
          Upgrade
          <ArrowRight size={13} strokeWidth={2.5} />
        </button>
        <button
          onClick={handleDismiss}
          className="p-1.5 rounded-lg text-white/60 hover:text-white hover:bg-white/15 transition-colors"
          aria-label="Dismiss"
        >
          <X size={16} strokeWidth={2} />
        </button>
      </div>
    </div>
  );
};

export default PlanUpgradeBanner;
