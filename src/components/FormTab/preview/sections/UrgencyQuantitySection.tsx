/**
 * Urgency Quantity Section Component
 * Premium stock-urgency indicators with modern visual styles.
 */

import { getUrgencyColor } from '@/lib/utils/colors';
import type { Language } from '@/types';
import { Flame, Package, TrendingDown, Target, ShoppingBag } from 'lucide-react';
import React from 'react';
import type { FormConfig } from '@/types/form';

interface UrgencyQuantitySectionProps {
    config: FormConfig;
    lang: Language;
    marginStyle?: React.CSSProperties;
}

const getDynamicColor = (stock: number): string => {
    if (stock >= 8) return '#10b981';
    if (stock >= 4) return '#f59e0b';
    return '#ef4444';
};

export const UrgencyQuantitySection: React.FC<UrgencyQuantitySectionProps> = ({
    config,
    lang,
    marginStyle,
}) => {
    if (!config.urgencyQuantity?.enabled) return null;

    const uq = config.urgencyQuantity as any;
    const style = uq.style || 'badge';
    const stockLeft = Number(uq.stockLeft ?? uq.stockCount ?? 7);
    const showIcon = uq.showIcon !== false;
    const animate = uq.animate !== false;

    const isDynamic = uq.colorPreset === 'dynamic';
    const color = isDynamic
        ? getDynamicColor(stockLeft)
        : getUrgencyColor(
            uq.colorPreset || 'default',
            uq.customColor || '#ef4444',
            undefined,
            config.accentColor
        );

    const isRTL = lang === 'ar';
    const customText = uq.customText?.[lang] || uq.customText?.fr || uq.text?.[lang] || uq.text?.fr;
    const defaultText = isRTL ? `${stockLeft} متبقي في المخزون` : `${stockLeft} restant en stock`;
    const text = customText || defaultText;

    const maxStock = 20;
    const progressPercent = Math.min((stockLeft / maxStock) * 100, 100);
    const borderRadius = config.borderRadius || '8px';

    return (
        <div style={marginStyle} className={isRTL ? 'rtl flex justify-center w-full' : 'ltr flex justify-center w-full'}>

            {/* ── Badge: Compact chip with dot indicator ── */}
            {style === 'badge' && (
                <div
                    className="inline-flex items-center gap-2.5 px-4 py-2.5 border transition-all duration-300 hover:scale-[1.02]"
                    style={{
                        borderRadius,
                        background: `linear-gradient(135deg, ${color}05 0%, ${color}10 100%)`,
                        borderColor: `${color}25`,
                    }}
                >
                    {showIcon && (
                        <div
                            className="w-6 h-6 rounded-md flex items-center justify-center shrink-0"
                            style={{ backgroundColor: `${color}15` }}
                        >
                            <Target size={13} style={{ color }} />
                        </div>
                    )}
                    <span className="text-sm font-bold tracking-wide" style={{ color }}>
                        {text}
                    </span>
                    {animate && (
                        <div className="w-2 h-2 rounded-full animate-pulse ml-0.5" style={{ backgroundColor: color }} />
                    )}
                </div>
            )}

            {/* ── Banner: Full-width soft-tinted block ── */}
            {style === 'banner' && (
                <div
                    className="w-full flex items-center justify-center gap-3 py-3.5 px-5 border transition-all duration-300"
                    style={{
                        borderRadius,
                        background: `linear-gradient(135deg, ${color}08 0%, ${color}14 100%)`,
                        borderColor: `${color}20`,
                    }}
                >
                    {showIcon && (
                        <div
                            className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                            style={{ backgroundColor: `${color}18` }}
                        >
                            <Package size={15} style={{ color }} />
                        </div>
                    )}
                    <span className="text-sm font-extrabold tracking-wide" style={{ color }}>
                        {text}
                    </span>
                </div>
            )}

            {/* ── Pill: Rounded inline element ── */}
            {style === 'pill' && (
                <div
                    className="inline-flex items-center gap-2.5 py-2.5 px-5 rounded-full border transition-all duration-300 hover:scale-[1.02]"
                    style={{
                        backgroundColor: `${color}08`,
                        borderColor: `${color}22`,
                        boxShadow: `0 0 16px ${color}10`,
                    }}
                >
                    {showIcon && <Package size={15} style={{ color }} />}
                    <span className="text-sm font-bold tracking-wide" style={{ color }}>
                        {text}
                    </span>
                    {animate && (
                        <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ backgroundColor: color }} />
                    )}
                </div>
            )}

            {/* ── Minimal: Typography focused with accent line ── */}
            {style === 'minimal' && (
                <div className="flex items-center justify-center gap-3 py-2 w-full">
                    <div className="h-px flex-1 max-w-[30px] opacity-30" style={{ backgroundColor: color }} />
                    <div className="flex items-center gap-2">
                        {showIcon && (
                            <TrendingDown size={16} style={{ color }} className={animate ? 'animate-bounce' : ''} />
                        )}
                        <span className="text-sm font-bold tracking-wide" style={{ color }}>
                            {text}
                        </span>
                    </div>
                    <div className="h-px flex-1 max-w-[30px] opacity-30" style={{ backgroundColor: color }} />
                </div>
            )}

            {/* ── Progress: Animated bar with fraction ── */}
            {style === 'progress' && (
                <div
                    className="w-full p-4 border transition-all duration-300"
                    style={{
                        borderRadius,
                        borderColor: `${color}18`,
                        background: `linear-gradient(135deg, ${color}04 0%, ${color}08 100%)`,
                    }}
                >
                    <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                            {showIcon && <TrendingDown size={14} style={{ color }} />}
                            <span className="text-[10px] font-black text-gray-600 uppercase tracking-widest">
                                {isRTL ? 'الكمية المتبقية' : 'Stock restant'}
                            </span>
                        </div>
                        <span dir="ltr" className="text-xs font-mono font-bold" style={{ color }}>
                            {stockLeft}/{maxStock}
                        </span>
                    </div>
                    <div className="h-2 w-full rounded-full overflow-hidden bg-gray-100">
                        <div
                            className="h-full rounded-full transition-all duration-1000 ease-out relative"
                            style={{
                                width: `${progressPercent}%`,
                                background: `linear-gradient(90deg, ${color}, ${color}cc)`,
                            }}
                        >
                            <div className="absolute inset-0 bg-white/25 animate-[pulse_2s_infinite]" />
                        </div>
                    </div>
                    <p className="text-center text-[11px] font-medium mt-2.5 text-gray-500">
                        {text}
                    </p>
                </div>
            )}

            {/* ── Counter: Big number in a box ── */}
            {style === 'counter' && (
                <div
                    className="w-full flex items-center justify-center gap-4 p-4 border transition-all duration-300"
                    style={{
                        borderRadius,
                        background: `linear-gradient(135deg, ${color}04 0%, ${color}08 100%)`,
                        borderColor: `${color}18`,
                    }}
                >
                    <div
                        className="flex items-center justify-center w-12 h-12 rounded-xl bg-white border-2 shadow-sm"
                        style={{ borderColor: `${color}30` }}
                    >
                        <span className="text-2xl font-black font-mono" style={{ color }}>
                            {stockLeft}
                        </span>
                    </div>
                    <div className="flex flex-col">
                        <span className="text-sm font-bold tracking-wide" style={{ color }}>
                            {isRTL ? 'عناصر متبقية' : 'Articles restants'}
                        </span>
                        <span className="text-[11px] text-gray-400 font-medium mt-0.5">
                            {isRTL ? 'سارع قبل نفاد الكمية!' : 'Dépêchez-vous!'}
                        </span>
                    </div>
                </div>
            )}

            {/* ── Flame: Hot-demand alert widget ── */}
            {style === 'flame' && (
                <div
                    className="w-full flex items-center justify-between gap-3 p-3.5 border transition-all duration-300"
                    style={{
                        borderRadius,
                        background: `linear-gradient(135deg, ${color}06 0%, ${color}12 100%)`,
                        borderColor: `${color}20`,
                    }}
                >
                    <div className="flex items-center gap-2.5">
                        {showIcon && (
                            <div
                                className="p-2 rounded-lg bg-white shadow-sm border border-gray-100"
                            >
                                <Flame
                                    size={16}
                                    style={{ color }}
                                    className={animate ? 'animate-pulse' : ''}
                                />
                            </div>
                        )}
                        <span className="text-xs sm:text-sm font-bold text-gray-700">
                            {isRTL ? 'طلب مرتفع! بقى' : 'Forte demande! Reste'}
                        </span>
                    </div>
                    <div
                        className="px-3 py-1.5 rounded-lg font-black font-mono text-lg"
                        style={{
                            color,
                            backgroundColor: `${color}10`,
                        }}
                    >
                        {stockLeft}
                    </div>
                </div>
            )}

        </div>
    );
};
