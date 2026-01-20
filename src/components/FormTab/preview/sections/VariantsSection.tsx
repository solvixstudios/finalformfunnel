/**
 * Variants Section Component  
 * Displays variant/model selection with multiple styles
 */

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

    const style = config.variantStyle || 'buttons';

    // Helper to render a single option group
    const renderOptionGroup = (optionName: string, values: string[]) => (
        <div key={optionName} className="mb-4 last:mb-0">
            <h4 className="text-xs font-bold mb-2 ml-1 opacity-80" style={{ color: config.textColor }}>
                {optionName}
            </h4>

            {/* BUTTONS / PILLS STYLE */}
            {(style === 'buttons' || style === 'pills') && (
                <div className="flex flex-wrap gap-2">
                    {values.map((val) => {
                        const isSelected = selectedOptions[optionName] === val;
                        return (
                            <button
                                key={val}
                                onClick={() => onOptionSelect?.(optionName, val)}
                                className={`px-4 py-2 text-xs font-bold transition-all duration-200 border-2 ${style === 'pills' ? 'rounded-full' : 'rounded-lg'
                                    } ${isSelected ? 'text-white shadow-md' : ''}`}
                                style={{
                                    borderRadius: style === 'pills' ? '9999px' : config.borderRadius,
                                    backgroundColor: isSelected ? config.accentColor : 'transparent',
                                    borderColor: isSelected ? config.accentColor : (config.inputBorderColor || '#e2e8f0'),
                                    color: isSelected ? '#ffffff' : (config.textColor || '#475569'),
                                }}
                            >
                                {val}
                            </button>
                        );
                    })}
                </div>
            )}

            {/* DROPDOWN STYLE */}
            {style === 'dropdown' && (
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
            )}
        </div>
    );

    // Legacy Render (Simple List) - Fallback if no options structure provided
    const renderSimpleList = () => (
        <div className="flex flex-wrap gap-2">
            {variants.map((v, i) => {
                const isSelected = selectedVariant === v;
                return (
                    <button
                        key={i}
                        onClick={() => onSelect?.(v)}
                        className={`px-4 py-3 text-xs font-bold transition-all duration-200 border-2 rounded-lg flex items-center gap-2 ${isSelected ? 'text-white shadow-md' : ''
                            }`}
                        style={{
                            borderRadius: config.borderRadius,
                            backgroundColor: isSelected ? config.accentColor : (config.formBackground || '#ffffff'),
                            borderColor: isSelected ? config.accentColor : (config.inputBorderColor || '#e2e8f0'),
                            color: isSelected ? '#ffffff' : (config.textColor || '#475569'),
                        }}
                    >
                        {isSelected && <Check size={12} strokeWidth={4} className="text-white" />}
                        {v}
                    </button>
                );
            })}
        </div>
    );

    const hasOptions = options.length > 0;

    return (
        <div style={marginStyle}>
            {config.sectionSettings?.variants?.showTitle !== false && (
                <SectionLabel accentColor={config.accentColor}>{txt('variants')}</SectionLabel>
            )}

            <div className="space-y-4">
                {hasOptions
                    ? options.map(opt => renderOptionGroup(opt.name, opt.values))
                    : renderSimpleList()
                }
            </div>
        </div>
    );
};
