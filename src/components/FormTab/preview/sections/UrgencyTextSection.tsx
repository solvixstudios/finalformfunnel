/**
 * Urgency Text Section Component
 * Displays urgency message with multiple style variants
 */

import { getUrgencyColor } from '@/lib/utils/colors';
import type { Language } from '@/types';
import { Zap } from 'lucide-react';
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
    // Use configured text or smart default
    const defaultText = lang === 'fr' ? '⚡ Offre limitée!' : '⚡ عرض محدود!';
    const text = config.urgencyText?.text?.[lang] || config.urgencyText?.text?.fr || defaultText;

    return (
        <div style={marginStyle}>
            {/* Banner Style */}
            {style === 'banner' && (
                <div
                    className="relative overflow-hidden py-3 px-4"
                    style={{
                        borderRadius: config.borderRadius,
                        background: `linear-gradient(135deg, ${color}15 0%, ${color}05 100%)`,
                        border: `1px solid ${color}30`,
                    }}
                >
                    <div
                        className="absolute inset-0 animate-pulse opacity-30"
                        style={{
                            background: `radial-gradient(circle at center, ${color}20 0%, transparent 70%)`,
                        }}
                    />
                    <p
                        className="relative text-center text-xs font-bold flex items-center justify-center gap-2"
                        style={{ color }}
                    >
                        <Zap size={14} className="animate-pulse" />
                        {text}
                        <Zap size={14} className="animate-pulse" />
                    </p>
                </div>
            )}

            {/* Pill Style */}
            {style === 'pill' && (
                <div className="flex justify-center">
                    <div
                        className="inline-flex items-center gap-2 py-2 px-4 rounded-full animate-bounce"
                        style={{ backgroundColor: `${color}15`, border: `1px solid ${color}40` }}
                    >
                        <Zap size={12} style={{ color }} />
                        <span className="text-[11px] font-bold" style={{ color }}>
                            {text}
                        </span>
                    </div>
                </div>
            )}

            {/* Glow Style */}
            {style === 'glow' && (
                <div
                    className="relative py-3 px-4 text-center"
                    style={{ borderRadius: config.borderRadius }}
                >
                    <div
                        className="absolute inset-0 animate-pulse rounded-xl blur-md"
                        style={{ background: `${color}30`, borderRadius: config.borderRadius }}
                    />
                    <p
                        className="relative text-xs font-black tracking-wide flex items-center justify-center gap-2"
                        style={{ color, textShadow: `0 0 20px ${color}80` }}
                    >
                        <Zap size={14} className="animate-pulse" />
                        {text}
                        <Zap size={14} className="animate-pulse" />
                    </p>
                </div>
            )}

            {/* Minimal Style */}
            {style === 'minimal' && (
                <p
                    className="text-center text-xs font-bold animate-pulse flex items-center justify-center gap-1.5"
                    style={{ color }}
                >
                    <span style={{ fontSize: '10px' }}>⚡</span>
                    {text}
                </p>
            )}
        </div>
    );
};
