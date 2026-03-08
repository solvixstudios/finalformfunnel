import React, { useState, useMemo } from 'react';
import { Plus, Trash2, ArrowLeft, Save, Eye, Truck, Sparkles, ChevronDown, MapPin } from 'lucide-react';
import { useFormRules, ShippingRule } from '@/hooks/useFormRules';
import ShippingManager, { ShippingConfig } from '@/components/managers/ShippingManager';
import { DeliverySection } from '@/components/FormTab/preview/sections/DeliverySection';
import { SummarySection } from '@/components/FormTab/preview/sections/SummarySection';
import { WILAYAS } from '@/lib/constants';
import type { FormConfig } from '@/types/form';

interface ShippingPageProps {
    userId: string;
}

const defaultShipping: ShippingConfig = {
    standard: { home: 600, desk: 400 },
    exceptions: [],
    freeShipping: { enabled: false, threshold: 0 },
};

const PREVIEW_CONFIG: FormConfig = {
    accentColor: '#10b981',
    borderRadius: '12px',
    textColor: '#334155',
    headingColor: '#1e293b',
    inputBorderColor: '#e2e8f0',
    inputBackground: '#f8fafc',
    enableHomeDelivery: true,
    enableDeskDelivery: true,
    enableSummarySection: true,
    sectionSettings: {
        delivery: { showTitle: true },
        summary: { showTitle: true },
    },
    translations: {
        delivery: { fr: 'Mode de livraison', ar: 'طريقة التوصيل' },
        home: { fr: 'À domicile', ar: 'إلى المنزل' },
        desk: { fr: 'En bureau', ar: 'في المكتب' },
        subtotal: { fr: 'Sous-total', ar: 'المجموع الفرعي' },
        shippingLabel: { fr: 'Livraison', ar: 'التوصيل' },
        total: { fr: 'Total', ar: 'المجموع' },
        free: { fr: 'Gratuit', ar: 'مجاني' },
        unavailable: { fr: 'Indisponible', ar: 'غير متاح' },
    },
} as FormConfig;

const ShippingPage: React.FC<ShippingPageProps> = ({ userId }) => {
    const { rules, loading, saveRule, deleteRule } = useFormRules(userId, 'shipping');
    const [editingRule, setEditingRule] = useState<ShippingRule | null>(null);
    const [localShipping, setLocalShipping] = useState<ShippingConfig>(defaultShipping);
    const [ruleName, setRuleName] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const [previewShippingType, setPreviewShippingType] = useState<'home' | 'desk'>('home');
    const [previewWilaya, setPreviewWilaya] = useState('');

    // Compute the effective shipping cost based on selected wilaya + exceptions
    const shippingCost = useMemo(() => {
        if (!previewWilaya) {
            return previewShippingType === 'home' ? localShipping.standard.home : localShipping.standard.desk;
        }
        // Check for exception
        const exception = localShipping.exceptions?.find(ex => ex.id === previewWilaya);
        if (exception) {
            return previewShippingType === 'home' ? exception.home : exception.desk;
        }
        return previewShippingType === 'home' ? localShipping.standard.home : localShipping.standard.desk;
    }, [previewWilaya, previewShippingType, localShipping]);

    const handleCreateNew = () => {
        setEditingRule({ id: '', name: 'Nouveau Tarif', createdAt: 0, updatedAt: 0, shipping: defaultShipping });
        setLocalShipping(defaultShipping);
        setRuleName('Nouveau Tarif');
        setPreviewShippingType('home');
        setPreviewWilaya('');
    };

    const handleEdit = (rule: ShippingRule) => {
        setEditingRule(rule);
        setLocalShipping(rule.shipping || defaultShipping);
        setRuleName(rule.name || 'Tarif sans nom');
        setPreviewShippingType('home');
        setPreviewWilaya('');
    };

    const handleSave = async () => {
        if (!editingRule) return;
        setIsSaving(true);
        try {
            await saveRule({ ...editingRule, name: ruleName, shipping: localShipping });
            setEditingRule(null);
        } catch (error) {
            console.error("Error saving rule:", error);
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async (e: React.MouseEvent, ruleId: string) => {
        e.stopPropagation();
        if (confirm("Voulez-vous vraiment supprimer ce profil de livraison ?")) {
            await deleteRule(ruleId);
        }
    };

    if (loading) {
        return (
            <div className="flex h-full items-center justify-center p-12">
                <div className="w-8 h-8 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    // --- EDITOR VIEW ---
    if (editingRule) {
        const subtotal = 3500;

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
                        className="group relative flex items-center gap-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 text-white px-7 py-3 rounded-2xl font-bold shadow-lg shadow-emerald-200/50 hover:shadow-xl hover:shadow-emerald-300/50 hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
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
                            <Truck size={20} className="text-emerald-500" />
                            Frais de Livraison
                        </h2>
                        <div className="bg-[#F8F5F1] rounded-2xl p-4 sm:p-6 border border-slate-200 shadow-inner">
                            <ShippingManager shipping={localShipping} onShippingChange={setLocalShipping} />
                        </div>
                    </div>

                    {/* Right: Live Preview */}
                    <div className="bg-slate-50 rounded-3xl border border-slate-200 p-6 flex flex-col">
                        <div className="flex items-center gap-2 mb-5">
                            <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center">
                                <Eye size={16} />
                            </div>
                            <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider">Aperçu en Direct</h3>
                        </div>

                        <div className="flex-1 flex items-start justify-center">
                            <div className="w-full max-w-sm bg-white rounded-2xl border border-slate-200 p-5 shadow-lg space-y-4">
                                {/* Wilaya Selector — for testing shipping rates */}
                                <div>
                                    <div className="flex items-center gap-2 mb-2">
                                        <MapPin size={14} className="text-emerald-600" />
                                        <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Zone de livraison</span>
                                    </div>
                                    <div className="relative">
                                        <select
                                            value={previewWilaya}
                                            onChange={(e) => setPreviewWilaya(e.target.value)}
                                            className="w-full appearance-none px-4 py-3 text-sm font-semibold border-2 rounded-xl bg-slate-50 text-slate-800 cursor-pointer focus:border-emerald-400 focus:ring-0 outline-none transition-colors"
                                            style={{ borderColor: '#e2e8f0' }}
                                        >
                                            <option value="">Tarif standard (par défaut)</option>
                                            {WILAYAS.map(w => (
                                                <option key={w.id} value={w.id}>{w.name}</option>
                                            ))}
                                        </select>
                                        <ChevronDown className="absolute right-4 top-3.5 text-slate-400 pointer-events-none" size={16} />
                                    </div>
                                    {previewWilaya && localShipping.exceptions?.find(ex => ex.id === previewWilaya) && (
                                        <p className="text-[10px] text-amber-600 font-bold mt-1.5 flex items-center gap-1">
                                            ⚡ Tarif spécial appliqué pour cette wilaya
                                        </p>
                                    )}
                                </div>

                                {/* Delivery Type Selector */}
                                <DeliverySection
                                    config={PREVIEW_CONFIG}
                                    lang="fr"
                                    shippingType={previewShippingType}
                                    onSelect={setPreviewShippingType}
                                    formatCurrency={(amount) => `${amount} DA`}
                                    homePrice={
                                        previewWilaya
                                            ? (localShipping.exceptions?.find(ex => ex.id === previewWilaya)?.home ?? localShipping.standard.home)
                                            : localShipping.standard.home
                                    }
                                    deskPrice={
                                        previewWilaya
                                            ? (localShipping.exceptions?.find(ex => ex.id === previewWilaya)?.desk ?? localShipping.standard.desk)
                                            : localShipping.standard.desk
                                    }
                                    showSection={true}
                                    hasWilaya={true}
                                />

                                {/* Order Summary */}
                                <SummarySection
                                    config={PREVIEW_CONFIG}
                                    lang="fr"
                                    offerPrice={subtotal}
                                    shippingCost={shippingCost}
                                    promoDiscount={{ subtotalDiscount: 0, shippingDiscount: 0, totalDiscount: 0 }}
                                    totalPromoDiscount={0}
                                    displayedTotal={subtotal + shippingCost}
                                    appliedPromoCode={null}
                                    formatCurrency={(amount) => `${Math.floor(amount)} DA`}
                                />
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
                    <h2 className="text-xl font-bold text-slate-900">Profils de Livraison</h2>
                    <p className="text-sm text-slate-500">Créez des grilles tarifaires de livraison pour vos formulaires.</p>
                </div>
                <button
                    onClick={handleCreateNew}
                    className="group relative flex items-center gap-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 text-white px-6 py-3 rounded-2xl font-bold shadow-lg shadow-emerald-200/50 hover:shadow-xl hover:shadow-emerald-300/50 hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200"
                >
                    <Plus size={18} />
                    <span>Nouveau Profil</span>
                    <Sparkles size={14} className="opacity-50 group-hover:opacity-100 transition-opacity" />
                    <div className="absolute inset-0 rounded-2xl bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                </button>
            </div>

            {rules.length === 0 ? (
                <div className="bg-white rounded-3xl border-2 border-dashed border-slate-200 p-16 text-center">
                    <div className="w-16 h-16 rounded-2xl bg-emerald-50 text-emerald-500 flex items-center justify-center mx-auto mb-4">
                        <Truck size={28} />
                    </div>
                    <h3 className="text-lg font-bold text-slate-700 mb-2">Aucun profil de livraison</h3>
                    <p className="text-sm text-slate-400 mb-6">Créez votre premier profil pour commencer.</p>
                    <button onClick={handleCreateNew} className="inline-flex items-center gap-2 bg-emerald-600 text-white px-6 py-2.5 rounded-xl font-bold hover:bg-emerald-700 transition-colors">
                        <Plus size={18} /> Créer un profil
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {(rules as ShippingRule[]).map((rule) => (
                        <div
                            key={rule.id}
                            onClick={() => handleEdit(rule)}
                            className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm hover:shadow-md hover:border-emerald-300 transition-all cursor-pointer group flex flex-col"
                        >
                            <div className="flex justify-between items-start mb-4">
                                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-50 to-teal-50 text-emerald-600 flex items-center justify-center group-hover:from-emerald-600 group-hover:to-teal-600 group-hover:text-white transition-all duration-300">
                                    <Truck size={24} />
                                </div>
                                <button onClick={(e) => handleDelete(e, rule.id)} className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100">
                                    <Trash2 size={16} />
                                </button>
                            </div>
                            <h3 className="text-lg font-bold text-slate-800 mb-1">{rule.name || 'Sans nom'}</h3>
                            <div className="flex gap-4 text-sm text-slate-500 mb-4">
                                <span>Dom: {rule.shipping?.standard?.home || 0} DA</span>
                                <span>Bur: {rule.shipping?.standard?.desk || 0} DA</span>
                            </div>
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

export default ShippingPage;
