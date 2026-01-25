/**
 * Variants Section Component  
 * Displays variant/model selection with multiple styles
 */

import { buildOptionCardStyles } from '@/lib/utils/cssEngine';
import type { Language } from '@/types';
import { Check, ChevronDown } from 'lucide-react';
import React from 'react';
import { SectionLabel } from '../components/SectionLabel';

interface VariantsSectionProps {
    config: {
        accentColor: string;
        textColor?: string;
        borderRadius: string;
        inputBorderColor?: string;
        formBackground?: string;
        variantStyle?: 'buttons' | 'cards' | 'pills' | 'dropdown';
        sectionSettings?: {
            variants?: { showTitle?: boolean };
        };
        translations: {
            variants?: { fr: string; ar: string };
            [key: string]: any;
        };
    };
    lang: Language;
    variants?: string[]; // Legacy support (optional)
    options?: { name: string; values: string[] }[];
    selectedOptions?: Record<string, string>;
    onOptionSelect?: (optionName: string, value: string) => void;

    // Legacy props (kept for potential backward compatibility or simple lists)
    selectedVariant?: string;
    onSelect?: (variant: string) => void;

    marginStyle?: React.CSSProperties;
}

export const VariantsSection: React.FC<VariantsSectionProps> = ({
    config,
    lang,
    variants = [],
    options = [],
    selectedOptions = {},
    selectedVariant,
    onOptionSelect,
    onSelect,
    marginStyle,
}) => {
    const txt = (key: string) =>
        config.translations[key]?.[lang] || config.translations[key]?.fr || '';

    const style = config.variantStyle || 'cards';

    // Helper to render a single option group
    const renderOptionGroup = (optionName: string, values: string[]) => (
        <div key={optionName} className="mb-4 last:mb-0">
            <h4 className="text-xs font-bold mb-2 ml-1 opacity-80" style={{ color: config.textColor }}>
                {optionName}
            </h4>

            {/* CHECK LIST STYLE (Replaces Buttons/Pills) */}
            {(style === 'buttons' || style === 'pills') && (
                <div className="space-y-2">
                    {values.map((val) => {
                        const isSelected = selectedOptions[optionName] === val;
                        return (
                            <button
                                key={val}
                                onClick={() => onOptionSelect?.(optionName, val)}
                                className={`relative w-full p-3 border-2 flex items-center gap-2.5 transition-all duration-200 ${isSelected ? 'shadow-md' : 'hover:border-slate-300'}`}
                                style={{
                                    borderRadius: config.borderRadius,
                                    borderColor: isSelected ? undefined : config.inputBorderColor || '#e2e8f0', // Default border color when not selected
                                    backgroundColor: isSelected ? undefined : config.formBackground || '#ffffff',
                                    ...buildOptionCardStyles(config as any, { selected: isSelected })
                                }}
                            >
                                {/* Selection radio */}
                                <div
                                    className={`w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all ${isSelected ? 'border-white bg-white/20' : ''
                                        }`}
                                    style={{
                                        borderColor: isSelected ? undefined : config.inputBorderColor || '#e2e8f0',
                                    }}
                                >
                                    {isSelected && <Check size={10} strokeWidth={4} className="text-white" />}
                                </div>

                                <span className={isSelected ? 'text-white' : ''} style={{ color: isSelected ? '#ffffff' : config.textColor }}>
                                    {val}
                                </span>
                            </button>
                        );
                    })}
                </div>
            )}

            {/* DROPDOWN STYLE */}
            {
                style === 'dropdown' && (
                    <div className="relative">
                        <select
                            value={selectedOptions[optionName]}
                            onChange={(e) => onOptionSelect?.(optionName, e.target.value)}
                            className="w-full px-4 py-3 text-sm font-semibold border-2 outline-none appearance-none cursor-pointer"
                            style={{
                                borderRadius: config.borderRadius,
                                backgroundColor: config.formBackground || '#ffffff',
                                borderColor: config.inputBorderColor || '#e2e8f0',
                                color: config.textColor || '#1e293b',
                            }}
                        >
                            {values.map((val) => (
                                <option key={val} value={val}>
                                    {val}
                                </option>
                            ))}
                        </select>
                        <ChevronDown
                            size={16}
                            className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none"
                            style={{ color: config.textColor || '#94a3b8' }}
                        />
                    </div>
                )
            }

            {/* CARDS STYLE */}
            {style === 'cards' && (
                <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1 -mx-1 px-1">
                    {values.map((val) => {
                        const isSelected = selectedOptions[optionName] === val;
                        return (
                            <button
                                key={val}
                                onClick={() => onOptionSelect?.(optionName, val)}
                                className={`flex-shrink-0 p-3 text-xs font-bold transition-all duration-200 border-2 text-center flex items-center justify-center gap-2 ${isSelected ? 'text-white shadow-md' : ''}`}
                                style={{
                                    ...buildOptionCardStyles(config as any, { selected: isSelected }),
                                    borderRadius: config.borderRadius,
                                }}
                            >
                                {/* Selection radio (Consistent with Offers/List) */}
                                <div
                                    className={`w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all ${isSelected ? 'border-white bg-white/20' : ''
                                        }`}
                                    style={{
                                        borderColor: isSelected ? undefined : config.inputBorderColor || '#e2e8f0',
                                    }}
                                >
                                    {isSelected && <Check size={8} strokeWidth={4} className="text-white" />}
                                </div>
                                <span>{val}</span>
                            </button>
                        );
                    })}
                </div>
            )}
        </div >
    );



    const hasOptions = options.length > 0;

    return (
        <div style={marginStyle}>
            {config.sectionSettings?.variants?.showTitle !== false && (
                <SectionLabel accentColor={config.accentColor}>{txt('variants')}</SectionLabel>
            )}

            <div className="space-y-4">
                {/* Unified Rendering for both options (Shopify) and flat variants (Legacy/Preview) */}
                {(hasOptions ? options : [{ name: '', values: variants }]).map((opt, i) =>
                    // Use empty name if it's the fallback list to avoid displaying "Modèle" if not desired, 
                    // or pass a default label if config.translations.variants matches.
                    // The renderOptionGroup checks config.textColor which is fine.
                    renderOptionGroup(opt.name, opt.values)
                )}
            </div>
        </div>
    );
};
