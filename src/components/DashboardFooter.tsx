import React, { useState } from 'react';
import { useConnectionStatus } from '@/hooks/useConnectionStatus';
import packageJson from '../../package.json';
import { ServerCrash, WifiOff, CheckCircle2, Zap, Copy, FileText, Pickaxe, Crown } from 'lucide-react';
import ChangelogDialog from './ChangelogDialog';

interface DashboardFooterProps {
  clientId: string;
  planName: string;
  onUpgrade?: () => void;
}

export function DashboardFooter({ clientId, planName, onUpgrade }: DashboardFooterProps) {
  const { status, latency } = useConnectionStatus();
  const [showChangelog, setShowChangelog] = useState(false);
  const [copied, setCopied] = useState(false);

  // Loader version is likely hardcoded for now or fetched, we use a placeholder or known env.
  // We can default to v1.0.0 if not specified otherwise.
  const appVersion = packageJson.version || '2.4.0';
  const loaderVersion = '2.0.0'; 

  const handleCopyId = () => {
    navigator.clipboard.writeText(clientId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const renderStatus = () => {
    switch (status) {
      case 'offline':
        return (
          <div className="flex items-center gap-1.5 text-red-500">
            <WifiOff size={12} />
            <span>Offline</span>
          </div>
        );
      case 'server-down':
        return (
          <div className="flex items-center gap-1.5 text-amber-500">
            <ServerCrash size={12} />
            <span>Server Down</span>
          </div>
        );
      case 'degraded':
        return (
          <div className="flex items-center gap-1.5 text-yellow-600">
            <Zap size={12} />
            <span>Slow ({latency}ms)</span>
          </div>
        );
      case 'connected':
      default:
        return (
          <div className="flex items-center gap-1.5 text-emerald-500">
            <CheckCircle2 size={12} />
            <span>Connected</span>
          </div>
        );
    }
  };

  return (
    <footer className="w-full border-t border-[#E2DCCF] bg-white/50 backdrop-blur-sm py-2 px-6 mt-auto shrink-0 flex items-center justify-between text-[11px] text-slate-500 z-40 relative">
      <div className="flex items-center gap-4">
        <button 
          onClick={handleCopyId}
          className="flex items-center gap-1.5 hover:text-slate-800 transition-colors bg-white hover:bg-slate-50 border border-slate-200 px-2 py-1 rounded-md shadow-sm"
          title="Copy Client ID"
        >
          <span className="font-semibold text-slate-600">Client ID</span>
          <div className="flex items-center gap-1 text-slate-500 bg-slate-100/50 px-1.5 py-0.5 rounded text-[10px]">
            {copied ? <CheckCircle2 size={10} className="text-emerald-500" /> : <Copy size={10} />}
            <span className="font-mono tracking-tight w-[70px] truncate">...{clientId.slice(-8)}</span>
          </div>
        </button>
      </div>
      
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 bg-gradient-to-r from-slate-100 to-slate-200 border border-slate-200 px-3 py-1 rounded-full shadow-sm">
            <Crown size={12} className="text-amber-500" />
            <span className="font-bold text-slate-700">{planName}</span>
            <span className="text-[9px] text-slate-500 font-semibold uppercase tracking-wider ml-0.5">Plan</span>
          </div>
          {onUpgrade && planName.toLowerCase() !== 'unlimited' && (
            <button 
              onClick={onUpgrade}
              className="text-[10px] font-bold bg-[#FF5A1F] text-white px-3 py-1 rounded-full hover:bg-[#FF5A1F]/90 transition-colors shadow-sm"
            >
              Upgrade
            </button>
          )}
        </div>
        <span className="w-[1px] h-4 bg-slate-200"></span>
        {renderStatus()}
      </div>

      <div className="flex items-center gap-4">
        <button 
          onClick={() => setShowChangelog(true)}
          className="flex items-center gap-1.5 hover:text-[#FF5A1F] transition-colors bg-white hover:bg-slate-50 border border-slate-200 px-2.5 py-1 rounded-md shadow-sm font-medium"
        >
          <FileText size={10} className="text-[#FF5A1F]" />
          <span>App v{appVersion}</span>
        </button>
        <span className="w-[1px] h-3 bg-slate-300"></span>
        <div className="flex items-center gap-1.5 px-2 py-1 rounded-md text-slate-500">
          <Pickaxe size={10} />
          <span>Loader v{loaderVersion}</span>
        </div>
      </div>
      
      <ChangelogDialog open={showChangelog} onClose={() => setShowChangelog(false)} />
    </footer>
  );
}
