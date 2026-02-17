/**
 * Offers Section Component
 * Displays offer selection with pricing and stickers
 */

import { buildOptionCardStyles } from '@/lib/utils/cssEngine';
import type { Language } from '@/types';
import { Check } from 'lucide-react';
import React from 'react';
import { SectionLabel } from '../components/SectionLabel';

interface Offer {
    id: string;
    qty: number;
    discount: number;
    _type: 'perc' | 'fixed';
    title: { fr?: string; ar?: string };
    desc: { fr?: string; ar?: string };
    sticker?: {
        enabled?: boolean;
        color?: string;
        text?: { fr?: string; ar?: string };
    };
}

interface OffersSectionProps {
    config: {
        accentColor: string;
        textColor?: string;
        headingColor?: string;
        borderRadius: string;
        inputBorderColor?: string;
        formBackground?: string;
        enableOffersSection?: boolean;
        sectionSettings?: {
            offers?: { showTitle?: boolean };
        };
        translations: {
            offers?: { fr: string; ar: string };
            [key: string]: any;
        };
    };
    lang: Language;
    offers: Offer[];
    selectedOfferId: string;
    onSelect: (offerId: string) => void;
    formatCurrency: (amount: number) => string;
    basePrice: number;
    marginStyle?: React.CSSProperties;
}

export const OffersSection: React.FC<OffersSectionProps> = ({
    config,
    lang,
    offers,
    selectedOfferId,
    onSelect,
    formatCurrency,
    basePrice,
    marginStyle,
}) => {
    if (!offers || offers.length === 0 || config.enableOffersSection === false) return null;

    const txt = (key: string) =>
        config.translations[key]?.[lang] || config.translations[key]?.fr || '';

    return (
        <div style={marginStyle}>
            {config.sectionSettings?.offers?.showTitle && (
                <SectionLabel accentColor={config.accentColor}>{txt('offers')}</SectionLabel>
            )}

            <div className="space-y-2">
                {offers.map((o) => {
                    const isSelected = selectedOfferId === o.id;
                    // Calculate price (never negative)
                    const discountFactor = o._type === 'perc' ? o.discount / 100 : 0;
                    const rawPrice =
                        o._type === 'perc'
                            ? basePrice * o.qty * (1 - discountFactor)
                            : basePrice * o.qty - o.discount;
                    const price = Math.max(0, rawPrice);
                    const titleText = o.title[lang] || o.title.fr || '';
                    const descText = o.desc[lang] || o.desc.fr || '';

                    return (
                        <button
                            key={o.id}
                            onClick={() => onSelect(o.id)}
                            className={`relative w-full p-4 border-2 flex items-center gap-4 transition-all duration-200 ${isSelected ? 'shadow-lg' : ''
                                }`}

                            style={buildOptionCardStyles(config as any, { selected: isSelected })}
                        >
                            {/* Offer Sticker */}
                            {o.sticker?.enabled && (
                                <span
                                    className={`absolute -top-2 ${lang === 'ar' ? 'left-4' : 'right-4'
                                        } px-2 py-0.5 text-[9px] font-black text-white uppercase rounded-md shadow-sm`}
                                    style={{ backgroundColor: o.sticker.color || '#ef4444' }}
                                >
                                    {o.sticker.text?.[lang] || o.sticker.text?.fr || ''}
                                </span>
                            )}

                            {/* Selection radio */}
                            <div
                                className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all ${isSelected ? 'border-white bg-white/20' : ''
                                    }`}
                                style={{
                                    borderColor: isSelected ? undefined : config.inputBorderColor || '#e2e8f0',
                                }}
                            >
                                {isSelected && <Check size={10} strokeWidth={4} className="text-white" />}
                            </div>

                            {/* Offer details */}
                            <div className={`flex-1 ${lang === 'ar' ? 'text-right' : 'text-left'} min-w-0`}>
                                <div
                                    className="text-sm font-bold leading-tight"
                                    style={{
                                        color: isSelected
                                            ? '#ffffff'
                                            : config.headingColor || config.textColor || '#1e293b',
                                    }}
                                >
                                    {titleText}
                                </div>
                                {descText && (
                                    <div
                                        className="text-xs leading-tight mt-0.5"
                                        style={{
                                            color: isSelected
                                                ? 'rgba(255,255,255,0.7)'
                                                : config.textColor
                                                    ? `${config.textColor}99`
                                                    : '#94a3b8',
                                        }}
                                    >
                                        {descText}
                                    </div>
                                )}
                            </div>

                            {/* Price */}
                            <div
                                className="text-sm font-black flex-shrink-0"
                                style={{
                                    color: isSelected
                                        ? '#ffffff'
                                        : config.headingColor || config.textColor || '#1e293b',
                                }}
                            >
                                {formatCurrency(Math.floor(price))}
                            </div>
                        </button>
                    );
                })}
            </div>
        </div>
    );
};
