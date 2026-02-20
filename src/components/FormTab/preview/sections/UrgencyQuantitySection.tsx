/**
 * Urgency Quantity Section Component
 * Displays stock urgency with "X left in stock" indicator
 */

import { getUrgencyColor } from '@/lib/utils/colors';
import type { Language } from '@/types';
import { Flame, Package, TrendingDown } from 'lucide-react';
import React from 'react';
import type { FormConfig } from '@/types/form';

interface UrgencyQuantitySectionProps {
    config: FormConfig;
    lang: Language;
    marginStyle?: React.CSSProperties;
}

// Dynamic color based on stock level
const getDynamicColor = (stock: number): string => {
    if (stock >= 8) return '#10b981'; // Green
    if (stock >= 4) return '#f59e0b'; // Amber
    return '#ef4444'; // Red
};

export const UrgencyQuantitySection: React.FC<UrgencyQuantitySectionProps> = ({
    config,
    lang,
    marginStyle,
}) => {
    if (!config.urgencyQuantity?.enabled) return null;

    const style = config.urgencyQuantity?.style || 'badge';
    const stockLeft = config.urgencyQuantity?.stockLeft ?? config.urgencyQuantity?.stockCount ?? 7;
    const showIcon = config.urgencyQuantity?.showIcon !== false;
    const animate = config.urgencyQuantity?.animate !== false;

    // Handle dynamic color preset
    const isDynamic = config.urgencyQuantity?.colorPreset === 'dynamic';
    const color = isDynamic
        ? getDynamicColor(stockLeft)
        : getUrgencyColor(
            config.urgencyQuantity?.colorPreset || 'default',
            config.urgencyQuantity?.customColor || '#ef4444',
            undefined,
            config.accentColor
        );

    // Custom text or default
    const customText = config.urgencyQuantity?.customText?.[lang] ||
        config.urgencyQuantity?.customText?.fr ||
        config.urgencyQuantity?.text?.[lang] ||
        config.urgencyQuantity?.text?.fr;
    const defaultText = lang === 'fr' ? `${stockLeft} restant en stock` : `${stockLeft} متبقي في المخزون`;
    const text = customText || defaultText;

    // Progress calculation (max 20 items)
    const maxStock = 20;
    const progressPercent = Math.min((stockLeft / maxStock) * 100, 100);

    return (
        <div style={marginStyle}>
            {/* Badge Style */}
            {style === 'badge' && (
                <div className="flex justify-center">
                    <div
                        className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg font-bold text-xs ${animate ? 'animate-pulse' : ''}`}
                        style={{
                            backgroundColor: `${color}15`,
                            border: `2px solid ${color}`,
                            color,
                        }}
                    >
                        {showIcon && <Package size={14} />}
                        {text}
                    </div>
                </div>
            )}

            {/* Banner Style */}
            {style === 'banner' && (
                <div
                    className="relative overflow-hidden py-3 px-4"
                    style={{
                        borderRadius: config.borderRadius,
                        background: `linear-gradient(135deg, ${color}20 0%, ${color}05 100%)`,
                        border: `1px solid ${color}40`,
                    }}
                >
                    <div
                        className="absolute inset-0 opacity-20"
                        style={{
                            background: `repeating-linear-gradient(
                                45deg,
                                transparent,
                                transparent 10px,
                                ${color}10 10px,
                                ${color}10 20px
                            )`,
                        }}
                    />
                    <p
                        className="relative text-center text-xs font-bold flex items-center justify-center gap-2"
                        style={{ color }}
                    >
                        {showIcon && <Package size={14} className={animate ? 'animate-pulse' : ''} />}
                        {text}
                    </p>
                </div>
            )}

            {/* Pill Style */}
            {style === 'pill' && (
                <div className="flex justify-center">
                    <div
                        className="inline-flex items-center gap-1.5 py-1.5 px-3 rounded-full text-[11px] font-bold"
                        style={{
                            backgroundColor: `${color}20`,
                            border: `1px solid ${color}50`,
                            color,
                        }}
                    >
                        {showIcon && (
                            <div
                                className={`w-2 h-2 rounded-full ${animate ? 'animate-pulse' : ''}`}
                                style={{ backgroundColor: color }}
                            />
                        )}
                        {text}
                    </div>
                </div>
            )}

            {/* Minimal Style */}
            {style === 'minimal' && (
                <div className="flex items-center justify-center gap-2">
                    {showIcon && (
                        <div
                            className={`w-2 h-2 rounded-full ${animate ? 'animate-pulse' : ''}`}
                            style={{ backgroundColor: color }}
                        />
                    )}
                    <span className="text-xs font-semibold" style={{ color }}>
                        {text}
                    </span>
                </div>
            )}

            {/* Progress Style - Visual stock bar */}
            {style === 'progress' && (
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
                            {showIcon && <TrendingDown size={14} style={{ color }} className={animate ? 'animate-pulse' : ''} />}
                            <span className="text-[10px] font-bold uppercase tracking-wide" style={{ color }}>
                                {lang === 'fr' ? 'Stock restant' : 'المخزون المتبقي'}
                            </span>
                        </div>
                        <span className="text-xs font-mono font-bold" style={{ color }}>
                            {stockLeft}/{maxStock}
                        </span>
                    </div>
                    <div
                        className="h-3 rounded-full overflow-hidden"
                        style={{ backgroundColor: `${color}20` }}
                    >
                        <div
                            className={`h-full rounded-full transition-all duration-500 relative overflow-hidden ${animate ? 'animate-pulse' : ''}`}
                            style={{
                                width: `${progressPercent}%`,
                                background: `linear-gradient(90deg, ${color} 0%, ${color}cc 100%)`,
                            }}
                        />
                    </div>
                    <p className="text-center text-[10px] font-semibold mt-2" style={{ color: `${color}cc` }}>
                        {text}
                    </p>
                </div>
            )}

            {/* Counter Style - Large animated number */}
            {style === 'counter' && (
                <div
                    className="relative overflow-hidden py-4 px-4 text-center"
                    style={{
                        borderRadius: config.borderRadius,
                        background: `linear-gradient(135deg, ${color}15 0%, ${color}05 100%)`,
                        border: `2px solid ${color}40`,
                    }}
                >
                    <div
                        className={`absolute inset-0 opacity-20 ${animate ? 'animate-pulse' : ''}`}
                        style={{
                            background: `radial-gradient(circle at center, ${color}30 0%, transparent 70%)`,
                        }}
                    />
                    <div className="relative">
                        <div
                            className={`text-4xl font-black font-mono ${animate ? 'animate-bounce' : ''}`}
                            style={{
                                color,
                                textShadow: `0 0 20px ${color}50`,
                                animationDuration: '2s',
                            }}
                        >
                            {stockLeft}
                        </div>
                        <p className="text-[10px] font-bold uppercase tracking-wide mt-1" style={{ color }}>
                            {lang === 'fr' ? 'articles restants' : 'عناصر متبقية'}
                        </p>
                    </div>
                </div>
            )}

            {/* Flame Style - Burning/fire effect */}
            {style === 'flame' && (
                <div
                    className="relative overflow-hidden py-3 px-4"
                    style={{
                        borderRadius: config.borderRadius,
                        background: `linear-gradient(135deg, #1a1a2e 0%, #0f0f1a 100%)`,
                        border: `1px solid ${color}40`,
                    }}
                >
                    {/* Animated fire background */}
                    <div
                        className={`absolute bottom-0 left-0 right-0 h-1/2 opacity-30 ${animate ? 'animate-pulse' : ''}`}
                        style={{
                            background: `linear-gradient(0deg, ${color} 0%, ${color}80 30%, transparent 100%)`,
                            filter: 'blur(8px)',
                        }}
                    />
                    <div className="relative flex items-center justify-center gap-3">
                        {showIcon && (
                            <div className="relative">
                                <Flame
                                    size={24}
                                    className={animate ? 'animate-pulse' : ''}
                                    style={{
                                        color,
                                        filter: `drop-shadow(0 0 8px ${color})`,
                                    }}
                                />
                            </div>
                        )}
                        <div className="text-center">
                            <div
                                className="text-2xl font-black font-mono"
                                style={{
                                    color,
                                    textShadow: `0 0 15px ${color}`,
                                }}
                            >
                                {stockLeft}
                            </div>
                            <p className="text-[10px] font-bold uppercase tracking-wide text-white/70">
                                {lang === 'fr' ? 'en stock' : 'في المخزون'}
                            </p>
                        </div>
                        {showIcon && (
                            <div className="relative">
                                <Flame
                                    size={24}
                                    className={animate ? 'animate-pulse' : ''}
                                    style={{
                                        color,
                                        filter: `drop-shadow(0 0 8px ${color})`,
                                        transform: 'scaleX(-1)',
                                    }}
                                />
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};
