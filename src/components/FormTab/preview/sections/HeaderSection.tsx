/**
 * Header Section Component
 * Renders the form header with multiple style variants
 */

import { buildHeaderStyles } from '@/lib/utils/cssEngine';
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
        borderRadius?: string;
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
    productTitle?: string;
    productImage?: string;
}

export const HeaderSection: React.FC<HeaderSectionProps> = ({
    config,
    lang,
    onLanguageToggle,
    formatCurrency,
    basePrice,
    productTitle = 'Produit Demo', // Fallback
    productImage: imageUrl,
}) => {
    if (config.header?.enabled === false) return null;

    const headerStyle = config.header?.style || 'classic';

    // Language switcher button
    const langBtn = config.header?.showLanguageSwitcher !== false ? (
        <button
            onClick={onLanguageToggle}
            className="w-9 h-9 text-[11px] font-black border-2 transition-all flex items-center justify-center hover:opacity-80"
            style={{
                borderColor: config.inputBorderColor || '#e2e8f0',
                color: config.textColor || '#64748b',
                backgroundColor: config.formBackground || '#ffffff',
                borderRadius: config.borderRadius || '8px',
            }}
        >
            {lang === 'fr' ? 'ع' : 'FR'}
        </button>
    ) : <div className="w-9" />;

    // Product image (without sticker)
    const renderImage = () => {
        if (config.header?.showProductImage === false) return null;

        return (
            <div
                className="w-12 h-12 rounded-xl border-2 flex items-center justify-center shadow-sm relative overflow-hidden bg-white"
                style={{
                    color: config.accentColor,
                    borderColor: config.inputBorderColor || '#e2e8f0',
                    backgroundColor: config.formBackground || '#ffffff',
                }}
            >
                {imageUrl ? (
                    <img src={imageUrl} alt={productTitle} className="w-full h-full object-cover" />
                ) : (
                    <Package size={22} />
                )}
            </div>
        );
    };

    const productImage = renderImage();

    // Helper to render inline badge
    const renderBadge = (isWhite = false) => {
        if (!config.stickers?.product?.enabled) return null;
        return (
            <span
                className="px-1.5 py-0.5 text-[9px] font-black uppercase tracking-tight rounded-md shadow-sm"
                style={{
                    backgroundColor: config.stickers.product.color || '#ef4444',
                    color: isWhite ? config.stickers.product.color : '#ffffff' // Usually white text on badge color, but user might want inversion? Defaulting to white on badge color.
                }}
            >
                {config.stickers.product.text?.[lang] || config.stickers.product.text?.fr || 'Best'}
            </span>
        );
    };

    // Product info (Classic)
    const productInfo = (
        <div>
            <div className="flex items-center flex-wrap gap-2 mb-0.5">
                <h3
                    className="text-sm font-bold leading-tight"
                    style={{ color: config.headingColor || config.textColor || '#0f172a' }}
                >
                    {productTitle}
                </h3>
                {renderBadge(false)}
            </div>
            {config.header?.showProductPrice !== false && (
                <span className="text-sm font-black" style={{ color: config.accentColor }}>
                    {formatCurrency(basePrice)}
                </span>
            )}
        </div>
    );

    // Common header wrapper styles
    const headerBaseStyles = buildHeaderStyles(config as any, headerStyle);

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
                <div className="absolute top-4 right-4 z-30">{langBtn}</div>
                <div className="flex flex-col items-center text-center gap-2">
                    {productImage}
                    <div>
                        <div className="flex items-center justify-center gap-2 mb-0.5">
                            <h3
                                className="text-sm font-bold leading-tight"
                                style={{ color: config.headingColor || config.textColor || '#0f172a' }}
                            >
                                {productTitle}
                            </h3>
                            {renderBadge(false)}
                        </div>
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
                    <div className="flex items-center gap-2">
                        <h3
                            className="text-base font-bold leading-tight"
                            style={{ color: config.headingColor || config.textColor || '#0f172a' }}
                        >
                            {productTitle}
                        </h3>
                        {renderBadge(false)}
                    </div>
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
                    ...headerBaseStyles,
                    // Banner specific overrides are handled in buildHeaderStyles, but we need shadow here if not in base
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
                        <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center relative overflow-hidden">
                            {imageUrl ? (
                                <img src={imageUrl} alt={productTitle} className="w-full h-full object-cover" />
                            ) : (
                                <Package size={22} className="text-white" />
                            )}
                        </div>
                    )}
                    <div>
                        <div className="flex items-center gap-2 mb-0.5">
                            <h3 className="text-sm font-bold leading-tight text-white">{productTitle}</h3>
                            {renderBadge(true)}
                        </div>
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
                            className="w-8 h-8 rounded-lg flex items-center justify-center overflow-hidden"
                            style={{ backgroundColor: `${config.accentColor}15`, color: config.accentColor }}
                        >
                            {imageUrl ? (
                                <img src={imageUrl} alt={productTitle} className="w-full h-full object-cover" />
                            ) : (
                                <Package size={16} />
                            )}
                        </div>
                    )}
                    <span className="text-xs font-bold" style={{ color: config.textColor || '#334155' }}>
                        {productTitle}
                    </span>
                    {renderBadge(false)}
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
