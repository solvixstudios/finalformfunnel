/**
 * Urgency Text Section Component
 * Premium, theme-consistent urgency messaging with modern visual styles.
 */

import { getUrgencyColor } from '@/lib/utils/colors';
import type { Language } from '@/types';
import { Zap, AlertCircle, Info, Sparkles, Flame } from 'lucide-react';
import React from 'react';
import type { FormConfig } from '@/types/form';

interface UrgencyTextSectionProps {
    config: FormConfig;
    lang: Language;
    marginStyle?: React.CSSProperties;
}

export const UrgencyTextSection: React.FC<UrgencyTextSectionProps> = ({
    config,
    lang,
    marginStyle,
}) => {
    if (!config.urgencyText?.enabled) return null;

    const style = config.urgencyText?.style || 'banner';
    const color = getUrgencyColor(
        config.urgencyText?.colorPreset || 'default',
        config.urgencyText?.customColor || '#f59e0b',
        undefined,
        config.accentColor
    );

    const isRTL = lang === 'ar';
    const defaultText = isRTL ? '⚡ عرض محدود!' : '⚡ Offre limitée!';
    const text = config.urgencyText?.text?.[lang] || config.urgencyText?.text?.fr || defaultText;

    const borderRadius = config.borderRadius || '8px';

    return (
        <div style={marginStyle} className={isRTL ? 'rtl flex justify-center' : 'ltr flex justify-center'}>

            {/* ── Banner: Gradient-tinted full-width block ── */}
            {style === 'banner' && (
                <div
                    className="w-full flex items-center justify-center gap-3 py-3.5 px-5 border transition-all duration-300"
                    style={{
                        borderRadius,
                        background: `linear-gradient(135deg, ${color}08 0%, ${color}15 100%)`,
                        borderColor: `${color}25`,
                    }}
                >
                    <div
                        className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                        style={{ backgroundColor: `${color}18` }}
                    >
                        <Zap size={15} style={{ color }} className="animate-pulse" />
                    </div>
                    <span
                        className="text-sm font-extrabold tracking-wide"
                        style={{ color }}
                    >
                        {text}
                    </span>
                </div>
            )}

            {/* ── Pill: Compact rounded inline element with subtle glow ── */}
            {style === 'pill' && (
                <div
                    className="inline-flex items-center gap-2.5 py-2.5 px-5 rounded-full border transition-all duration-300 hover:scale-[1.02]"
                    style={{
                        backgroundColor: `${color}08`,
                        borderColor: `${color}22`,
                        boxShadow: `0 0 20px ${color}12`,
                    }}
                >
                    <Sparkles size={15} style={{ color }} className="animate-pulse" />
                    <span
                        className="text-sm font-bold tracking-wide"
                        style={{ color }}
                    >
                        {text}
                    </span>
                    <div
                        className="w-1.5 h-1.5 rounded-full animate-pulse"
                        style={{ backgroundColor: color }}
                    />
                </div>
            )}

            {/* ── Glow: Soft neon background blur ── */}
            {style === 'glow' && (
                <div className="w-full relative flex items-center justify-center py-4 overflow-hidden">
                    {/* Blur glow layer */}
                    <div
                        className="absolute inset-0 blur-2xl opacity-15 pointer-events-none"
                        style={{ backgroundColor: color }}
                    />
                    <div
                        className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-px opacity-20"
                        style={{ backgroundColor: color }}
                    />
                    <div className="relative flex items-center gap-2.5 z-10">
                        <Flame size={18} style={{ color }} className="animate-pulse" />
                        <span
                            className="text-sm sm:text-base font-extrabold tracking-wider uppercase"
                            style={{
                                color,
                                textShadow: `0 0 12px ${color}40, 0 0 24px ${color}20`,
                            }}
                        >
                            {text}
                        </span>
                    </div>
                </div>
            )}

            {/* ── Minimal: Clean typography with thin accent line ── */}
            {style === 'minimal' && (
                <div className="flex items-center justify-center gap-3 w-full py-2.5">
                    <div
                        className="h-px flex-1 max-w-[40px] opacity-40"
                        style={{ backgroundColor: color }}
                    />
                    <div className="flex items-center gap-2">
                        <Info size={14} style={{ color, opacity: 0.7 }} />
                        <span
                            className="text-sm font-bold tracking-wide"
                            style={{ color }}
                        >
                            {text}
                        </span>
                    </div>
                    <div
                        className="h-px flex-1 max-w-[40px] opacity-40"
                        style={{ backgroundColor: color }}
                    />
                </div>
            )}

        </div>
    );
};
