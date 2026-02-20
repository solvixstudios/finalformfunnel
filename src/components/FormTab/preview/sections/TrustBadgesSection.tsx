/**
 * Trust Badges Section Component
 * Displays trust indicators with multiple style variants
 */

import type { Language } from '@/types';
import { Check, Package, RotateCcw, Shield, Truck, Zap } from 'lucide-react';
import React from 'react';
import { SectionLabel } from '../components/SectionLabel';
import type { FormConfig } from '@/types/form';

interface TrustBadge {
    enabled: boolean;
    label: { fr: string; ar: string };
    customText: { fr: string; ar: string };
}

interface TrustBadgesSectionProps {
    config: FormConfig;
    lang: Language;
    marginStyle?: React.CSSProperties;
}

// Icon mapping for badges with proper icons
const badgeIcons: Record<string, React.FC<{ size?: number; className?: string; style?: React.CSSProperties }>> = {
    cod: (props) => <Package {...props} />,
    guarantee: (props) => <Shield {...props} />,
    return: (props) => <RotateCcw {...props} />,
    support: (props) => <Zap {...props} />,
    fastDelivery: (props) => <Truck {...props} />,
};

// Default labels for badges
const defaultBadgeLabels: Record<string, { fr: string; ar: string }> = {
    cod: { fr: 'Paiement à la livraison', ar: 'الدفع عند الاستلام' },
    guarantee: { fr: 'Garantie qualité', ar: 'ضمان الجودة' },
    return: { fr: 'Retour facile', ar: 'إرجاع سهل' },
    support: { fr: 'Support 24/7', ar: 'دعم 24/7' },
    fastDelivery: { fr: 'Livraison rapide', ar: 'توصيل سريع' },
};

export const TrustBadgesSection: React.FC<TrustBadgesSectionProps> = ({
    config,
    lang,
    marginStyle,
}) => {
    const txt = (key: string) =>
        config.translations[key]?.[lang] || config.translations[key]?.fr || '';

    const style = config.trustBadgeStyle || 'cards';

    // Get active badges with proper text fallbacks
    const activeBadges = Object.entries(config.trustBadges || {})
        .filter(([_, badge]) => badge?.enabled)
        .map(([key, badge]) => ({
            key,
            text: badge.customText?.[lang] ||
                badge.customText?.fr ||
                badge.label?.[lang] ||
                badge.label?.fr ||
                defaultBadgeLabels[key]?.[lang] ||
                defaultBadgeLabels[key]?.fr ||
                '',
            Icon: badgeIcons[key] || Shield,
        }));

    if (activeBadges.length === 0) return null;

    const defaultTitle = lang === 'fr' ? 'Garanties' : 'الضمانات';
    const titleText = txt('trustTitle') || defaultTitle;

    return (
        <div style={marginStyle}>
            {config.sectionSettings?.trustBadges?.showTitle !== false && (
                <SectionLabel accentColor={config.accentColor}>{titleText}</SectionLabel>
            )}

            {/* Cards style - 2 column grid with icons */}
            {style === 'cards' && (
                <div className="grid grid-cols-2 gap-2">
                    {activeBadges.map(({ key, text, Icon }) => (
                        <div
                            key={key}
                            className="flex items-center gap-2.5 p-3 border rounded-xl transition-all hover:shadow-sm"
                            style={{
                                borderColor: `${config.accentColor}25`,
                                borderRadius: config.borderRadius,
                                background: `linear-gradient(135deg, ${config.accentColor}05 0%, transparent 100%)`,
                            }}
                        >
                            <div
                                className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm"
                                style={{
                                    backgroundColor: `${config.accentColor}15`,
                                    color: config.accentColor,
                                }}
                            >
                                <Icon size={18} />
                            </div>
                            <span
                                className="text-[11px] font-semibold leading-tight"
                                style={{ color: config.textColor || '#334155' }}
                            >
                                {text}
                            </span>
                        </div>
                    ))}
                </div>
            )}

            {/* Pills style - Wrapped horizontal pills */}
            {style === 'pills' && (
                <div className="flex flex-wrap gap-2 justify-center">
                    {activeBadges.map(({ key, text, Icon }) => (
                        <div
                            key={key}
                            className="flex items-center gap-1.5 px-3 py-2 rounded-full text-[11px] font-semibold transition-all hover:scale-105"
                            style={{
                                backgroundColor: `${config.accentColor}12`,
                                color: config.accentColor,
                                border: `1px solid ${config.accentColor}25`,
                            }}
                        >
                            <Icon size={13} />
                            {text}
                        </div>
                    ))}
                </div>
            )}

            {/* Minimal style - Simple checklist */}
            {style === 'minimal' && (
                <div className="space-y-2">
                    {activeBadges.map(({ key, text }) => (
                        <div key={key} className="flex items-center gap-2.5">
                            <div
                                className="w-5 h-5 rounded-full flex items-center justify-center"
                                style={{ backgroundColor: `${config.accentColor}15` }}
                            >
                                <Check size={12} style={{ color: config.accentColor }} strokeWidth={3} />
                            </div>
                            <span className="text-xs font-medium" style={{ color: config.textColor || '#64748b' }}>
                                {text}
                            </span>
                        </div>
                    ))}
                </div>
            )}

            {/* Banner style - Colored background with all badges */}
            {style === 'banner' && (
                <div
                    className="p-4 rounded-xl"
                    style={{
                        backgroundColor: `${config.accentColor}10`,
                        borderRadius: config.borderRadius,
                        border: `1px solid ${config.accentColor}20`,
                    }}
                >
                    <div className="flex flex-wrap gap-4 justify-center">
                        {activeBadges.map(({ key, text, Icon }) => (
                            <div key={key} className="flex items-center gap-2 text-xs font-medium">
                                <div
                                    className="w-7 h-7 rounded-lg flex items-center justify-center"
                                    style={{ backgroundColor: `${config.accentColor}20` }}
                                >
                                    <Icon size={14} style={{ color: config.accentColor }} />
                                </div>
                                <span style={{ color: config.textColor || '#334155' }}>{text}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Lines style - Vertical list with separators */}
            {style === 'lines' && (
                <div
                    className="rounded-xl overflow-hidden"
                    style={{
                        border: `1px solid ${config.accentColor}20`,
                        borderRadius: config.borderRadius,
                    }}
                >
                    {activeBadges.map(({ key, text, Icon }, index) => (
                        <React.Fragment key={key}>
                            <div
                                className="flex items-center gap-3 py-3 px-4"
                                style={{
                                    backgroundColor: index % 2 === 0 ? 'transparent' : `${config.accentColor}05`,
                                }}
                            >
                                <Icon size={16} style={{ color: config.accentColor }} />
                                <span
                                    className="text-xs font-medium flex-1"
                                    style={{ color: config.textColor || '#334155' }}
                                >
                                    {text}
                                </span>
                                <Check size={14} style={{ color: config.accentColor }} strokeWidth={3} />
                            </div>
                            {index < activeBadges.length - 1 && (
                                <div
                                    className="h-px mx-4"
                                    style={{ backgroundColor: `${config.accentColor}15` }}
                                />
                            )}
                        </React.Fragment>
                    ))}
                </div>
            )}

            {/* Compact Lines style - Horizontal with dots */}
            {style === 'compactLines' && (
                <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-2">
                    {activeBadges.map(({ key, text, Icon }, index) => (
                        <React.Fragment key={key}>
                            <div className="flex items-center gap-1.5">
                                <Icon size={13} style={{ color: config.accentColor }} />
                                <span
                                    className="text-[11px] font-medium"
                                    style={{ color: config.textColor || '#475569' }}
                                >
                                    {text}
                                </span>
                            </div>
                            {index < activeBadges.length - 1 && (
                                <div
                                    className="w-1 h-1 rounded-full"
                                    style={{ backgroundColor: `${config.accentColor}40` }}
                                />
                            )}
                        </React.Fragment>
                    ))}
                </div>
            )}
        </div>
    );
};
