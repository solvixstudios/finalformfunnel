import { Truck, AlertCircle, ArrowRight, Check, Search } from 'lucide-react';
import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useFormRules, ShippingRule } from '../../../hooks/useFormRules';
import { getStoredUser } from '../../../lib/authGoogle';

interface ShippingSelectorProps {
    formConfig: any;
    setFormConfig: (config: any) => void;
}

export const ShippingSelector: React.FC<ShippingSelectorProps> = ({ formConfig, setFormConfig }) => {
    const user = getStoredUser();
    const { rules, loading } = useFormRules(user?.id, 'shipping');
    const [search, setSearch] = useState('');

    useEffect(() => {
        let updates: any = null;
        if (formConfig.enableHomeDelivery === undefined) {
            updates = { ...updates, enableHomeDelivery: true };
        }
        if (formConfig.enableDeskDelivery === undefined) {
            updates = { ...updates, enableDeskDelivery: true };
        }

        if (updates) {
            setFormConfig({ ...formConfig, ...updates });
        }
    }, [formConfig.enableHomeDelivery, formConfig.enableDeskDelivery]);

    const handleSelectRule = (ruleId: string) => {
        const newSelection = formConfig.shippingRuleId === ruleId ? null : ruleId;
        setFormConfig({ ...formConfig, shippingRuleId: newSelection });
    };

    const shippingRules = rules as ShippingRule[];
    const activeRule = shippingRules.find(r => r.id === formConfig.shippingRuleId);

    const filtered = useMemo(() => {
        if (!search.trim()) return shippingRules;
        const q = search.toLowerCase();
        return shippingRules.filter(r =>
            r.name.toLowerCase().includes(q) ||
            r.labels?.some(l => l.toLowerCase().includes(q))
        );
    }, [shippingRules, search]);

    if (loading) {
        return <div className="p-8 flex justify-center"><div className="w-8 h-8 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin" /></div>;
    }

    return (
        <div className="space-y-5">
            <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white shadow-lg">
                    <Truck size={20} />
                </div>
                <div>
                    <h4 className="text-sm font-bold text-slate-800">Profil de Livraison</h4>
                    <p className="text-[10px] text-slate-400">Choisissez la grille tarifaire pour ce formulaire</p>
                </div>
            </div>

            <div className="bg-emerald-50 rounded-xl border border-emerald-200 p-4 flex gap-3 items-start">
                <AlertCircle className="text-emerald-500 shrink-0 mt-0.5" size={16} />
                <div>
                    <h5 className="text-xs font-bold text-emerald-800 mb-1">Configuration Centrale</h5>
                    <p className="text-[10px] text-emerald-700/80 mb-3">
                        Ne créez vos tarifs qu'une seule fois. Tout changement s'appliquera sur vos formulaires.
                    </p>
                    <Link to="/dashboard/rules/shipping" target="_blank" className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-100 text-emerald-700 hover:bg-emerald-200 hover:text-emerald-800 transition-colors rounded-lg text-[10px] font-bold uppercase tracking-wider">
                        Modifier les tarifs <ArrowRight size={12} />
                    </Link>
                </div>
            </div>

            {/* Search */}
            {shippingRules.length > 3 && (
                <div className="relative">
                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Rechercher par nom ou label..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full pl-9 pr-3 py-2.5 text-xs font-medium bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-emerald-400 focus:bg-white transition-all"
                    />
                </div>
            )}

            {shippingRules.length === 0 ? (
                <div className="p-8 bg-white rounded-xl border-2 border-dashed border-slate-200 text-center">
                    <p className="text-sm font-bold text-slate-400">Aucun profil de livraison</p>
                    <p className="text-xs text-slate-300 mt-1">Créez une grille tarifaire pour commencer.</p>
                </div>
            ) : filtered.length === 0 ? (
                <div className="p-6 text-center text-slate-400">
                    <p className="text-xs font-bold">Aucun résultat pour "{search}"</p>
                </div>
            ) : (
                <div className="space-y-2">
                    {filtered.map(rule => {
                        const isSelected = formConfig.shippingRuleId === rule.id;
                        return (
                            <button
                                key={rule.id}
                                onClick={() => handleSelectRule(rule.id)}
                                className={`w-full flex items-center justify-between p-3.5 rounded-xl border text-left transition-all ${isSelected ? 'bg-emerald-50 border-emerald-500 shadow-sm ring-1 ring-emerald-500' : 'bg-white border-slate-200 hover:border-emerald-300'}`}
                            >
                                <div className="flex items-center gap-3 min-w-0">
                                    <div className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 transition-colors ${isSelected ? 'bg-emerald-600 border-emerald-600 text-white' : 'bg-white border-slate-300'}`}>
                                        {isSelected && <Check size={12} strokeWidth={3} />}
                                    </div>
                                    <div className="min-w-0">
                                        <p className={`text-sm font-bold truncate ${isSelected ? 'text-emerald-900' : 'text-slate-800'}`}>{rule.name}</p>
                                        <div className="flex items-center gap-2 mt-0.5">
                                            <div className="flex gap-2 text-[10px] text-slate-500">
                                                <span>Dom: {rule.shipping?.standard?.home} DA</span>
                                                <span>Bur: {rule.shipping?.standard?.desk} DA</span>
                                            </div>
                                            {rule.labels && rule.labels.length > 0 && (
                                                <div className="flex gap-1 flex-wrap">
                                                    {rule.labels.map(label => (
                                                        <span key={label} className="px-1.5 py-0.5 bg-emerald-100 text-emerald-600 text-[8px] font-bold rounded-md">{label}</span>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </button>
                        );
                    })}
                </div>
            )}

            {/* Local toggle switches for active rule */}
            {activeRule && (
                <div className="pt-4 border-t border-slate-200 space-y-4">
                    <h5 className="text-xs font-bold text-slate-800">Options locales</h5>

                    <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-slate-200">
                        <div>
                            <span className="text-xs font-bold text-slate-700 block">Livraison à domicile</span>
                        </div>
                        <button
                            onClick={() => setFormConfig({ ...formConfig, enableHomeDelivery: !formConfig.enableHomeDelivery })}
                            className={`w-10 h-5 rounded-full relative transition-colors ${formConfig.enableHomeDelivery !== false ? 'bg-emerald-500' : 'bg-slate-200'}`}
                        >
                            <div className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full transition-transform ${formConfig.enableHomeDelivery !== false ? 'translate-x-5' : ''}`} />
                        </button>
                    </div>

                    <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-slate-200">
                        <div>
                            <span className="text-xs font-bold text-slate-700 block">Livraison en bureau</span>
                        </div>
                        <button
                            onClick={() => setFormConfig({ ...formConfig, enableDeskDelivery: !formConfig.enableDeskDelivery })}
                            className={`w-10 h-5 rounded-full relative transition-colors ${formConfig.enableDeskDelivery !== false ? 'bg-emerald-500' : 'bg-slate-200'}`}
                        >
                            <div className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full transition-transform ${formConfig.enableDeskDelivery !== false ? 'translate-x-5' : ''}`} />
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};
