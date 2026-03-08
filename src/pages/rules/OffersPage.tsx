import React, { useState } from 'react';
import { Plus, Settings2, Trash2, ArrowLeft, Save, Eye, Tag, Sparkles } from 'lucide-react';
import { useFormRules, OfferRule } from '@/hooks/useFormRules';
import PacksManager from '@/components/managers/PacksManager';
import { OffersSection } from '@/components/FormTab/preview/sections/OffersSection';
import { SummarySection } from '@/components/FormTab/preview/sections/SummarySection';
import type { FormConfig } from '@/types/form';

interface OffersPageProps {
    userId: string;
}

const PREVIEW_CONFIG: FormConfig = {
    accentColor: '#6366f1',
    borderRadius: '12px',
    textColor: '#334155',
    headingColor: '#1e293b',
    inputBorderColor: '#e2e8f0',
    inputBackground: '#f8fafc',
    enableOffersSection: true,
    enableSummarySection: true,
    sectionSettings: { offers: { showTitle: true }, summary: { showTitle: true } },
    translations: {
        offers: { fr: 'Choisissez votre offre', ar: 'اختر عرضك' },
        subtotal: { fr: 'Sous-total', ar: 'المجموع الفرعي' },
        shippingLabel: { fr: 'Livraison', ar: 'التوصيل' },
        total: { fr: 'Total', ar: 'المجموع' },
        free: { fr: 'Gratuit', ar: 'مجاني' },
    },
} as FormConfig;

const OffersPage: React.FC<OffersPageProps> = ({ userId }) => {
    const { rules, loading, saveRule, deleteRule } = useFormRules(userId, 'offers');
    const [editingRule, setEditingRule] = useState<OfferRule | null>(null);
    const [localOffers, setLocalOffers] = useState<any[]>([]);
    const [ruleName, setRuleName] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const [previewSelectedOffer, setPreviewSelectedOffer] = useState('');

    const handleCreateNew = () => {
        setEditingRule({ id: '', name: 'Nouvelles Offres', createdAt: 0, updatedAt: 0, offers: [] });
        setLocalOffers([]);
        setRuleName('Nouvelles Offres');
        setPreviewSelectedOffer('');
    };

    const handleEdit = (rule: OfferRule) => {
        setEditingRule(rule);
        setLocalOffers(rule.offers || []);
        setRuleName(rule.name || 'Offres sans nom');
        setPreviewSelectedOffer(rule.offers?.[0]?.id || '');
    };

    const handleSave = async () => {
        if (!editingRule) return;
        setIsSaving(true);
        try {
            await saveRule({ ...editingRule, name: ruleName, offers: localOffers });
            setEditingRule(null);
        } catch (error) {
            console.error("Error saving rule:", error);
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async (e: React.MouseEvent, ruleId: string) => {
        e.stopPropagation();
        if (confirm("Voulez-vous vraiment supprimer ce profil d'offres ?")) {
            await deleteRule(ruleId);
        }
    };

    if (loading) {
        return (
            <div className="flex h-full items-center justify-center p-12">
                <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    // --- EDITOR VIEW ---
    if (editingRule) {
        const basePrice = 3500;
        const selectedOffer = localOffers.find(o => o.id === previewSelectedOffer);
        const offerPrice = selectedOffer
            ? selectedOffer._type === 'perc'
                ? basePrice * selectedOffer.qty * (1 - selectedOffer.discount / 100)
                : basePrice * selectedOffer.qty - selectedOffer.discount
            : basePrice;

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
                        className="group relative flex items-center gap-2.5 bg-gradient-to-r from-indigo-600 to-violet-600 text-white px-7 py-3 rounded-2xl font-bold shadow-lg shadow-indigo-200/50 hover:shadow-xl hover:shadow-indigo-300/50 hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isSaving ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Save size={18} />}
                        <span>Enregistrer</span>
                        <div className="absolute inset-0 rounded-2xl bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </button>
                </div>

                {/* Split Screen */}
                <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-6 pb-24">
                    {/* Left: Configuration */}
                    <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm overflow-y-auto">
                        <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                            <Settings2 size={20} className="text-indigo-500" />
                            Configuration
                        </h2>
                        <div className="bg-[#F8F5F1] rounded-2xl p-4 sm:p-6 border border-slate-200 shadow-inner">
                            <PacksManager offers={localOffers} onOffersChange={setLocalOffers} />
                        </div>
                    </div>

                    {/* Right: Live Preview using real form sections */}
                    <div className="bg-slate-50 rounded-3xl border border-slate-200 p-6 flex flex-col">
                        <div className="flex items-center gap-2 mb-5">
                            <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-600 flex items-center justify-center">
                                <Eye size={16} />
                            </div>
                            <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider">Aperçu en Direct</h3>
                        </div>

                        <div className="flex-1 flex items-start justify-center">
                            <div className="w-full max-w-sm bg-white rounded-2xl border border-slate-200 p-5 shadow-lg space-y-4">
                                {localOffers.length === 0 ? (
                                    <div className="py-12 text-center text-slate-400">
                                        <Tag className="mx-auto mb-3 text-slate-300" size={32} />
                                        <p className="text-sm font-bold">Aucune offre configurée</p>
                                        <p className="text-xs mt-1">Ajoutez des offres à gauche pour voir l'aperçu.</p>
                                    </div>
                                ) : (
                                    <>
                                        <OffersSection
                                            config={PREVIEW_CONFIG}
                                            lang="fr"
                                            offers={localOffers}
                                            selectedOfferId={previewSelectedOffer}
                                            onSelect={setPreviewSelectedOffer}
                                            formatCurrency={(amount) => `${Math.floor(amount)} DA`}
                                            basePrice={basePrice}
                                        />
                                        <SummarySection
                                            config={PREVIEW_CONFIG}
                                            lang="fr"
                                            offerPrice={Math.max(0, offerPrice)}
                                            shippingCost={600}
                                            promoDiscount={{ subtotalDiscount: 0, shippingDiscount: 0, totalDiscount: 0 }}
                                            totalPromoDiscount={0}
                                            displayedTotal={Math.max(0, offerPrice) + 600}
                                            appliedPromoCode={null}
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
                    <h2 className="text-xl font-bold text-slate-900">Profils d'Offres</h2>
                    <p className="text-sm text-slate-500">Créez différents profils d'offres à utiliser sur vos formulaires.</p>
                </div>
                <button
                    onClick={handleCreateNew}
                    className="group relative flex items-center gap-2.5 bg-gradient-to-r from-indigo-600 to-violet-600 text-white px-6 py-3 rounded-2xl font-bold shadow-lg shadow-indigo-200/50 hover:shadow-xl hover:shadow-indigo-300/50 hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200"
                >
                    <Plus size={18} />
                    <span>Nouveau Profil</span>
                    <Sparkles size={14} className="opacity-50 group-hover:opacity-100 transition-opacity" />
                    <div className="absolute inset-0 rounded-2xl bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                </button>
            </div>

            {rules.length === 0 ? (
                <div className="bg-white rounded-3xl border-2 border-dashed border-slate-200 p-16 text-center">
                    <div className="w-16 h-16 rounded-2xl bg-indigo-50 text-indigo-500 flex items-center justify-center mx-auto mb-4">
                        <Tag size={28} />
                    </div>
                    <h3 className="text-lg font-bold text-slate-700 mb-2">Aucun profil d'offres</h3>
                    <p className="text-sm text-slate-400 mb-6">Créez votre premier profil pour commencer à le lier à vos formulaires.</p>
                    <button onClick={handleCreateNew} className="inline-flex items-center gap-2 bg-indigo-600 text-white px-6 py-2.5 rounded-xl font-bold hover:bg-indigo-700 transition-colors">
                        <Plus size={18} /> Créer un profil
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {(rules as OfferRule[]).map((rule) => (
                        <div
                            key={rule.id}
                            onClick={() => handleEdit(rule)}
                            className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm hover:shadow-md hover:border-indigo-300 transition-all cursor-pointer group flex flex-col"
                        >
                            <div className="flex justify-between items-start mb-4">
                                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-50 to-violet-50 text-indigo-600 flex items-center justify-center group-hover:from-indigo-600 group-hover:to-violet-600 group-hover:text-white transition-all duration-300">
                                    <Tag size={24} />
                                </div>
                                <button onClick={(e) => handleDelete(e, rule.id)} className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100">
                                    <Trash2 size={16} />
                                </button>
                            </div>
                            <h3 className="text-lg font-bold text-slate-800 mb-1">{rule.name || 'Sans nom'}</h3>
                            <p className="text-sm text-slate-500 mb-4">{rule.offers?.length || 0} offre(s)</p>
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

export default OffersPage;
