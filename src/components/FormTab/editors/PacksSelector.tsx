import { Tag, AlertCircle, ArrowRight, Check } from 'lucide-react';
import React from 'react';
import { Link } from 'react-router-dom';
import { useFormRules, OfferRule } from '../../../hooks/useFormRules';
import { getStoredUser } from '../../../lib/authGoogle';

interface PacksSelectorProps {
    formConfig: any;
    setFormConfig: (config: any) => void;
}

export const PacksSelector: React.FC<PacksSelectorProps> = ({ formConfig, setFormConfig }) => {
    const user = getStoredUser();
    const { rules, loading } = useFormRules(user?.id, 'offers');

    const handleSelectRule = (ruleId: string) => {
        // If clicking the already selected rule, unselect it.
        const newSelection = formConfig.offerRuleId === ruleId ? null : ruleId;
        setFormConfig({ ...formConfig, offerRuleId: newSelection });
    };

    if (loading) {
        return <div className="p-8 flex justify-center"><div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" /></div>;
    }

    const offerRules = rules as OfferRule[];

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white shadow-lg">
                    <Tag size={20} />
                </div>
                <div>
                    <h4 className="text-sm font-bold text-slate-800">Profil d'Offres</h4>
                    <p className="text-[10px] text-slate-400">Choisissez le groupe d'offres actif pour ce formulaire</p>
                </div>
            </div>

            <div className="bg-indigo-50 rounded-xl border border-indigo-200 p-4 flex gap-3 items-start">
                <AlertCircle className="text-indigo-500 shrink-0 mt-0.5" size={16} />
                <div>
                    <h5 className="text-xs font-bold text-indigo-800 mb-1">Profil Selectionné</h5>
                    <p className="text-[10px] text-indigo-700/80 mb-3">
                        Les modifications apportées à un profil depuis le tableau de bord mettront à jour automatiquement tous les formulaires l'utilisant.
                    </p>
                    <Link to="/dashboard/rules/offers" target="_blank" className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-100 text-indigo-700 hover:bg-indigo-200 hover:text-indigo-800 transition-colors rounded-lg text-[10px] font-bold uppercase tracking-wider">
                        Gérer les profils <ArrowRight size={12} />
                    </Link>
                </div>
            </div>

            {offerRules.length === 0 ? (
                <div className="p-8 bg-white rounded-xl border-2 border-dashed border-slate-200 text-center">
                    <p className="text-sm font-bold text-slate-400">Aucun profil d'offres</p>
                    <p className="text-xs text-slate-300 mt-1">Créez un profil pour commencer.</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {offerRules.map(rule => {
                        const isSelected = formConfig.offerRuleId === rule.id;
                        return (
                            <button
                                key={rule.id}
                                onClick={() => handleSelectRule(rule.id)}
                                className={`w-full flex items-center justify-between p-4 rounded-xl border text-left transition-all ${isSelected ? 'bg-indigo-50 border-indigo-500 shadow-sm ring-1 ring-indigo-500' : 'bg-white border-slate-200 hover:border-indigo-300'}`}
                            >
                                <div className="flex items-center gap-3">
                                    <div className={`w-5 h-5 rounded-full border flex items-center justify-center transition-colors ${isSelected ? 'bg-indigo-600 border-indigo-600 text-white' : 'bg-white border-slate-300'}`}>
                                        {isSelected && <Check size={12} strokeWidth={3} />}
                                    </div>
                                    <div>
                                        <p className={`text-sm font-bold ${isSelected ? 'text-indigo-900' : 'text-slate-800'}`}>{rule.name}</p>
                                        <p className="text-xs text-slate-500">{rule.offers?.length || 0} offres incluses</p>
                                    </div>
                                </div>
                            </button>
                        );
                    })}
                </div>
            )}
        </div>
    );
};
