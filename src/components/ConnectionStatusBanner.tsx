import { useConnectionStatus } from '@/hooks/useConnectionStatus';
import { WifiOff, ServerCrash, Zap, CheckCircle2, Loader2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * Animated banner that slides in from the top when connection issues are detected.
 * Shows different states: offline, server-down, degraded, reconnected.
 */
export const ConnectionStatusBanner = () => {
    const { status, justReconnected, latency } = useConnectionStatus();
    const [visible, setVisible] = useState(false);
    const [displayState, setDisplayState] = useState(status);
    const location = useLocation();

    // Only show on dashboard
    const isDashboard = location.pathname.startsWith('/dashboard') || location.pathname.startsWith('/admin');

    // Debounce visibility: only show after issue persists for 2s
    useEffect(() => {
        let timer: ReturnType<typeof setTimeout>;

        if (status === 'connected' && !justReconnected) {
            // Hide after a short delay for smooth exit
            timer = setTimeout(() => setVisible(false), 400);
        } else if (status !== 'connected') {
            // Show after 2s debounce to avoid flickering on brief disconnects
            timer = setTimeout(() => {
                setVisible(true);
                setDisplayState(status);
            }, 2000);
        } else if (justReconnected) {
            setVisible(true);
            setDisplayState('connected');
            // Auto-hide the "back online" flash
            timer = setTimeout(() => setVisible(false), 4000);
        }

        return () => clearTimeout(timer);
    }, [status, justReconnected]);

    if ((!visible && !justReconnected) || !isDashboard) return null;

    const configs = {
        offline: {
            bg: 'from-red-500/95 to-red-600/95',
            border: 'border-red-400/30',
            icon: <WifiOff size={15} className="shrink-0" />,
            title: "You're offline",
            subtitle: "Changes won't sync until you reconnect",
            dot: 'bg-red-300 animate-pulse',
            glow: 'shadow-red-500/20',
        },
        'server-down': {
            bg: 'from-amber-500/95 to-orange-500/95',
            border: 'border-amber-400/30',
            icon: <ServerCrash size={15} className="shrink-0" />,
            title: 'Server unreachable',
            subtitle: 'Attempting to reconnect...',
            dot: 'bg-amber-300 animate-pulse',
            glow: 'shadow-amber-500/20',
            spinner: true,
        },
        degraded: {
            bg: 'from-amber-400/90 to-yellow-500/90',
            border: 'border-yellow-400/30',
            icon: <Zap size={15} className="shrink-0" />,
            title: 'Slow connection',
            subtitle: `Latency: ${latency ? `${latency}ms` : 'high'}`,
            dot: 'bg-yellow-300 animate-pulse',
            glow: 'shadow-yellow-500/15',
        },
        connected: {
            bg: 'from-emerald-500/95 to-green-500/95',
            border: 'border-emerald-400/30',
            icon: <CheckCircle2 size={15} className="shrink-0" />,
            title: 'Back online!',
            subtitle: 'Connection restored',
            dot: 'bg-emerald-300',
            glow: 'shadow-emerald-500/20',
        },
    };

    const config = configs[displayState];

    return (
        <div
            className={`
        fixed bottom-4 right-4 z-[9999]
        transition-all duration-500 ease-out
        ${visible ? 'translate-y-0 opacity-100 scale-100' : 'translate-y-4 opacity-0 scale-95'}
      `}
        >
            <div
                className={`
          max-w-[280px]
          bg-gradient-to-r ${config.bg}
          backdrop-blur-xl
          border ${config.border}
          rounded-xl
          px-3 py-2
          shadow-lg ${config.glow}
          flex items-center gap-2
          text-white
        `}
            >
                {/* Status Dot */}
                <div className="relative flex items-center justify-center shrink-0">
                    <div className={`w-2 h-2 rounded-full ${config.dot}`} />
                    {config.dot.includes('animate') && (
                        <div className={`absolute w-2 h-2 rounded-full ${config.dot} opacity-50 scale-150`} />
                    )}
                </div>

                {/* Icon */}
                {config.icon}

                {/* Text */}
                <div className="flex-1 min-w-0 pr-1">
                    <p className="text-[11px] font-bold leading-tight tracking-wide">{config.title}</p>
                    <p className="text-[9px] font-medium opacity-80 leading-tight mt-0.5">{config.subtitle}</p>
                </div>

                {/* Spinner for server-down */}
                {'spinner' in config && config.spinner && (
                    <Loader2 size={12} className="animate-spin opacity-70 shrink-0" />
                )}
            </div>
        </div>
    );
};
