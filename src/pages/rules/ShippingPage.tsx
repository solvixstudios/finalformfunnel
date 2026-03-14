import React, { useState, useMemo, useCallback } from 'react';
import { Plus, Trash2, Save, Truck, MoreHorizontal, Pencil, Loader2, ChevronDown, MapPin, X } from 'lucide-react';
import { useFormRules, ShippingRule } from '@/hooks/useFormRules';
import ShippingManager, { ShippingConfig } from '@/components/managers/ShippingManager';
import { DeliverySection } from '@/components/FormTab/preview/sections/DeliverySection';
import { SummarySection } from '@/components/FormTab/preview/sections/SummarySection';
import { WILAYAS } from '@/lib/constants';
import { PageHeader } from '@/components/GlobalHeader/PageHeader';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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
    const [previewLang, setPreviewLang] = useState<'fr' | 'ar'>('fr');
    const [ruleLabels, setRuleLabels] = useState<string[]>([]);
    const [labelInput, setLabelInput] = useState('');

    const shippingCost = useMemo(() => {
        const exception = previewWilaya ? localShipping.exceptions?.find(ex => ex.id === previewWilaya) : null;
        if (exception) {
            return previewShippingType === 'home' ? exception.home : exception.desk;
        }
        return previewShippingType === 'home' ? localShipping.standard.home : localShipping.standard.desk;
    }, [previewWilaya, previewShippingType, localShipping]);

    const handleCreateNew = useCallback(() => {
        setEditingRule({ id: '', name: 'Nouveau Tarif', createdAt: 0, updatedAt: 0, shipping: defaultShipping });
        setLocalShipping(defaultShipping);
        setRuleName('Nouveau Tarif');
        setPreviewShippingType('home');
        setPreviewWilaya('');
        setRuleLabels([]);
        setLabelInput('');
    }, []);

    const handleEdit = (rule: ShippingRule) => {
        setEditingRule(rule);
        setLocalShipping(rule.shipping || defaultShipping);
        setRuleName(rule.name || 'Tarif sans nom');
        setPreviewShippingType('home');
        setPreviewWilaya('');
        setRuleLabels(rule.labels || []);
        setLabelInput('');
    };

    const handleSave = useCallback(async () => {
        if (!editingRule) return;
        setIsSaving(true);
        try {
            await saveRule({ ...editingRule, name: ruleName, labels: ruleLabels, shipping: localShipping });
            setEditingRule(null);
        } catch (error) {
            console.error("Error saving rule:", error);
        } finally {
            setIsSaving(false);
        }
    }, [editingRule, ruleName, ruleLabels, localShipping, saveRule]);

    const handleDelete = async (ruleId: string) => {
        if (confirm("Voulez-vous vraiment supprimer ce profil de livraison ?")) {
            await deleteRule(ruleId);
        }
    };

    const editorActions = useMemo(() => (
        <Button
            onClick={handleSave}
            disabled={isSaving}
            size="sm"
            className="h-8 rounded-lg text-xs font-bold px-4 shadow-sm"
        >
            {isSaving ? <Loader2 size={13} className="mr-1.5 animate-spin" /> : <Save size={13} className="mr-1.5" />}
            Enregistrer
        </Button>
    ), [isSaving, handleSave]);

    if (editingRule) {
        const subtotal = 3500;
        const homePrice = previewWilaya
            ? (localShipping.exceptions?.find(ex => ex.id === previewWilaya)?.home ?? localShipping.standard.home)
            : localShipping.standard.home;
        const deskPrice = previewWilaya
            ? (localShipping.exceptions?.find(ex => ex.id === previewWilaya)?.desk ?? localShipping.standard.desk)
            : localShipping.standard.desk;

        return (
            <div className="max-w-[1600px] mx-auto w-full flex flex-col pt-2 md:pt-4 pb-8 h-full">
                <PageHeader
                    title="Livraison"
                    breadcrumbs={[
                        { label: 'Rules', href: '/dashboard/rules/shipping' },
                        {
                            label: ruleName || 'Modifier',
                            editable: true,
                            onEdit: (value) => setRuleName(value),
                        },
                    ]}
                    icon={Truck}
                    backHref="/dashboard/rules/shipping"
                    onBack={() => setEditingRule(null)}
                    actions={editorActions}
                />

                {/* Labels Editor */}
                <div className="flex items-center gap-2 flex-wrap mt-2">
                    {ruleLabels.map(label => (
                        <span key={label} className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-50 text-emerald-600 text-[10px] font-bold rounded-lg border border-emerald-200">
                            {label}
                            <button onClick={() => setRuleLabels(ruleLabels.filter(l => l !== label))} className="hover:text-red-500 transition-colors">
                                <X size={10} />
                            </button>
                        </span>
                    ))}
                    <input
                        type="text"
                        value={labelInput}
                        onChange={(e) => setLabelInput(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' && labelInput.trim()) {
                                e.preventDefault();
                                const newLabel = labelInput.trim().toLowerCase();
                                if (!ruleLabels.includes(newLabel)) {
                                    setRuleLabels([...ruleLabels, newLabel]);
                                }
                                setLabelInput('');
                            }
                        }}
                        placeholder="+ Ajouter un label..."
                        className="px-2 py-0.5 text-[10px] font-medium bg-transparent border-none outline-none text-slate-400 placeholder:text-slate-300 w-28"
                    />
                </div>

                {/* Split Screen */}
                <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-5 min-h-0 mt-4">
                    {/* Left: Configuration */}
                    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 overflow-y-auto">
                        <ShippingManager shipping={localShipping} onShippingChange={setLocalShipping} />
                    </div>

                    {/* Right: Live Preview */}
                    <div className="bg-slate-50 rounded-xl border border-slate-200 p-5 flex flex-col">
                        {/* Language Toggle */}
                        <div className="flex items-center justify-end mb-3">
                            <div className="flex bg-white rounded-lg p-0.5 border border-slate-200 shadow-sm">
                                <button
                                    onClick={() => setPreviewLang('fr')}
                                    className={`px-3 py-1 rounded-md text-[10px] font-bold transition-all ${previewLang === 'fr' ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-500 hover:text-slate-700'
                                        }`}
                                >
                                    FR
                                </button>
                                <button
                                    onClick={() => setPreviewLang('ar')}
                                    className={`px-3 py-1 rounded-md text-[10px] font-bold transition-all ${previewLang === 'ar' ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-500 hover:text-slate-700'
                                        }`}
                                >
                                    AR
                                </button>
                            </div>
                        </div>
                        <div className="flex-1 flex items-start justify-center">
                            <div className={`w-full max-w-sm bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-4 ${previewLang === 'ar' ? 'text-right' : ''}`} dir={previewLang === 'ar' ? 'rtl' : 'ltr'}>
                                {/* Wilaya Selector */}
                                <div>
                                    <div className="flex items-center gap-1.5 mb-2">
                                        <MapPin size={12} className="text-slate-400" />
                                        <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Zone de livraison</span>
                                    </div>
                                    <div className="relative">
                                        <select
                                            value={previewWilaya}
                                            onChange={(e) => setPreviewWilaya(e.target.value)}
                                            className="w-full appearance-none px-3 py-2.5 text-sm font-medium border rounded-lg bg-white text-slate-800 cursor-pointer focus:border-slate-400 focus:ring-0 outline-none transition-colors border-slate-200"
                                        >
                                            <option value="">Tarif standard (par défaut)</option>
                                            {WILAYAS.map(w => (
                                                <option key={w.id} value={w.id}>{w.name}</option>
                                            ))}
                                        </select>
                                        <ChevronDown className="absolute right-3 top-3 text-slate-400 pointer-events-none" size={14} />
                                    </div>
                                    {previewWilaya && localShipping.exceptions?.find(ex => ex.id === previewWilaya) && (
                                        <p className="text-[10px] text-amber-600 font-semibold mt-1.5">⚡ Tarif spécial appliqué</p>
                                    )}
                                </div>

                                <DeliverySection
                                    config={PREVIEW_CONFIG}
                                    lang={previewLang}
                                    shippingType={previewShippingType}
                                    onSelect={setPreviewShippingType}
                                    formatCurrency={(amount) => `${amount} DA`}
                                    homePrice={homePrice}
                                    deskPrice={deskPrice}
                                    showSection={true}
                                    hasWilaya={true}
                                />

                                <SummarySection
                                    config={PREVIEW_CONFIG}
                                    lang={previewLang}
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
    const headerActions = useMemo(() => (
        <Button
            size="sm"
            onClick={handleCreateNew}
            className="h-8 rounded-lg text-xs font-bold px-4 shadow-sm"
        >
            <Plus size={13} className="mr-1.5" />
            Nouveau Profil
        </Button>
    ), [handleCreateNew]);

    return (
        <div className="max-w-[1600px] mx-auto w-full space-y-5 flex flex-col pt-2 md:pt-4 pb-8">
            <PageHeader
                title="Livraison"
                breadcrumbs={[{ label: 'Profils de Livraison' }]}
                count={rules.length}
                icon={Truck}
                actions={headerActions}
            />

            {loading ? (
                <div className="flex items-center justify-center p-12">
                    <Loader2 size={20} className="animate-spin text-slate-400" />
                </div>
            ) : rules.length === 0 ? (
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-16 text-center">
                    <div className="w-12 h-12 rounded-lg bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
                        <Truck size={22} />
                    </div>
                    <h3 className="text-sm font-bold text-slate-700 mb-1">Aucun profil de livraison</h3>
                    <p className="text-xs text-slate-400 mb-5">Créez votre premier profil pour commencer.</p>
                    <Button onClick={handleCreateNew} size="sm" className="h-8 rounded-lg text-xs font-bold px-4 shadow-sm">
                        <Plus size={13} className="mr-1.5" /> Créer un profil
                    </Button>
                </div>
            ) : (
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                    <Table>
                        <TableHeader>
                            <TableRow className="bg-slate-50/50 hover:bg-slate-50/50 border-b border-slate-200">
                                <TableHead className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider py-3 pl-5">Nom</TableHead>
                                <TableHead className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider py-3">Domicile</TableHead>
                                <TableHead className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider py-3">Bureau</TableHead>
                                <TableHead className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider py-3">Exceptions</TableHead>
                                <TableHead className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider py-3">Dernière mise à jour</TableHead>
                                <TableHead className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider py-3 pr-5 w-[60px]"></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {(rules as ShippingRule[]).map((rule) => (
                                <TableRow
                                    key={rule.id}
                                    className="group cursor-pointer hover:bg-slate-50 transition-colors border-b border-slate-100 last:border-b-0"
                                    onClick={() => handleEdit(rule)}
                                >
                                    <TableCell className="py-3.5 pl-5">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 bg-emerald-50 ring-1 ring-black/[0.04]">
                                                <Truck size={14} className="text-emerald-600" />
                                            </div>
                                            <div className="flex flex-col gap-1">
                                                <span className="text-sm font-semibold text-slate-900">{rule.name || 'Sans nom'}</span>
                                                {rule.labels && rule.labels.length > 0 && (
                                                    <div className="flex gap-1 flex-wrap">
                                                        {rule.labels.map(label => (
                                                            <span key={label} className="px-1.5 py-0.5 bg-emerald-50 text-emerald-600 text-[8px] font-bold rounded-md">{label}</span>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell className="py-3.5">
                                        <span className="text-sm font-medium text-slate-700 tabular-nums">{rule.shipping?.standard?.home || 0} DA</span>
                                    </TableCell>
                                    <TableCell className="py-3.5">
                                        <span className="text-sm font-medium text-slate-700 tabular-nums">{rule.shipping?.standard?.desk || 0} DA</span>
                                    </TableCell>
                                    <TableCell className="py-3.5">
                                        <Badge variant="secondary" className="h-5 px-2 text-[10px] font-semibold shadow-none rounded-md">
                                            {rule.shipping?.exceptions?.length || 0}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="py-3.5">
                                        <span className="text-xs text-slate-400 tabular-nums">
                                            {new Date(rule.updatedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                        </span>
                                    </TableCell>
                                    <TableCell className="py-3.5 pr-5 text-right">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8 rounded-md opacity-0 group-hover:opacity-100 transition-opacity text-slate-400 hover:text-slate-900 hover:bg-slate-100"
                                                    onClick={(e) => e.stopPropagation()}
                                                >
                                                    <MoreHorizontal size={16} />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end" className="w-44">
                                                <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleEdit(rule); }}>
                                                    <Pencil size={13} className="mr-2" /> Modifier
                                                </DropdownMenuItem>
                                                <DropdownMenuSeparator />
                                                <DropdownMenuItem
                                                    className="text-red-600 focus:text-red-700 focus:bg-red-50"
                                                    onClick={(e) => { e.stopPropagation(); handleDelete(rule.id); }}
                                                >
                                                    <Trash2 size={13} className="mr-2" /> Supprimer
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            )}
        </div>
    );
};

export default ShippingPage;
