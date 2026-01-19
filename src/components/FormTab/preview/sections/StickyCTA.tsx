/**
 * Sticky CTA Component
 * A modern, versatile sticky call-to-action that appears when the main CTA scrolls out of view
 * Supports multiple variants: simple, product, compact, card, badge
 */

import { Package, ShoppingCart, Zap } from 'lucide-react';
import React from 'react';

export interface StickyCTAProps {
    variant?: 'simple' | 'product' | 'compact' | 'card' | 'badge';
    visible: boolean;
    text: string;
    onClick: () => void;
    ctaStyles: React.CSSProperties;
    formBackground?: string;
    borderColor?: string;
    textColor?: string;
    accentColor?: string;
    // Product variant specific props
    productTitle?: string;
    productImage?: string;
    totalPrice?: string;
}

export const StickyCTA: React.FC<StickyCTAProps> = ({
    variant = 'simple',
    visible,
    text,
    onClick,
    ctaStyles,
    formBackground = '#ffffff',
    borderColor = '#e2e8f0',
    textColor = '#334155',
    accentColor = '#6366f1',
    productTitle,
    productImage,
    totalPrice,
}) => {
    if (!visible) return null;

    // Base styles - using absolute positioning to stay within the form container
    const baseContainerClass = "absolute bottom-0 left-0 right-0 z-50 transition-all duration-300 ease-out";
    const animationClass = "animate-in slide-in-from-bottom-4 duration-300";

    // Simple Variant - Full width button
    if (variant === 'simple') {
        return (
            <div
                className={`${baseContainerClass} ${animationClass}`}
                style={{
                    background: `linear-gradient(to top, ${formBackground} 0%, ${formBackground} 90%, ${formBackground}00 100%)`,
                    borderTop: `1px solid ${borderColor}`,
                    boxShadow: '0 -8px 24px -6px rgba(0,0,0,0.12)',
                }}
            >
                <div className="px-4 py-3.5">
                    <button
                        onClick={onClick}
                        className="w-full py-4 font-black text-sm uppercase tracking-widest flex items-center justify-center gap-3 transition-all duration-200 active:scale-[0.98] text-white hover:opacity-90 shadow-lg hover:shadow-xl"
                        style={ctaStyles}
                    >
                        {text}
                    </button>
                </div>
            </div>
        );
    }

    // Product Variant - Shows product info + button
    if (variant === 'product') {
        return (
            <div
                className={`${baseContainerClass} ${animationClass}`}
                style={{
                    background: `linear-gradient(to top, ${formBackground} 0%, ${formBackground} 95%, ${formBackground}dd 100%)`,
                    borderTop: `1px solid ${borderColor}20`,
                    boxShadow: '0 -8px 32px -8px rgba(0,0,0,0.15)',
                    backdropFilter: 'blur(12px)',
                }}
            >
                <div className="px-4 py-3.5">
                    <div className="flex items-center gap-3">
                        {/* Product Info (Left) */}
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                            <div
                                className="w-14 h-14 rounded-xl flex-shrink-0 flex items-center justify-center border-2 shadow-md transition-transform hover:scale-105"
                                style={{
                                    backgroundColor: `${accentColor}18`,
                                    borderColor: `${accentColor}40`,
                                    color: accentColor,
                                }}
                            >
                                <Package size={24} strokeWidth={2.5} />
                            </div>
                            <div className="flex flex-col min-w-0">
                                <span className="text-xs font-bold truncate leading-tight mb-0.5" style={{ color: textColor }}>
                                    {productTitle || 'Produit'}
                                </span>
                                <span className="text-base font-black" style={{ color: accentColor }}>
                                    {totalPrice}
                                </span>
                            </div>
                        </div>

                        {/* Button (Right) */}
                        <div className="flex-1 max-w-[140px]">
                            <button
                                onClick={onClick}
                                className="w-full py-3 px-4 font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all duration-200 active:scale-[0.98] text-white hover:opacity-90 shadow-lg hover:shadow-xl"
                                style={ctaStyles}
                            >
                                {text}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // Compact Variant - Minimal height
    if (variant === 'compact') {
        return (
            <div
                className={`${baseContainerClass} ${animationClass}`}
                style={{
                    background: `linear-gradient(to top, ${formBackground} 0%, ${formBackground} 92%, ${formBackground}00 100%)`,
                    borderTop: `1px solid ${borderColor}`,
                    boxShadow: '0 -6px 20px -4px rgba(0,0,0,0.1)',
                }}
            >
                <div className="px-4 py-2.5">
                    <button
                        onClick={onClick}
                        className="w-full py-3 font-bold text-xs uppercase tracking-wide flex items-center justify-center gap-2 transition-all duration-200 active:scale-[0.98] text-white hover:opacity-90 shadow-md hover:shadow-lg"
                        style={ctaStyles}
                    >
                        <ShoppingCart size={15} strokeWidth={3} />
                        <span className="font-black">{text}</span>
                    </button>
                </div>
            </div>
        );
    }

    // Card Variant - Card-style with padding and shadow
    if (variant === 'card') {
        return (
            <div
                className={`${baseContainerClass} ${animationClass} px-4 pb-4`}
                style={{ pointerEvents: 'none' }}
            >
                <div
                    className="rounded-2xl p-4 shadow-2xl backdrop-blur-sm"
                    style={{
                        background: `${formBackground}f5`,
                        border: `2px solid ${borderColor}`,
                        pointerEvents: 'auto',
                        boxShadow: '0 -10px 40px -12px rgba(0,0,0,0.2), 0 4px 6px -2px rgba(0,0,0,0.1)',
                    }}
                >
                    {productTitle && totalPrice && (
                        <div className="flex items-center justify-between mb-3 pb-3" style={{ borderBottom: `1px solid ${borderColor}` }}>
                            <span className="text-xs font-bold" style={{ color: textColor }}>
                                {productTitle}
                            </span>
                            <span className="text-sm font-black" style={{ color: accentColor }}>
                                {totalPrice}
                            </span>
                        </div>
                    )}
                    <button
                        onClick={onClick}
                        className="w-full py-4 font-black text-sm uppercase tracking-wider flex items-center justify-center gap-2 transition-all duration-200 active:scale-[0.98] text-white hover:opacity-90 shadow-xl hover:shadow-2xl"
                        style={ctaStyles}
                    >
                        {text}
                    </button>
                </div>
            </div>
        );
    }

    // Badge Variant - Small floating badge (positioned relative to container, not viewport)
    if (variant === 'badge') {
        return (
            <div
                className={`absolute bottom-6 right-6 z-50 ${animationClass}`}
            >
                <button
                    onClick={onClick}
                    className="px-6 py-3.5 font-black text-xs uppercase tracking-wider flex items-center gap-2 transition-all duration-200 hover:scale-110 active:scale-95 text-white shadow-2xl hover:shadow-[0_20px_50px_-12px_rgba(0,0,0,0.3)]"
                    style={{
                        ...ctaStyles,
                        borderRadius: '9999px',
                    }}
                >
                    <Zap size={16} fill="currentColor" strokeWidth={0} />
                    <span className="font-black">{text}</span>
                </button>
            </div>
        );
    }

    return null;
};
