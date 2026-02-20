/**
 * Promo Code Section Component
 * Displays promo code input with validation
 */

import { buildInputStyles } from '@/lib/utils/cssEngine';
import type { Language } from '@/types';
import { Check, X } from 'lucide-react';
import React from 'react';
import { SectionLabel } from '../components/SectionLabel';
import type { FormConfig } from '@/types/form';

interface PromoCodeSectionProps {
    config: FormConfig;
    lang: Language;
    promoCodeInput: string;
    setPromoCodeInput: (value: string) => void;
    promoCodeError: boolean;
    promoCodeSuccess: boolean;
    appliedPromoCode: { code: string } | null;
    onApply: () => void;
    onRemove: () => void;
    marginStyle?: React.CSSProperties;
}

export const PromoCodeSection: React.FC<PromoCodeSectionProps> = ({
    config,
    lang,
    promoCodeInput,
    setPromoCodeInput,
    promoCodeError,
    promoCodeSuccess,
    appliedPromoCode,
    onApply,
    onRemove,
    marginStyle,
}) => {
    if (!config.promoCode?.enabled) return null;

    const txt = (key: string) =>
        config.translations[key]?.[lang] || config.translations[key]?.fr || '';

    const promoConfig = config.promoCode;
    const placeholder = promoConfig?.placeholder?.[lang] || promoConfig?.placeholder?.fr || 'Code promo';
    const buttonText = promoConfig?.buttonText?.[lang] || promoConfig?.buttonText?.fr || 'Appliquer';

    return (
        <div style={marginStyle}>
            {config.sectionSettings?.promoCode?.showTitle !== false && (
                <SectionLabel accentColor={config.accentColor}>{txt('promoCode')}</SectionLabel>
            )}

            {/* Applied promo code display */}
            {appliedPromoCode ? (
                <div
                    className="flex items-center justify-between p-3 border-2 rounded-xl"
                    style={{
                        borderColor: '#10b981',
                        backgroundColor: '#10b98110',
                        borderRadius: config.borderRadius,
                    }}
                >
                    <div className="flex items-center gap-2">
                        <Check size={16} className="text-emerald-600" />
                        <span className="text-sm font-bold text-emerald-700">{appliedPromoCode.code}</span>
                    </div>
                    <button
                        type="button"
                        onClick={onRemove}
                        className="w-6 h-6 rounded-full flex items-center justify-center hover:bg-red-100 transition-colors"
                    >
                        <X size={14} className="text-red-500" />
                    </button>
                </div>
            ) : (
                <div className="flex gap-2">
                    <div className="flex-1 relative">
                        <input
                            type="text"
                            value={promoCodeInput}
                            onChange={(e) => setPromoCodeInput(e.target.value)}
                            placeholder={placeholder}
                            className={`w-full px-4 py-3 text-sm font-semibold border-2 outline-none transition-all ${promoCodeError ? 'border-red-400 bg-red-50' : ''
                                }`}
                            style={{
                                ...buildInputStyles(config as unknown, 'filled'),
                                marginBottom: 0, // Override default margin
                                // Error state override
                                ...(promoCodeError ? {
                                    borderColor: '#f87171',
                                    backgroundColor: '#fef2f2'
                                } : {})
                            }}
                            onKeyDown={(e) => e.key === 'Enter' && onApply()}
                        />
                    </div>
                    <button
                        type="button"
                        onClick={onApply}
                        className="px-4 py-3 text-sm font-bold text-white transition-all hover:opacity-90"
                        style={{
                            backgroundColor: config.accentColor,
                            borderRadius: config.borderRadius,
                        }}
                    >
                        {buttonText}
                    </button>
                </div>
            )}

            {/* Error message */}
            {promoCodeError && !appliedPromoCode && (
                <p className="text-xs text-red-500 mt-1.5 font-medium">
                    {promoConfig?.errorText?.[lang] || promoConfig?.errorText?.fr || 'Code invalide'}
                </p>
            )}
        </div>
    );
};
