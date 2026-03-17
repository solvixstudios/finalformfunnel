/**
 * Urgency Timer Section Component
 * Compact, elegant, and theme-consistent countdown timers
 */

import { getUrgencyColor } from '@/lib/utils/colors';
import type { Language } from '@/types';
import { Clock, Hourglass, Zap } from 'lucide-react';
import React from 'react';
import type { FormConfig } from '@/types/form';

interface UrgencyTimerSectionProps {
    config: FormConfig;
    lang: Language;
    marginStyle?: React.CSSProperties;
    countdown?: { hours: number; minutes: number; seconds: number };
    isBasicTheme?: boolean;
}

export const UrgencyTimerSection: React.FC<UrgencyTimerSectionProps> = ({
    config,
    lang,
    marginStyle,
    countdown = { hours: 2, minutes: 30, seconds: 0 },
    isBasicTheme = false,
}) => {
    if (!config.urgencyTimer?.enabled || isBasicTheme) return null;

    const style = config.urgencyTimer?.style || 'digital';
    const color = getUrgencyColor(
        config.urgencyTimer?.colorPreset || 'default',
        config.urgencyTimer?.customColor || '#ef4444',
        undefined,
        config.accentColor
    );
    const showLabel = config.urgencyTimer?.showLabel !== false;

    const safeCountdown = countdown || { hours: 2, minutes: 30, seconds: 0 };
    const formatTime = (num: number) => String(num).padStart(2, '0');

    const timeDisplay = `${formatTime(safeCountdown.hours)}:${formatTime(safeCountdown.minutes)}:${formatTime(safeCountdown.seconds)}`;

    const isRTL = lang === 'ar';
    const defaultLabel = isRTL ? 'ينتهي العرض في' : 'Offre expire dans';
    const urgencyLabel = config.urgencyTimer?.customText?.[lang] || config.urgencyTimer?.customText?.fr || defaultLabel;

    const totalSeconds = safeCountdown.hours * 3600 + safeCountdown.minutes * 60 + safeCountdown.seconds;
    const maxSeconds = 24 * 3600;
    const progressPercent = Math.min((totalSeconds / maxSeconds) * 100, 100);
    const borderRadius = config.borderRadius || '8px';

    return (
        <div style={marginStyle} className={isRTL ? 'rtl flex justify-center w-full' : 'ltr flex justify-center w-full'}>

            {/* 1. Digital Style: Clean, boxed digits */}
            {style === 'digital' && (
                <div
                    className="w-full flex flex-col items-center justify-center p-4 border shadow-sm transition-colors"
                    style={{
                        borderRadius,
                        backgroundColor: `${color}05`,
                        borderColor: `${color}20`,
                    }}
                >
                    {showLabel && (
                        <div className="flex items-center justify-center gap-2 mb-3 w-full">
                            <Zap size={16} style={{ color }} className="animate-pulse" />
                            <span className="text-sm font-extrabold uppercase tracking-wide text-slate-800">
                                {urgencyLabel}
                            </span>
                        </div>
                    )}
                    <div
                        dir="ltr"
                        className="flex items-center gap-1.5"
                    >
                        {safeCountdown.hours > 0 && (
                            <>
                                <div className="flex items-center justify-center w-10 h-11 sm:w-12 sm:h-12 rounded-lg border bg-white shadow-sm" style={{ borderColor: `${color}30` }}>
                                    <span className="text-xl font-bold font-mono tracking-wider tabular-nums" style={{ color }}>
                                        {formatTime(safeCountdown.hours)}
                                    </span>
                                </div>
                                <span className="text-xl font-bold text-slate-400 mx-0.5 animate-pulse">:</span>
                            </>
                        )}
                        <div className="flex items-center justify-center w-10 h-11 sm:w-12 sm:h-12 rounded-lg border bg-white shadow-sm" style={{ borderColor: `${color}30` }}>
                            <span className="text-xl font-bold font-mono tracking-wider tabular-nums" style={{ color }}>
                                {formatTime(safeCountdown.minutes)}
                            </span>
                        </div>
                        <span className="text-xl font-bold text-slate-400 mx-0.5 animate-pulse">:</span>
                        <div className="flex items-center justify-center w-10 h-11 sm:w-12 sm:h-12 rounded-lg border bg-white shadow-sm" style={{ borderColor: `${color}30` }}>
                            <span className="text-xl font-bold font-mono tracking-wider tabular-nums" style={{ color }}>
                                {formatTime(safeCountdown.seconds)}
                            </span>
                        </div>
                    </div>
                </div>
            )}

            {/* 2. Banner Style: Full-width soft block with timer inline */}
            {style === 'banner' && (
                <div
                    className="w-full flex items-center justify-center flex-wrap gap-2.5 py-2.5 px-4 shadow-sm border"
                    style={{
                        borderRadius,
                        backgroundColor: `${color}10`,
                        borderColor: `${color}20`,
                    }}
                >
                    <div className="flex items-center gap-2">
                        <Clock size={16} style={{ color }} className="animate-pulse" />
                        {showLabel && (
                            <span className="text-xs sm:text-sm font-bold tracking-wide text-gray-800">
                                {urgencyLabel}
                            </span>
                        )}
                    </div>
                    <div
                        dir="ltr"
                        className="bg-white text-gray-800 font-mono text-sm font-bold px-2 py-0.5 rounded shadow-sm border"
                        style={{ borderColor: `${color}20`, color: color }}
                    >
                        {timeDisplay}
                    </div>
                </div>
            )}

            {/* 3. Compact Style: Pill-shaped elegant timer */}
            {style === 'compact' && (
                <div
                    className="inline-flex items-center justify-center gap-3 px-6 py-2.5 rounded-full border shadow-sm transition-transform hover:scale-[1.02] w-full max-w-sm mx-auto"
                    style={{
                        backgroundColor: `${color}10`,
                        borderColor: `${color}30`,
                    }}
                >
                    <Hourglass size={18} style={{ color }} className="animate-pulse" />
                    <span
                        dir="ltr"
                        className="text-sm sm:text-base font-mono font-bold tracking-wider"
                        style={{ color }}
                    >
                        {timeDisplay}
                    </span>
                </div>
            )}

            {/* 4. Flip Style: Modern, compact flip cards */}
            {style === 'flip' && (
                <div
                    className="w-full flex flex-col items-center p-4 border shadow-sm"
                    style={{
                        borderRadius,
                        backgroundColor: '#f8fafc',
                        borderColor: `${color}20`,
                    }}
                >
                    {showLabel && (
                        <div className="flex items-center gap-1.5 mb-3">
                            <Clock size={14} style={{ color }} />
                            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                                {urgencyLabel}
                            </span>
                        </div>
                    )}

                    <div className="flex items-center gap-1.5" dir="ltr">
                        {[safeCountdown.hours, safeCountdown.minutes, safeCountdown.seconds].map((val, idx) => (
                            <React.Fragment key={idx}>
                                <div className="flex gap-0.5">
                                    {formatTime(val).split('').map((digit, dIdx) => (
                                        <div
                                            key={dIdx}
                                            className="relative flex items-center justify-center w-6 h-9 sm:w-8 sm:h-11 rounded bg-slate-800 border-b-2 shadow-sm"
                                            style={{ borderColor: '#0f172a' }}
                                        >
                                            <span className="text-lg sm:text-xl font-bold font-mono text-white tracking-tighter">
                                                {digit}
                                            </span>
                                            <div className="absolute inset-0 h-[1px] w-full bg-black/30 top-1/2 -translate-y-1/2 z-10" />
                                        </div>
                                    ))}
                                </div>
                                {idx < 2 && (
                                    <div className="flex flex-col gap-1.5 px-0.5 justify-center">
                                        <div className="w-1 h-1 rounded-full bg-slate-400 animate-pulse" />
                                        <div className="w-1 h-1 rounded-full bg-slate-400 animate-pulse" />
                                    </div>
                                )}
                            </React.Fragment>
                        ))}
                    </div>
                </div>
            )}

            {/* 5. Bar Style: Compact progress-integrated layout */}
            {style === 'bar' && (
                <div
                    className="w-full p-3 border shadow-sm transition-colors"
                    style={{
                        borderRadius,
                        backgroundColor: `${color}05`,
                        borderColor: `${color}20`,
                    }}
                >
                    <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                            <Clock size={14} style={{ color }} />
                            {showLabel && (
                                <span className="text-xs font-semibold uppercase tracking-wide text-gray-700">
                                    {urgencyLabel}
                                </span>
                            )}
                        </div>
                        <span
                            dir="ltr"
                            className="text-xs font-mono font-bold tracking-wider px-2 rounded-sm"
                            style={{ color }}
                        >
                            {timeDisplay}
                        </span>
                    </div>
                    <div className="h-1.5 w-full rounded-full overflow-hidden bg-gray-200/50">
                        <div
                            className="h-full rounded-full transition-all duration-1000 ease-linear"
                            style={{
                                width: `${progressPercent}%`,
                                backgroundColor: color,
                                right: isRTL ? 0 : 'auto',
                                left: isRTL ? 'auto' : 0,
                                position: 'relative'
                            }}
                        >
                            <div className="absolute inset-0 bg-white/20 animate-pulse" />
                        </div>
                    </div>
                </div>
            )}

            {/* 6. Minimal Style: Typography only */}
            {style === 'minimal' && (
                <div className="flex items-center justify-center gap-2 w-full py-1.5">
                    <Hourglass size={14} style={{ color }} className="animate-pulse opacity-80" />
                    {showLabel && (
                        <span className="text-xs sm:text-sm font-semibold tracking-wide text-gray-700">
                            {urgencyLabel}
                        </span>
                    )}
                    <span
                        dir="ltr"
                        className="text-xs sm:text-sm font-mono font-bold tracking-wider"
                        style={{ color }}
                    >
                        {timeDisplay}
                    </span>
                </div>
            )}

        </div>
    );
};
