import React, { useState, useMemo, useCallback } from 'react';
import { Plus, Trash2, Save, Tag, MoreHorizontal, Pencil, Loader2, X } from 'lucide-react';
import { useFormRules, OfferRule } from '@/hooks/useFormRules';
import PacksManager from '@/components/managers/PacksManager';
import { OffersSection } from '@/components/FormTab/preview/sections/OffersSection';
import { SummarySection } from '@/components/FormTab/preview/sections/SummarySection';
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
    const [previewLang, setPreviewLang] = useState<'fr' | 'ar'>('fr');
    const [ruleLabels, setRuleLabels] = useState<string[]>([]);
    const [labelInput, setLabelInput] = useState('');

    const handleCreateNew = useCallback(() => {
        setEditingRule({ id: '', name: 'Nouvelles Offres', createdAt: 0, updatedAt: 0, offers: [] });
        setLocalOffers([]);
        setRuleName('Nouvelles Offres');
        setPreviewSelectedOffer('');
        setRuleLabels([]);
        setLabelInput('');
    }, []);

    const handleEdit = (rule: OfferRule) => {
        setEditingRule(rule);
        setLocalOffers(rule.offers || []);
        setRuleName(rule.name || 'Offres sans nom');
        setPreviewSelectedOffer(rule.offers?.[0]?.id || '');
        setRuleLabels(rule.labels || []);
        setLabelInput('');
    };

    const handleSave = useCallback(async () => {
        if (!editingRule) return;
        setIsSaving(true);
        try {
            await saveRule({ ...editingRule, name: ruleName, labels: ruleLabels, offers: localOffers });
            setEditingRule(null);
        } catch (error) {
            console.error("Error saving rule:", error);
        } finally {
            setIsSaving(false);
        }
    }, [editingRule, ruleName, ruleLabels, localOffers, saveRule]);

    const handleDelete = async (ruleId: string) => {
        if (confirm("Voulez-vous vraiment supprimer ce profil d'offres ?")) {
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
        const basePrice = 3500;
        const selectedOffer = localOffers.find(o => o.id === previewSelectedOffer);
        const offerPrice = selectedOffer
            ? selectedOffer._type === 'perc'
                ? basePrice * selectedOffer.qty * (1 - selectedOffer.discount / 100)
                : basePrice * selectedOffer.qty - selectedOffer.discount
            : basePrice;

        return (
            <div className="max-w-[1600px] mx-auto w-full flex flex-col pt-2 md:pt-4 pb-8 h-full">
                <PageHeader
                    title="Offres"
                    breadcrumbs={[
                        { label: 'Rules', href: '/dashboard/rules/offers' },
                        {
                            label: ruleName || 'Modifier',
                            editable: true,
                            onEdit: (value) => setRuleName(value),
                        },
                    ]}
                    icon={Tag}
                    backHref="/dashboard/rules/offers"
                    onBack={() => setEditingRule(null)}
                    actions={editorActions}
                />

                {/* Labels Editor */}
                <div className="flex items-center gap-2 flex-wrap mt-2">
                    {ruleLabels.map(label => (
                        <span key={label} className="inline-flex items-center gap-1 px-2 py-0.5 bg-indigo-50 text-indigo-600 text-[10px] font-bold rounded-lg border border-indigo-200">
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
                        <PacksManager offers={localOffers} onOffersChange={setLocalOffers} />
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
                                {localOffers.length === 0 ? (
                                    <div className="py-10 text-center text-slate-400">
                                        <Tag className="mx-auto mb-2 text-slate-300" size={28} />
                                        <p className="text-xs font-semibold">Aucune offre configurée</p>
                                        <p className="text-[11px] mt-1">Ajoutez des offres à gauche.</p>
                                    </div>
                                ) : (
                                    <>
                                        <OffersSection
                                            config={PREVIEW_CONFIG}
                                            lang={previewLang}
                                            offers={localOffers}
                                            selectedOfferId={previewSelectedOffer}
                                            onSelect={setPreviewSelectedOffer}
                                            formatCurrency={(amount) => `${Math.floor(amount)} DA`}
                                            basePrice={basePrice}
                                        />
                                        <SummarySection
                                            config={PREVIEW_CONFIG}
                                            lang={previewLang}
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
                title="Offres"
                breadcrumbs={[{ label: 'Profils d\'Offres' }]}
                count={rules.length}
                icon={Tag}
                actions={headerActions}
            />

            {loading ? (
                <div className="flex items-center justify-center p-12">
                    <Loader2 size={20} className="animate-spin text-slate-400" />
                </div>
            ) : rules.length === 0 ? (
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-16 text-center">
                    <div className="w-12 h-12 rounded-lg bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
                        <Tag size={22} />
                    </div>
                    <h3 className="text-sm font-bold text-slate-700 mb-1">Aucun profil d'offres</h3>
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
                                <TableHead className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider py-3">Offres</TableHead>
                                <TableHead className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider py-3">Dernière mise à jour</TableHead>
                                <TableHead className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider py-3 pr-5 w-[60px]"></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {(rules as OfferRule[]).map((rule) => (
                                <TableRow
                                    key={rule.id}
                                    className="group cursor-pointer hover:bg-slate-50 transition-colors border-b border-slate-100 last:border-b-0"
                                    onClick={() => handleEdit(rule)}
                                >
                                    <TableCell className="py-3.5 pl-5">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 bg-indigo-50 ring-1 ring-black/[0.04]">
                                                <Tag size={14} className="text-indigo-600" />
                                            </div>
                                            <div className="flex flex-col gap-1">
                                                <span className="text-sm font-semibold text-slate-900">{rule.name || 'Sans nom'}</span>
                                                {rule.labels && rule.labels.length > 0 && (
                                                    <div className="flex gap-1 flex-wrap">
                                                        {rule.labels.map(label => (
                                                            <span key={label} className="px-1.5 py-0.5 bg-indigo-50 text-indigo-600 text-[8px] font-bold rounded-md">{label}</span>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell className="py-3.5">
                                        <Badge variant="secondary" className="h-5 px-2 text-[10px] font-semibold shadow-none rounded-md">
                                            {rule.offers?.length || 0} offre(s)
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

export default OffersPage;
