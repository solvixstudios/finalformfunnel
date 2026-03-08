import React, { useState } from 'react';
import { Plus, Trash2, ArrowLeft, Save, Eye, Ticket, Sparkles } from 'lucide-react';
import { useFormRules, CouponRule } from '@/hooks/useFormRules';
import PromoCodeManager, { PromoCode } from '@/components/managers/PromoCodeManager';
import { PromoCodeSection } from '@/components/FormTab/preview/sections/PromoCodeSection';
import { SummarySection } from '@/components/FormTab/preview/sections/SummarySection';
import type { FormConfig } from '@/types/form';

interface CouponsPageProps {
    userId: string;
}

const buildPreviewConfig = (codes: PromoCode[]): FormConfig => ({
    accentColor: '#8b5cf6',
    borderRadius: '12px',
    textColor: '#334155',
    headingColor: '#1e293b',
    inputBorderColor: '#e2e8f0',
    inputBackground: '#f8fafc',
    enableSummarySection: true,
    promoCode: {
        enabled: true,
        codes,
        placeholder: { fr: 'Entrez votre code', ar: 'أدخل الرمز' },
        buttonText: { fr: 'Appliquer', ar: 'تطبيق' },
        successText: { fr: 'Code appliqué !', ar: 'تم تطبيق الرمز!' },
        errorText: { fr: 'Code invalide', ar: 'رمز غير صالح' },
    },
    sectionSettings: {
        promoCode: { showTitle: true },
        summary: { showTitle: true },
    },
    translations: {
        promoCode: { fr: 'Code Promo', ar: 'كود الخصم' },
        subtotal: { fr: 'Sous-total', ar: 'المجموع الفرعي' },
        shippingLabel: { fr: 'Livraison', ar: 'التوصيل' },
        total: { fr: 'Total', ar: 'المجموع' },
        free: { fr: 'Gratuit', ar: 'مجاني' },
    },
} as FormConfig);

const CouponsPage: React.FC<CouponsPageProps> = ({ userId }) => {
    const { rules, loading, saveRule, deleteRule } = useFormRules(userId, 'coupons');
    const [editingRule, setEditingRule] = useState<CouponRule | null>(null);
    const [localCoupons, setLocalCoupons] = useState<PromoCode[]>([]);
    const [ruleName, setRuleName] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const [previewInput, setPreviewInput] = useState('');
    const [previewApplied, setPreviewApplied] = useState<{ code: string } | null>(null);
    const [previewError, setPreviewError] = useState(false);
    const [previewSuccess, setPreviewSuccess] = useState(false);

    const handleCreateNew = () => {
        setEditingRule({ id: '', name: 'Nouveaux Codes Promo', createdAt: 0, updatedAt: 0, coupons: [], config: { enabled: true, required: false } });
        setLocalCoupons([]);
        setRuleName('Nouveaux Codes Promo');
        resetPreview();
    };

    const handleEdit = (rule: CouponRule) => {
        setEditingRule(rule);
        setLocalCoupons(rule.coupons || []);
        setRuleName(rule.name || 'Codes Promo sans nom');
        resetPreview();
    };

    const resetPreview = () => {
        setPreviewInput('');
        setPreviewApplied(null);
        setPreviewError(false);
        setPreviewSuccess(false);
    };

    const handlePreviewApply = () => {
        const match = localCoupons.find(c =>
            c.code.toLowerCase() === previewInput.toLowerCase() && c.isActive !== false
        );
        if (match) {
            setPreviewApplied({ code: match.code });
            setPreviewSuccess(true);
            setPreviewError(false);
        } else {
            setPreviewError(true);
            setPreviewSuccess(false);
        }
    };

    const handlePreviewRemove = () => {
        resetPreview();
    };

    const handleSave = async () => {
        if (!editingRule) return;
        setIsSaving(true);
        try {
            await saveRule({ ...editingRule, name: ruleName, coupons: localCoupons });
            setEditingRule(null);
        } catch (error) {
            console.error("Error saving rule:", error);
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async (e: React.MouseEvent, ruleId: string) => {
        e.stopPropagation();
        if (confirm("Voulez-vous vraiment supprimer ce profil de codes promo ?")) {
            await deleteRule(ruleId);
        }
    };

    if (loading) {
        return (
            <div className="flex h-full items-center justify-center p-12">
                <div className="w-8 h-8 border-4 border-violet-600 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    // --- EDITOR VIEW ---
    if (editingRule) {
        const previewConfig = buildPreviewConfig(localCoupons);
        const subtotal = 3500;
        const appliedCoupon = previewApplied ? localCoupons.find(c => c.code === previewApplied.code) : null;
        const promoDiscount = appliedCoupon
            ? appliedCoupon.discountMode === 'percentage'
                ? { subtotalDiscount: subtotal * ((appliedCoupon.discountValue || 0) / 100), shippingDiscount: 0, totalDiscount: subtotal * ((appliedCoupon.discountValue || 0) / 100) }
                : appliedCoupon.discountMode === 'free'
                    ? { subtotalDiscount: subtotal, shippingDiscount: 0, totalDiscount: subtotal }
                    : { subtotalDiscount: appliedCoupon.discountValue || 0, shippingDiscount: 0, totalDiscount: appliedCoupon.discountValue || 0 }
            : { subtotalDiscount: 0, shippingDiscount: 0, totalDiscount: 0 };

        return (
            <div className="flex flex-col h-full">
                {/* Editor Header */}
                <div className="flex items-center justify-between mb-6 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
                    <div className="flex items-center gap-4">
                        <button onClick={() => setEditingRule(null)} className="p-2 hover:bg-slate-100 rounded-xl transition-colors text-slate-500">
                            <ArrowLeft size={20} />
                        </button>
                        <input
                            type="text"
                            value={ruleName}
                            onChange={(e) => setRuleName(e.target.value)}
                            className="text-xl font-bold text-slate-900 bg-transparent border-none p-0 focus:ring-0 hover:bg-slate-50 rounded px-2 py-1 w-64"
                            placeholder="Nom du profil"
                        />
                    </div>
                    <button
                        onClick={handleSave}
                        disabled={isSaving}
                        className="group relative flex items-center gap-2.5 bg-gradient-to-r from-violet-600 to-purple-600 text-white px-7 py-3 rounded-2xl font-bold shadow-lg shadow-violet-200/50 hover:shadow-xl hover:shadow-violet-300/50 hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isSaving ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Save size={18} />}
                        <span>Enregistrer</span>
                        <div className="absolute inset-0 rounded-2xl bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </button>
                </div>

                {/* Split Screen */}
                <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-6 pb-24">
                    {/* Left: Configuration — only codes, no enabled/required toggles */}
                    <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm overflow-y-auto">
                        <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                            <Ticket size={20} className="text-violet-500" />
                            Codes Promo
                        </h2>
                        <div className="bg-[#F8F5F1] rounded-2xl p-4 sm:p-6 border border-slate-200 shadow-inner">
                            <PromoCodeManager
                                codes={localCoupons}
                                onCodesChange={setLocalCoupons}
                                enabled={true}
                                required={false}
                                onEnabledChange={() => { }}
                                onRequiredChange={() => { }}
                                hideSettings
                            />
                        </div>
                    </div>

                    {/* Right: Live Preview */}
                    <div className="bg-slate-50 rounded-3xl border border-slate-200 p-6 flex flex-col">
                        <div className="flex items-center gap-2 mb-5">
                            <div className="w-8 h-8 rounded-lg bg-violet-100 text-violet-600 flex items-center justify-center">
                                <Eye size={16} />
                            </div>
                            <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider">Aperçu en Direct</h3>
                        </div>

                        <div className="flex-1 flex items-start justify-center">
                            <div className="w-full max-w-sm bg-white rounded-2xl border border-slate-200 p-5 shadow-lg space-y-4">
                                {localCoupons.length === 0 ? (
                                    <div className="py-12 text-center text-slate-400">
                                        <Ticket className="mx-auto mb-3 text-slate-300" size={32} />
                                        <p className="text-sm font-bold">Aucun code configuré</p>
                                        <p className="text-xs mt-1">Ajoutez des codes promo à gauche pour tester l'aperçu.</p>
                                    </div>
                                ) : (
                                    <>
                                        <PromoCodeSection
                                            config={previewConfig}
                                            lang="fr"
                                            promoCodeInput={previewInput}
                                            setPromoCodeInput={(v) => { setPreviewInput(v); setPreviewError(false); }}
                                            promoCodeError={previewError}
                                            promoCodeSuccess={previewSuccess}
                                            appliedPromoCode={previewApplied}
                                            onApply={handlePreviewApply}
                                            onRemove={handlePreviewRemove}
                                        />
                                        <SummarySection
                                            config={previewConfig}
                                            lang="fr"
                                            offerPrice={subtotal}
                                            shippingCost={600}
                                            promoDiscount={promoDiscount}
                                            totalPromoDiscount={promoDiscount.totalDiscount}
                                            displayedTotal={subtotal + 600 - promoDiscount.totalDiscount}
                                            appliedPromoCode={previewApplied}
                                            formatCurrency={(amount) => `${Math.floor(amount)} DA`}
                                        />
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // --- LIST VIEW ---
    return (
        <div className="space-y-6 pb-24">
            <div className="flex justify-between items-center bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
                <div>
                    <h2 className="text-xl font-bold text-slate-900">Profils Codes Promo</h2>
                    <p className="text-sm text-slate-500">Créez des campagnes de codes promo pour vos formulaires.</p>
                </div>
                <button
                    onClick={handleCreateNew}
                    className="group relative flex items-center gap-2.5 bg-gradient-to-r from-violet-600 to-purple-600 text-white px-6 py-3 rounded-2xl font-bold shadow-lg shadow-violet-200/50 hover:shadow-xl hover:shadow-violet-300/50 hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200"
                >
                    <Plus size={18} />
                    <span>Nouveau Profil</span>
                    <Sparkles size={14} className="opacity-50 group-hover:opacity-100 transition-opacity" />
                    <div className="absolute inset-0 rounded-2xl bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                </button>
            </div>

            {rules.length === 0 ? (
                <div className="bg-white rounded-3xl border-2 border-dashed border-slate-200 p-16 text-center">
                    <div className="w-16 h-16 rounded-2xl bg-violet-50 text-violet-500 flex items-center justify-center mx-auto mb-4">
                        <Ticket size={28} />
                    </div>
                    <h3 className="text-lg font-bold text-slate-700 mb-2">Aucun profil de codes promo</h3>
                    <p className="text-sm text-slate-400 mb-6">Créez votre premier profil pour commencer.</p>
                    <button onClick={handleCreateNew} className="inline-flex items-center gap-2 bg-violet-600 text-white px-6 py-2.5 rounded-xl font-bold hover:bg-violet-700 transition-colors">
                        <Plus size={18} /> Créer un profil
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {(rules as CouponRule[]).map((rule) => (
                        <div
                            key={rule.id}
                            onClick={() => handleEdit(rule)}
                            className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm hover:shadow-md hover:border-violet-300 transition-all cursor-pointer group flex flex-col"
                        >
                            <div className="flex justify-between items-start mb-4">
                                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-violet-50 to-purple-50 text-violet-600 flex items-center justify-center group-hover:from-violet-600 group-hover:to-purple-600 group-hover:text-white transition-all duration-300">
                                    <Ticket size={24} />
                                </div>
                                <button onClick={(e) => handleDelete(e, rule.id)} className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100">
                                    <Trash2 size={16} />
                                </button>
                            </div>
                            <h3 className="text-lg font-bold text-slate-800 mb-1">{rule.name || 'Sans nom'}</h3>
                            <p className="text-sm text-slate-500 mb-4">{rule.coupons?.length || 0} code(s)</p>
                            <div className="mt-auto pt-4 border-t border-slate-100 text-xs text-slate-400">
                                Mis à jour le {new Date(rule.updatedAt).toLocaleDateString()}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default CouponsPage;
