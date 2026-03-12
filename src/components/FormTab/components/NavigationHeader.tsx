import React from 'react';
import { ArrowLeft, ChevronLeft } from 'lucide-react';
import { SECTION_LABELS } from '../../../lib/constants';
import { useI18n } from '../../../lib/i18n/i18nContext';

/**
 * Sections that are opened directly from the Main Menu.
 * Back button → null (main menu).
 */
const MENU_LEVEL_SECTIONS = new Set([
    'global_design',
    'sections_list',
    'thank_you',
    'packs_manager',
    'shipping_manager',
    'promo_code_manager',
    'whatsapp',
    'google_sheets',
    'meta_pixel',
    'tiktok_pixel',
    'shopify',
    'woocommerce',
]);

/**
 * Known editor titles that don't come from SECTION_LABELS or need a custom label.
 * This is the ONLY place you need to add a title for a new editor.
 */
const EDITOR_TITLES: Record<string, string> = {
    global_design: 'Design Global',
    sections_list: 'Sections du Formulaire',
    thank_you: 'Page de Remerciement',
    packs_manager: 'Packs & Offres',
    shipping_manager: 'Tarifs de Livraison',
    promo_code_manager: 'Codes Promo',
    whatsapp: 'WhatsApp',
    google_sheets: 'Google Sheets',
    meta_pixel: 'Meta Pixel',
    tiktok_pixel: 'TikTok Pixel',
    shopify: 'Shopify',
    woocommerce: 'WooCommerce',
    urgencyText: 'Urgence — Texte',
    urgencyQuantity: 'Urgence — Stock',
    urgencyTimer: 'Urgence — Timer',
};

/**
 * Auto-format a section key into a human-readable title.
 * Handles camelCase, snake_case, and PascalCase.
 */
const formatSectionKey = (key: string): string =>
    key
        .replace(/([A-Z])/g, ' $1')   // camelCase → "camel Case"
        .replace(/_/g, ' ')            // snake_case → "snake case"
        .replace(/^./, s => s.toUpperCase())
        .trim();

interface NavigationHeaderProps {
    editingSection: string | null;
    editingField: string | null;
    setEditingField: (field: string | null) => void;
    setEditingSection: (section: string | null) => void;
}

export const NavigationHeader = ({
    editingSection,
    editingField,
    setEditingField,
    setEditingSection
}: NavigationHeaderProps) => {
    const { t } = useI18n();

    /** Resolve a title for any section key, generically. */
    const getSectionTitle = (section: string): string => {
        // 1. Explicit editor title
        if (EDITOR_TITLES[section]) return EDITOR_TITLES[section];
        // 2. From i18n-aware constants
        if (SECTION_LABELS[section]?.fr) return SECTION_LABELS[section].fr;
        // 3. Auto-format fallback
        return formatSectionKey(section);
    };

    /** Navigate back: menu-level → main menu, everything else → sections_list */
    const handleBack = () => {
        if (MENU_LEVEL_SECTIONS.has(editingSection!)) {
            setEditingSection(null);
        } else {
            setEditingSection('sections_list');
        }
    };

    return (
        <div className="flex border-b border-slate-200 px-4 sm:px-6 h-14 items-center justify-between shrink-0 bg-white shadow-sm z-10 relative">
            {editingSection ? (
                <div className="flex items-center gap-3">
                    {editingField ? (
                        <>
                            <button
                                onClick={() => setEditingField(null)}
                                className="p-1.5 -ml-1.5 hover:bg-slate-100 rounded-lg text-slate-500 hover:text-slate-900 transition-colors"
                                aria-label="Back"
                            >
                                <ArrowLeft size={16} strokeWidth={2.5} />
                            </button>
                            <h2 className="text-sm font-semibold text-slate-900 tracking-tight">Field Configuration</h2>
                        </>
                    ) : (
                        <>
                            <button
                                onClick={handleBack}
                                className="p-1.5 -ml-1.5 hover:bg-slate-100 rounded-lg text-slate-500 hover:text-slate-900 transition-colors"
                                aria-label="Back"
                            >
                                <ChevronLeft size={18} strokeWidth={2.5} />
                            </button>
                            <h2 className="text-sm font-semibold text-slate-900 tracking-tight">
                                {getSectionTitle(editingSection!)}
                            </h2>
                        </>
                    )}
                </div>
            ) : (
                <div className="flex items-center gap-2">
                    <h2 className="text-sm font-semibold text-slate-900 tracking-tight">{t('editor.configureForm')}</h2>
                </div>
            )}
        </div>
    );
};
