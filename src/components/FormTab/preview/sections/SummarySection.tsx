/**
 * Summary Section Component
 * Displays order summary with subtotal, shipping, discounts, and total
 */

import { buildTextStyles } from '@/lib/utils/cssEngine';
import type { Language } from '@/types';
import { TrendingDown } from 'lucide-react';
import React from 'react';
import { priceToLetters } from '../../../../lib/utils/priceToLetters';
import { SectionLabel } from '../components/SectionLabel';
import type { FormConfig } from '@/types/form';

interface SummarySectionProps {
    config: FormConfig;
    lang: Language;
    offerPrice: number;
    shippingCost: number;
    promoDiscount: {
        subtotalDiscount: number;
        shippingDiscount: number;
        totalDiscount: number;
    };
    totalPromoDiscount: number;
    displayedTotal: number;
    appliedPromoCode: { code: string } | null;
    formatCurrency: (amount: number) => string;
    marginStyle?: React.CSSProperties;
    isBasicTheme?: boolean;
}

export const SummarySection: React.FC<SummarySectionProps> = ({
    config,
    lang,
    offerPrice,
    shippingCost,
    promoDiscount,
    totalPromoDiscount,
    displayedTotal,
    appliedPromoCode,
    formatCurrency,
    marginStyle,
    isBasicTheme = false,
}) => {
    const txt = (key: string) =>
        config.translations[key]?.[lang] || config.translations[key]?.fr || '';

    const effectiveShipping = shippingCost - promoDiscount.shippingDiscount;

    if (isBasicTheme) {
        return (
            <div style={{ marginBottom: '1rem', borderTop: '1px solid #ccc', paddingTop: '0.5rem', ...marginStyle }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <strong>{txt('total')}</strong>
                    <strong>{formatCurrency(displayedTotal)}</strong>
                </div>
            </div>
        );
    }

    return (
        <div style={marginStyle}>
            {config.sectionSettings?.summary?.showTitle !== false && (
                <SectionLabel accentColor={config.accentColor}>{txt('subtotal')}</SectionLabel>
            )}

            <div
                className="p-4 border rounded-xl space-y-2"
                style={{ borderColor: `${config.accentColor}20`, borderRadius: config.borderRadius }}
            >
                {/* Subtotal row */}
                <div className="flex justify-between text-sm">
                    <span style={buildTextStyles(config as any, 'body')}>{txt('subtotal')}</span>
                    <span className="font-bold" style={buildTextStyles(config as any, 'heading')}>
                        {promoDiscount.subtotalDiscount > 0 ? (
                            <>
                                <span className="line-through text-gray-400 mr-2">
                                    {formatCurrency(offerPrice)}
                                </span>
                                {formatCurrency(Math.max(0, offerPrice - promoDiscount.subtotalDiscount))}
                            </>
                        ) : (
                            formatCurrency(Math.max(0, offerPrice))
                        )}
                    </span>
                </div>

                {/* Shipping row (if not hidden) */}
                {!config.hideShippingInSummary && (
                    <div className="flex justify-between text-sm">
                        <span style={buildTextStyles(config as any, 'body')}>{txt('shippingLabel')}</span>
                        <span className="font-bold" style={buildTextStyles(config as any, 'heading')}>
                            {promoDiscount.shippingDiscount > 0 ? (
                                effectiveShipping <= 0 ? (
                                    <span className="text-emerald-600">{txt('free')}</span>
                                ) : (
                                    <>
                                        <span className="line-through text-gray-400 mr-2">
                                            {formatCurrency(shippingCost)}
                                        </span>
                                        {formatCurrency(effectiveShipping)}
                                    </>
                                )
                            ) : shippingCost === 0 ? (
                                <span className="text-emerald-600">{txt('free')}</span>
                            ) : (
                                formatCurrency(shippingCost)
                            )}
                        </span>
                    </div>
                )}

                {/* Promo discount row */}
                {appliedPromoCode && totalPromoDiscount > 0 && (
                    <div className="flex justify-between text-sm">
                        <span className="flex items-center gap-1 text-emerald-600">
                            <TrendingDown size={14} />
                            {appliedPromoCode.code}
                        </span>
                        <span className="font-bold text-emerald-600">
                            -{formatCurrency(totalPromoDiscount)}
                        </span>
                    </div>
                )}

                {/* Divider */}
                <div className="border-t" style={{ borderColor: `${config.accentColor}10` }} />

                {/* Total row */}
                <div className="flex justify-between items-center">
                    <span className="text-lg font-black" style={buildTextStyles(config as any, 'heading')}>
                        {txt('total')}
                    </span>
                    <div className="flex flex-col items-end">
                        <span
                            className="text-2xl font-black"
                            style={{ color: config.accentColor }}
                        >
                            {formatCurrency(displayedTotal)}
                        </span>
                        {(config as any).sectionSettings?.summary?.priceInLetters?.enabled && (
                            <span className="text-[10px] font-medium italic opacity-70 capitalize mt-0.5" style={{ color: config.textColor || '#64748b' }}>
                                {priceToLetters(displayedTotal, lang, (config as any).sectionSettings.summary.priceInLetters.mode)}
                            </span>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};
