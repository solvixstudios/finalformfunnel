import { Ticket, AlertCircle, ArrowRight, Check } from 'lucide-react';
import React from 'react';
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

    const handleSelectRule = (ruleId: string) => {
        const newSelection = formConfig.couponRuleId === ruleId ? null : ruleId;
        setFormConfig({ ...formConfig, couponRuleId: newSelection });
    };

    if (loading) {
        return <div className="p-8 flex justify-center"><div className="w-8 h-8 border-4 border-violet-600 border-t-transparent rounded-full animate-spin" /></div>;
    }

    const couponRules = rules as CouponRule[];

    return (
        <div className="space-y-6">
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

            {couponRules.length === 0 ? (
                <div className="p-8 bg-white rounded-xl border-2 border-dashed border-slate-200 text-center">
                    <p className="text-sm font-bold text-slate-400">Aucun profil de codes promo</p>
                    <p className="text-xs text-slate-300 mt-1">Créez une campagne pour commencer.</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {couponRules.map(rule => {
                        const isSelected = formConfig.couponRuleId === rule.id;
                        return (
                            <button
                                key={rule.id}
                                onClick={() => handleSelectRule(rule.id)}
                                className={`w-full flex items-center justify-between p-4 rounded-xl border text-left transition-all ${isSelected ? 'bg-violet-50 border-violet-500 shadow-sm ring-1 ring-violet-500' : 'bg-white border-slate-200 hover:border-violet-300'}`}
                            >
                                <div className="flex items-center gap-3">
                                    <div className={`w-5 h-5 rounded-full border flex items-center justify-center transition-colors ${isSelected ? 'bg-violet-600 border-violet-600 text-white' : 'bg-white border-slate-300'}`}>
                                        {isSelected && <Check size={12} strokeWidth={3} />}
                                    </div>
                                    <div>
                                        <p className={`text-sm font-bold ${isSelected ? 'text-violet-900' : 'text-slate-800'}`}>{rule.name}</p>
                                        <p className="text-xs text-slate-500">{rule.coupons?.length || 0} codes inclus</p>
                                    </div>
                                </div>
                                {!rule.config?.enabled && (
                                    <span className="px-2 py-1 bg-slate-100 text-slate-500 text-[10px] font-bold rounded">
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
