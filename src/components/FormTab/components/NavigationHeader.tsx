import React from 'react';
import { ArrowLeft, ChevronLeft } from 'lucide-react';
import { SECTION_LABELS } from '../../../lib/constants';
import { useI18n } from '../../../lib/i18n/i18nContext';

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

    const getSectionTitle = (section: string): string => {
        switch (section) {
            case 'global_design':
                return 'Design Global';
            case 'sections_list':
                return 'Sections du Formulaire';
            case 'thank_you':
                return 'Page de Remerciement';
            case 'packs_manager':
                return t('editor.managePacksTitle');
            case 'shipping_manager':
                return t('editor.shippingRates');
            case 'header':
                return t('editor.headerTitle');
            default:
                return `Editer: ${SECTION_LABELS[section]?.fr || 'Section'}`;
        }
    };

    return (
        <div className="flex border-b border-slate-100 px-4 py-3 items-center justify-between shrink-0 bg-slate-50/50">
            {editingSection ? (
                <div className="flex items-center gap-3">
                    {editingField ? (
                        <>
                            <button onClick={() => setEditingField(null)} className="p-2 hover:bg-slate-100 rounded-lg text-slate-500" aria-label="Back"><ArrowLeft size={20} /></button>
                            <h2 className="text-sm font-bold text-slate-800">Configuration Champ</h2>
                        </>
                    ) : (
                        <>
                            <button
                                onClick={() => {
                                    if (['sections_list', 'global_design', 'thank_you', 'packs_manager', 'shipping_manager'].includes(editingSection!)) {
                                        setEditingSection(null);
                                    } else {
                                        setEditingSection('sections_list');
                                    }
                                }}
                                className="p-2 hover:bg-slate-100 rounded-lg text-slate-500"
                                aria-label="Back"
                            >
                                <ChevronLeft size={20} />
                            </button>
                            <h2 className="text-sm font-bold text-slate-800">
                                {getSectionTitle(editingSection!)}
                            </h2>
                        </>
                    )}
                </div>
            ) : (
                <div className="flex items-center gap-2">
                    <h2 className="text-sm font-bold text-slate-800">{t('editor.configureForm')}</h2>
                </div>
            )}
        </div>
    );
};
