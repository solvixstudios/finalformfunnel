/**
 * Header Section Component
 * Renders the form header with multiple style variants
 */

import type { Language } from '@/types';
import { Package } from 'lucide-react';
import React from 'react';

interface HeaderSectionProps {
    config: {
        header?: {
            enabled?: boolean;
            style?: 'classic' | 'centered' | 'minimal' | 'banner' | 'compact' | 'hidden';
            showLanguageSwitcher?: boolean;
            showProductImage?: boolean;
            showProductPrice?: boolean;
        };
        accentColor: string;
        formBackground?: string;
        inputBorderColor?: string;
        textColor?: string;
        headingColor?: string;
        stickers?: {
            product?: {
                enabled: boolean;
                color?: string;
                text?: { fr?: string; ar?: string };
            };
        };
    };
    lang: Language;
    onLanguageToggle: () => void;
    formatCurrency: (amount: number) => string;
    basePrice: number;
}

export const HeaderSection: React.FC<HeaderSectionProps> = ({
    config,
    lang,
    onLanguageToggle,
    formatCurrency,
    basePrice,
}) => {
    if (config.header?.enabled === false) return null;

    const headerStyle = config.header?.style || 'classic';

    // Language switcher button
    const langBtn = config.header?.showLanguageSwitcher !== false ? (
        <button
            onClick={onLanguageToggle}
            className="w-9 h-9 rounded-lg text-[11px] font-black border-2 transition-all flex items-center justify-center"
            style={{
                borderColor: config.inputBorderColor || '#e2e8f0',
                color: config.textColor || '#64748b',
                backgroundColor: config.formBackground || '#ffffff',
            }}
        >
            {lang === 'fr' ? 'ع' : 'FR'}
        </button>
    ) : <div className="w-9" />;

    // Product image with optional sticker
    const productImage = config.header?.showProductImage !== false && (
        <div
            className="w-12 h-12 rounded-xl border-2 flex items-center justify-center shadow-sm relative"
            style={{
                color: config.accentColor,
                borderColor: config.inputBorderColor || '#e2e8f0',
                backgroundColor: config.formBackground || '#ffffff',
            }}
        >
            <Package size={22} />
            {config.stickers?.product?.enabled && (
                <div
                    className={`absolute -top-2 ${lang === 'ar' ? '-left-2' : '-right-2'} px-1.5 py-0.5 text-[8px] font-black text-white uppercase tracking-tight rounded-md shadow-sm`}
                    style={{ backgroundColor: config.stickers.product.color || '#ef4444' }}
                >
                    {config.stickers.product.text?.[lang] || config.stickers.product.text?.fr || 'Best'}
                </div>
            )}
        </div>
    );

    // Product info
    const productInfo = (
        <div>
            <h3
                className="text-sm font-bold leading-tight mb-0.5"
                style={{ color: config.headingColor || config.textColor || '#0f172a' }}
            >
                Produit Demo
            </h3>
            {config.header?.showProductPrice !== false && (
                <span className="text-sm font-black" style={{ color: config.accentColor }}>
                    {formatCurrency(basePrice)}
                </span>
            )}
        </div>
    );

    // Common header wrapper styles
    const headerBaseStyles = {
        borderRadius: '16px 16px 0 0',
        backgroundColor: config.formBackground || '#ffffff',
        borderColor: config.inputBorderColor || `${config.accentColor}15`,
    };

    // Classic style
    if (headerStyle === 'classic') {
        return (
            <div
                className="relative z-20 flex flex-row-reverse items-center justify-between p-4 border-b shadow-sm"
                style={headerBaseStyles}
            >
                {langBtn}
                <div className="flex items-center gap-3 flex-row">
                    {productImage}
                    {productInfo}
                </div>
            </div>
        );
    }

    // Centered style
    if (headerStyle === 'centered') {
        return (
            <div className="relative z-20 p-4 border-b shadow-sm" style={headerBaseStyles}>
                <div className="absolute top-4 right-4">{langBtn}</div>
                <div className="flex flex-col items-center text-center gap-2">
                    {productImage}
                    <div>
                        <h3
                            className="text-sm font-bold leading-tight mb-0.5"
                            style={{ color: config.headingColor || config.textColor || '#0f172a' }}
                        >
                            Produit Demo
                        </h3>
                        {config.header?.showProductPrice !== false && (
                            <span className="text-sm font-black" style={{ color: config.accentColor }}>
                                {formatCurrency(basePrice)}
                            </span>
                        )}
                    </div>
                </div>
            </div>
        );
    }

    // Minimal style
    if (headerStyle === 'minimal') {
        return (
            <div
                className="relative z-20 flex items-center justify-between p-4 border-b"
                style={headerBaseStyles}
            >
                <div>
                    <h3
                        className="text-base font-bold leading-tight"
                        style={{ color: config.headingColor || config.textColor || '#0f172a' }}
                    >
                        Produit Demo
                    </h3>
                </div>
                <div className="flex items-center gap-3">
                    {config.header?.showProductPrice !== false && (
                        <span className="text-lg font-black" style={{ color: config.accentColor }}>
                            {formatCurrency(basePrice)}
                        </span>
                    )}
                    {langBtn}
                </div>
            </div>
        );
    }

    // Banner style
    if (headerStyle === 'banner') {
        return (
            <div
                className="relative z-20 p-4 shadow-lg"
                style={{
                    borderRadius: '16px 16px 0 0',
                    backgroundColor: config.accentColor,
                    color: '#ffffff',
                }}
            >
                <div className="absolute top-4 right-4">
                    <button
                        onClick={onLanguageToggle}
                        className="w-9 h-9 rounded-lg text-[11px] font-black border-2 border-white/30 text-white/90 hover:bg-white/10 transition-all flex items-center justify-center"
                    >
                        {lang === 'fr' ? 'ع' : 'FR'}
                    </button>
                </div>
                <div className="flex items-center gap-3">
                    {config.header?.showProductImage !== false && (
                        <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center relative">
                            <Package size={22} className="text-white" />
                        </div>
                    )}
                    <div>
                        <h3 className="text-sm font-bold leading-tight mb-0.5 text-white">Produit Demo</h3>
                        {config.header?.showProductPrice !== false && (
                            <span className="text-sm font-black text-white/90">{formatCurrency(basePrice)}</span>
                        )}
                    </div>
                </div>
            </div>
        );
    }

    // Compact style
    if (headerStyle === 'compact') {
        return (
            <div
                className="relative z-20 flex items-center justify-between px-4 py-2 border-b"
                style={headerBaseStyles}
            >
                <div className="flex items-center gap-2">
                    {config.header?.showProductImage !== false && (
                        <div
                            className="w-8 h-8 rounded-lg flex items-center justify-center"
                            style={{ backgroundColor: `${config.accentColor}15`, color: config.accentColor }}
                        >
                            <Package size={16} />
                        </div>
                    )}
                    <span className="text-xs font-bold" style={{ color: config.textColor || '#334155' }}>
                        Produit Demo
                    </span>
                </div>
                <div className="flex items-center gap-2">
                    {config.header?.showProductPrice !== false && (
                        <span className="text-xs font-black" style={{ color: config.accentColor }}>
                            {formatCurrency(basePrice)}
                        </span>
                    )}
                    <button
                        onClick={onLanguageToggle}
                        className="w-7 h-7 rounded text-[10px] font-black border transition-all flex items-center justify-center"
                        style={{
                            borderColor: config.inputBorderColor || '#e2e8f0',
                            color: config.textColor || '#64748b',
                        }}
                    >
                        {lang === 'fr' ? 'ع' : 'FR'}
                    </button>
                </div>
            </div>
        );
    }

    // Hidden style - only language switcher
    if (headerStyle === 'hidden') {
        return (
            <div className="relative z-50">
                <div className={`absolute top-4 ${lang === 'ar' ? 'left-4' : 'right-4'}`}>{langBtn}</div>
            </div>
        );
    }

    // Default fallback to classic
    return (
        <div
            className="relative z-20 flex flex-row-reverse items-center justify-between p-4 border-b shadow-sm"
            style={headerBaseStyles}
        >
            {langBtn}
            <div className="flex items-center gap-3 flex-row">
                {productImage}
                {productInfo}
            </div>
        </div>
    );
};
