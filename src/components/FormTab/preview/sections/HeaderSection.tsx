/**
 * Header Section Component
 * Renders the form header with multiple style variants
 */

import { buildHeaderStyles } from '@/lib/utils/cssEngine';
import type { Language } from '@/types';
import { Package } from 'lucide-react';
import React from 'react';
import { priceToLetters } from '../../../../lib/utils/priceToLetters';

interface HeaderSectionProps {
    config: {
        header?: {
            enabled?: boolean;
            style?: 'classic' | 'centered' | 'minimal' | 'banner' | 'compact' | 'hidden';
            showLanguageSwitcher?: boolean;
            showProductImage?: boolean;
            showProductPrice?: boolean;
            priceInLetters?: {
                enabled: boolean;
                mode: 'dinars' | 'centimes';
            };
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
                textColor?: string;
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

    // Helper: Dynamic Title Font Size
    const getTitleSizeClass = (text: string, isCompact = false) => {
        const len = text.length;
        if (isCompact) {
            if (len < 25) return 'text-sm';
            return 'text-xs';
        }
        if (len < 25) return 'text-base';
        if (len < 60) return 'text-sm';
        return 'text-xs';
    };

    // Helper to render badge (Seal Style - Bottom Center)
    const renderBadge = (isInline = false) => {
        if (!config.stickers?.product?.enabled) return null;

        const textColor = config.stickers.product.textColor || '#ffffff';

        if (isInline) {
            return (
                <span
                    className="px-2 py-0.5 text-[10px] font-black uppercase tracking-tight rounded-full shadow-sm ml-2 relative overflow-hidden isolate whitespace-nowrap bg-white/10 backdrop-blur-md border border-white/20"
                    style={{
                        backgroundColor: config.stickers.product.color || '#ef4444',
                        color: textColor
                    }}
                >
                    <span className="relative z-10">{config.stickers.product.text?.[lang] || config.stickers.product.text?.fr || 'Best'}</span>
                    <div className="absolute inset-0 bg-white/20 animate-[shimmer_2s_infinite] -translate-x-full"></div>
                </span>
            );
        }

        return (
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 z-30 pointer-events-none">
                <span
                    className="flex items-center justify-center px-3 py-1 text-[10px] font-black uppercase tracking-tight rounded-full shadow-sm relative overflow-hidden isolate whitespace-nowrap ring-4"
                    style={{
                        backgroundColor: config.stickers.product.color || '#ef4444',
                        color: textColor,
                        ["--tw-ring-color" as any]: config.formBackground || '#ffffff'
                    }}
                >
                    <span className="relative z-10">{config.stickers.product.text?.[lang] || config.stickers.product.text?.fr || 'Best'}</span>
                    <div className="absolute inset-0 bg-white/20 animate-[shimmer_2s_infinite] -translate-x-full"></div>
                </span>
            </div>
        );
    };

    // Product info (Classic)
    const productInfo = (
        <div className="flex-1 min-w-0">
            <div className="flex items-center flex-wrap gap-x-2 gap-y-1 mb-0.5">
                <h3
                    className={`${getTitleSizeClass(productTitle)} font-bold leading-tight break-words`}
                    style={{ color: config.headingColor || config.textColor || '#0f172a' }}
                >
                    {productTitle}
                </h3>
            </div>
            {config.header?.showProductPrice !== false && (
                <div className="flex flex-col">
                    <span className="text-sm font-black block" style={{ color: config.accentColor }}>
                        {formatCurrency(basePrice)}
                    </span>
                    {(config as any).header?.priceInLetters?.enabled && (
                        <span className="text-[10px] text-gray-500 font-medium -mt-0.5 capitalize">
                            {priceToLetters(basePrice, lang, (config as any).header.priceInLetters.mode)}
                        </span>
                    )}
                </div>
            )}
        </div>
    );

    // Common header wrapper styles (Enhanced)
    const headerBaseStyles = buildHeaderStyles(config as any, headerStyle);

    // Language Switcher Helper (Inline)
    const LangSwitcher = ({ isBanner = false }) => {
        if (config.header?.showLanguageSwitcher === false) return null;
        return (
            <button
                onClick={onLanguageToggle}
                className={`w-9 h-9 text-[11px] font-black border-2 transition-all flex items-center justify-center hover:opacity-80 shadow-sm shrink-0 ${isBanner ? 'rounded-lg border-white/30 text-white/90 hover:bg-white/10' : 'rounded-lg'
                    }`}
                style={!isBanner ? {
                    borderColor: config.inputBorderColor || '#e2e8f0',
                    color: config.textColor || '#64748b',
                    backgroundColor: config.formBackground || '#ffffff',
                } : {}}
            >
                {lang === 'fr' ? 'ع' : 'FR'}
            </button>
        );
    };

    // Classic style
    if (headerStyle === 'classic') {
        return (
            <div
                className="relative z-20 flex items-center gap-4 p-5 border-b shadow-sm"
                style={headerBaseStyles}
            >
                <div className="flex items-center gap-4 flex-row w-full">
                    {productImage}
                    {productInfo}
                </div>
                <LangSwitcher />
                {renderBadge()}
            </div>
        );
    }

    // Centered style
    if (headerStyle === 'centered') {
        return (
            <div className="relative z-20 p-6 border-b shadow-sm" style={headerBaseStyles}>
                <div className="absolute top-4 right-4 z-30">
                    <LangSwitcher />
                </div>
                <div className="flex flex-col items-center text-center gap-3 px-8">
                    {productImage}
                    <div>
                        <div className="flex flex-wrap justify-center items-center gap-x-2 gap-y-1 mb-1">
                            <h3
                                className={`${getTitleSizeClass(productTitle)} font-bold leading-tight`}
                                style={{ color: config.headingColor || config.textColor || '#0f172a' }}
                            >
                                {productTitle}
                            </h3>
                        </div>
                        {config.header?.showProductPrice !== false && (
                            <div className="flex flex-col items-center">
                                <span className="text-sm font-black" style={{ color: config.accentColor }}>
                                    {formatCurrency(basePrice)}
                                </span>
                                {(config as any).header?.priceInLetters?.enabled && (
                                    <span className="text-[10px] text-gray-500 font-medium -mt-0.5 capitalize">
                                        {priceToLetters(basePrice, lang, (config as any).header.priceInLetters.mode)}
                                    </span>
                                )}
                            </div>
                        )}
                    </div>
                </div>
                {renderBadge()}
            </div>
        );
    }

    // Minimal style
    if (headerStyle === 'minimal') {
        return (
            <div
                className="relative z-20 flex items-center justify-between p-5 border-b"
                style={headerBaseStyles}
            >
                <div className="flex-1 min-w-0 pr-4">
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                        <h3
                            className={`${getTitleSizeClass(productTitle)} font-bold leading-tight`}
                            style={{ color: config.headingColor || config.textColor || '#0f172a' }}
                        >
                            {productTitle}
                        </h3>
                    </div>
                </div>
                <div className="flex flex-col items-end gap-0.5 shrink-0">
                    <div className="flex items-center gap-3">
                        {config.header?.showProductPrice !== false && (
                            <span className="text-lg font-black" style={{ color: config.accentColor }}>
                                {formatCurrency(basePrice)}
                            </span>
                        )}
                        <LangSwitcher />
                    </div>
                    {config.header?.showProductPrice !== false && (config as any).header?.priceInLetters?.enabled && (
                        <span className="text-[10px] text-gray-500 font-medium mr-12 capitalize">
                            {priceToLetters(basePrice, lang, (config as any).header.priceInLetters.mode)}
                        </span>
                    )}
                </div>
                {renderBadge()}
            </div>
        );
    }

    // Banner style (Keeps badge inline for now as it has no bottom border usually, or we can force it bottom if user wants 'seal' effect everywhere. But inline feels safer for banner context)
    // Actually, let's keep it inline for Banner as per plan notes, to avoid it looking floating on nothing if shadow is subtle.
    if (headerStyle === 'banner') {
        return (
            <div
                className="relative z-20 p-5 shadow-lg"
                style={{
                    ...headerBaseStyles,
                    color: '#ffffff',
                }}
            >
                <div className="absolute top-4 right-4 z-30">
                    <LangSwitcher isBanner={true} />
                </div>

                <div className="flex items-center gap-4 pr-10">
                    {config.header?.showProductImage !== false && (
                        <div className="w-14 h-14 rounded-xl bg-white/20 flex items-center justify-center relative overflow-hidden backdrop-blur-sm border border-white/10 shrink-0">
                            {imageUrl ? (
                                <img src={imageUrl} alt={productTitle} className="w-full h-full object-cover" />
                            ) : (
                                <Package size={24} className="text-white" />
                            )}
                        </div>
                    )}
                    <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mb-1">
                            <h3 className={`${getTitleSizeClass(productTitle)} font-bold leading-tight text-white`}>{productTitle}</h3>
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
                className="relative z-20 flex items-center justify-between px-4 py-3 border-b bg-slate-50/50"
                style={headerBaseStyles}
            >
                <div className="flex items-center gap-3 flex-1 min-w-0 pr-2">
                    {config.header?.showProductImage !== false && (
                        <div
                            className="w-9 h-9 rounded-lg flex items-center justify-center overflow-hidden shadow-sm border shrink-0"
                            style={{
                                backgroundColor: config.formBackground || '#ffffff',
                                borderColor: config.inputBorderColor || '#e2e8f0',
                                color: config.accentColor
                            }}
                        >
                            {imageUrl ? (
                                <img src={imageUrl} alt={productTitle} className="w-full h-full object-cover" />
                            ) : (
                                <Package size={18} />
                            )}
                        </div>
                    )}
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                        <span className={`${getTitleSizeClass(productTitle, true)} font-bold truncate`} style={{ color: config.textColor || '#334155' }}>
                            {productTitle}
                        </span>
                    </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                    {config.header?.showProductPrice !== false && (
                        <span className="text-xs font-black" style={{ color: config.accentColor }}>
                            {formatCurrency(basePrice)}
                        </span>
                    )}
                    <LangSwitcher />
                </div>
                {renderBadge()}
            </div>
        );
    }

    // Hidden style - only language switcher
    if (headerStyle === 'hidden') {
        return (
            <div className="relative z-50">
                <div className="absolute top-4 right-4 z-30">
                    <LangSwitcher />
                </div>
            </div>
        );
    }

    // Default fallback to classic
    return (
        <div
            className="relative z-20 flex items-center gap-4 p-5 border-b shadow-sm"
            style={headerBaseStyles}
        >
            <div className="flex items-center gap-4 flex-row w-full pr-8">
                {productImage}
                {productInfo}
            </div>
            <LangSwitcher />
            {renderBadge()}
        </div>
    );
};
