import { Ticket, AlertCircle, ArrowRight, Check, Search } from 'lucide-react';
import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useFormRules, CouponRule } from '../../../hooks/useFormRules';
import { getStoredUser } from '../../../lib/authGoogle';

interface PromoCodeSelectorProps {
    formConfig: any;
    setFormConfig: (config: any) => void;
}

export const PromoCodeSelector: React.FC<PromoCodeSelectorProps> = ({ formConfig, setFormConfig }) => {
    const user = getStoredUser();
    const { rules, loading } = useFormRules(user?.id, 'coupons');
    const [search, setSearch] = useState('');

    const handleSelectRule = (ruleId: string) => {
        const newSelection = formConfig.couponRuleId === ruleId ? null : ruleId;
        setFormConfig({ ...formConfig, couponRuleId: newSelection });
    };

    const couponRules = rules as CouponRule[];

    const filtered = useMemo(() => {
        if (!search.trim()) return couponRules;
        const q = search.toLowerCase();
        return couponRules.filter(r =>
            r.name.toLowerCase().includes(q) ||
            r.labels?.some(l => l.toLowerCase().includes(q))
        );
    }, [couponRules, search]);

    if (loading) {
        return <div className="p-8 flex justify-center"><div className="w-8 h-8 border-4 border-violet-600 border-t-transparent rounded-full animate-spin" /></div>;
    }

    return (
        <div className="space-y-5">
            <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-white shadow-lg">
                    <Ticket size={20} />
                </div>
                <div>
                    <h4 className="text-sm font-bold text-slate-800">Profil Codes Promo</h4>
                    <p className="text-[10px] text-slate-400">Choisissez la campagne active pour ce formulaire</p>
                </div>
            </div>

            <div className="bg-violet-50 rounded-xl border border-violet-200 p-4 flex gap-3 items-start">
                <AlertCircle className="text-violet-500 shrink-0 mt-0.5" size={16} />
                <div>
                    <h5 className="text-xs font-bold text-violet-800 mb-1">Configuration Centrale</h5>
                    <p className="text-[10px] text-violet-700/80 mb-3">
                        Gérez vos codes promo une seule fois, puis activez-les sur n'importe quel formulaire.
                    </p>
                    <Link to="/dashboard/rules/coupons" target="_blank" className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-violet-100 text-violet-700 hover:bg-violet-200 hover:text-violet-800 transition-colors rounded-lg text-[10px] font-bold uppercase tracking-wider">
                        Modifier les codes <ArrowRight size={12} />
                    </Link>
                </div>
            </div>

            {/* Search */}
            {couponRules.length > 3 && (
                <div className="relative">
                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Rechercher par nom ou label..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full pl-9 pr-3 py-2.5 text-xs font-medium bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-violet-400 focus:bg-white transition-all"
                    />
                </div>
            )}

            {couponRules.length === 0 ? (
                <div className="p-8 bg-white rounded-xl border-2 border-dashed border-slate-200 text-center">
                    <p className="text-sm font-bold text-slate-400">Aucun profil de codes promo</p>
                    <p className="text-xs text-slate-300 mt-1">Créez une campagne pour commencer.</p>
                </div>
            ) : filtered.length === 0 ? (
                <div className="p-6 text-center text-slate-400">
                    <p className="text-xs font-bold">Aucun résultat pour "{search}"</p>
                </div>
            ) : (
                <div className="space-y-2">
                    {filtered.map(rule => {
                        const isSelected = formConfig.couponRuleId === rule.id;
                        return (
                            <button
                                key={rule.id}
                                onClick={() => handleSelectRule(rule.id)}
                                className={`w-full flex items-center justify-between p-3.5 rounded-xl border text-left transition-all ${isSelected ? 'bg-violet-50 border-violet-500 shadow-sm ring-1 ring-violet-500' : 'bg-white border-slate-200 hover:border-violet-300'}`}
                            >
                                <div className="flex items-center gap-3 min-w-0">
                                    <div className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 transition-colors ${isSelected ? 'bg-violet-600 border-violet-600 text-white' : 'bg-white border-slate-300'}`}>
                                        {isSelected && <Check size={12} strokeWidth={3} />}
                                    </div>
                                    <div className="min-w-0">
                                        <p className={`text-sm font-bold truncate ${isSelected ? 'text-violet-900' : 'text-slate-800'}`}>{rule.name}</p>
                                        <div className="flex items-center gap-2 mt-0.5">
                                            <span className="text-[10px] text-slate-500">{rule.coupons?.length || 0} codes</span>
                                            {rule.labels && rule.labels.length > 0 && (
                                                <div className="flex gap-1 flex-wrap">
                                                    {rule.labels.map(label => (
                                                        <span key={label} className="px-1.5 py-0.5 bg-violet-100 text-violet-600 text-[8px] font-bold rounded-md">{label}</span>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                                {!rule.config?.enabled && (
                                    <span className="px-2 py-1 bg-slate-100 text-slate-500 text-[10px] font-bold rounded shrink-0">
                                        Désactivé
                                    </span>
                                )}
                            </button>
                        );
                    })}
                </div>
            )}
        </div>
    );
};
