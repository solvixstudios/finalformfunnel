/**
 * Urgency Timer Section Component
 * Displays countdown timer urgency indicator
 */

import { getUrgencyColor } from '@/lib/utils/colors';
import type { Language } from '@/types';
import { Clock } from 'lucide-react';
import React from 'react';

interface UrgencyTimerSectionProps {
    config: {
        accentColor: string;
        borderRadius: string;
        urgencyTimer?: {
            enabled?: boolean;
            style?: 'digital' | 'banner' | 'minimal' | 'compact' | 'flip' | 'bar';
            colorPreset?: string;
            customColor?: string;
            showLabel?: boolean;
            customText?: { fr?: string; ar?: string };
        };
    };
    lang: Language;
    marginStyle?: React.CSSProperties;
    countdown?: { hours: number; minutes: number; seconds: number };
}

export const UrgencyTimerSection: React.FC<UrgencyTimerSectionProps> = ({
    config,
    lang,
    marginStyle,
    countdown = { hours: 2, minutes: 30, seconds: 0 },
}) => {
    if (!config.urgencyTimer?.enabled) return null;

    const style = config.urgencyTimer?.style || 'digital';
    const color = getUrgencyColor(
        config.urgencyTimer?.colorPreset || 'default',
        config.urgencyTimer?.customColor || '#ef4444',
        undefined,
        config.accentColor
    );
    const showLabel = config.urgencyTimer?.showLabel !== false;

    // Safely access countdown with fallback
    const safeCountdown = countdown || { hours: 2, minutes: 30, seconds: 0 };
    const formatTime = (num: number) => String(num).padStart(2, '0');
    const timeDisplay = `${formatTime(safeCountdown.hours)}:${formatTime(safeCountdown.minutes)}:${formatTime(safeCountdown.seconds)}`;

    // Use custom text or default
    const defaultLabel = lang === 'fr' ? 'Offre expire dans' : 'ينتهي العرض في';
    const urgencyLabel = config.urgencyTimer?.customText?.[lang] || config.urgencyTimer?.customText?.fr || defaultLabel;

    // Calculate total seconds for progress bar
    const totalSeconds = safeCountdown.hours * 3600 + safeCountdown.minutes * 60 + safeCountdown.seconds;
    const maxSeconds = 24 * 3600; // 24 hours max
    const progressPercent = Math.min((totalSeconds / maxSeconds) * 100, 100);

    return (
        <div style={marginStyle}>
            {/* Digital Style */}
            {style === 'digital' && (
                <div
                    className="relative overflow-hidden py-4 px-4"
                    style={{
                        borderRadius: config.borderRadius,
                        background: `linear-gradient(135deg, ${color}15 0%, ${color}08 100%)`,
                        border: `2px solid ${color}40`,
                    }}
                >
                    <div
                        className="absolute inset-0 animate-pulse opacity-20"
                        style={{
                            background: `radial-gradient(circle at center, ${color}30 0%, transparent 70%)`,
                        }}
                    />
                    <div className="relative flex flex-col items-center gap-2">
                        {showLabel && (
                            <div className="flex items-center gap-2">
                                <Clock size={16} style={{ color }} className="animate-pulse" />
                                <span className="text-[10px] font-bold uppercase tracking-wide" style={{ color }}>
                                    {urgencyLabel}
                                </span>
                            </div>
                        )}
                        <div
                            className="text-2xl font-black tracking-wider font-mono"
                            style={{ color, textShadow: `0 0 10px ${color}40` }}
                        >
                            {timeDisplay}
                        </div>
                    </div>
                </div>
            )}

            {/* Banner Style */}
            {style === 'banner' && (
                <div
                    className="relative overflow-hidden py-3 px-4"
                    style={{
                        borderRadius: config.borderRadius,
                        background: `linear-gradient(90deg, ${color}20 0%, ${color}10 50%, ${color}20 100%)`,
                        border: `1px solid ${color}40`,
                    }}
                >
                    <p
                        className="text-center text-xs font-bold flex items-center justify-center gap-2"
                        style={{ color }}
                    >
                        <Clock size={14} className="animate-pulse" />
                        {showLabel && <span>{urgencyLabel}:</span>}
                        <span className="font-mono text-sm">{timeDisplay}</span>
                    </p>
                </div>
            )}

            {/* Minimal Style */}
            {style === 'minimal' && (
                <div className="flex items-center justify-center gap-2">
                    <Clock size={14} style={{ color }} className="animate-pulse" />
                    {showLabel && (
                        <span className="text-xs font-semibold" style={{ color }}>
                            {urgencyLabel}:{' '}
                        </span>
                    )}
                    <span className="text-xs font-mono font-bold" style={{ color }}>
                        {timeDisplay}
                    </span>
                </div>
            )}

            {/* Compact Style */}
            {style === 'compact' && (
                <div className="flex justify-center">
                    <div
                        className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full"
                        style={{
                            backgroundColor: `${color}15`,
                            border: `1px solid ${color}40`,
                        }}
                    >
                        <Clock size={12} style={{ color }} />
                        <span className="text-[11px] font-mono font-bold" style={{ color }}>
                            {timeDisplay}
                        </span>
                    </div>
                </div>
            )}

            {/* Flip Style - Premium flip clock */}
            {style === 'flip' && (
                <div
                    className="relative overflow-hidden py-4 px-4"
                    style={{
                        borderRadius: config.borderRadius,
                        background: 'linear-gradient(180deg, #1a1a2e 0%, #16213e 100%)',
                        boxShadow: '0 10px 30px -10px rgba(0,0,0,0.5)',
                    }}
                >
                    {showLabel && (
                        <div className="flex items-center justify-center gap-2 mb-3">
                            <Clock size={14} className="text-white/60" />
                            <span className="text-[10px] font-bold uppercase tracking-wide text-white/60">
                                {urgencyLabel}
                            </span>
                        </div>
                    )}
                    <div className="flex items-center justify-center gap-1">
                        {[safeCountdown.hours, safeCountdown.minutes, safeCountdown.seconds].map((val, idx) => (
                            <React.Fragment key={idx}>
                                <div className="flex gap-0.5">
                                    {formatTime(val).split('').map((digit, dIdx) => (
                                        <div
                                            key={dIdx}
                                            className="relative w-8 h-12 rounded-lg overflow-hidden"
                                            style={{
                                                background: 'linear-gradient(180deg, #2d2d44 0%, #1a1a2e 50%, #2d2d44 100%)',
                                                boxShadow: `inset 0 1px 0 rgba(255,255,255,0.1), 0 2px 4px rgba(0,0,0,0.3), 0 0 20px ${color}30`,
                                            }}
                                        >
                                            <div className="absolute inset-0 flex items-center justify-center">
                                                <span
                                                    className="text-xl font-black font-mono"
                                                    style={{ color, textShadow: `0 0 10px ${color}` }}
                                                >
                                                    {digit}
                                                </span>
                                            </div>
                                            <div
                                                className="absolute left-0 right-0 h-px top-1/2"
                                                style={{ background: 'rgba(0,0,0,0.4)' }}
                                            />
                                        </div>
                                    ))}
                                </div>
                                {idx < 2 && (
                                    <div className="flex flex-col gap-1.5 px-1">
                                        <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ backgroundColor: color }} />
                                        <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ backgroundColor: color }} />
                                    </div>
                                )}
                            </React.Fragment>
                        ))}
                    </div>
                </div>
            )}

            {/* Bar Style - Progress bar countdown */}
            {style === 'bar' && (
                <div
                    className="relative overflow-hidden py-3 px-4"
                    style={{
                        borderRadius: config.borderRadius,
                        background: `${color}08`,
                        border: `1px solid ${color}30`,
                    }}
                >
                    <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                            <Clock size={14} style={{ color }} className="animate-pulse" />
                            {showLabel && (
                                <span className="text-[10px] font-bold uppercase tracking-wide" style={{ color }}>
                                    {urgencyLabel}
                                </span>
                            )}
                        </div>
                        <span className="text-xs font-mono font-bold" style={{ color }}>
                            {timeDisplay}
                        </span>
                    </div>
                    <div
                        className="h-2 rounded-full overflow-hidden"
                        style={{ backgroundColor: `${color}20` }}
                    >
                        <div
                            className="h-full rounded-full transition-all duration-1000 ease-linear relative overflow-hidden"
                            style={{
                                width: `${progressPercent}%`,
                                background: `linear-gradient(90deg, ${color} 0%, ${color}cc 100%)`,
                            }}
                        >
                            <div
                                className="absolute inset-0 animate-pulse"
                                style={{
                                    background: `linear-gradient(90deg, transparent 0%, ${color}50 50%, transparent 100%)`,
                                }}
                            />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
