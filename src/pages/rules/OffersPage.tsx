import React, { useState } from 'react';
import { Plus, Trash2, ArrowLeft, Save, Eye, Tag, MoreHorizontal, Pencil, Loader2 } from 'lucide-react';
import { useFormRules, OfferRule } from '@/hooks/useFormRules';
import PacksManager from '@/components/managers/PacksManager';
import { OffersSection } from '@/components/FormTab/preview/sections/OffersSection';
import { SummarySection } from '@/components/FormTab/preview/sections/SummarySection';
import { PageHeader } from '@/components/GlobalHeader/PageHeader';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
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

    const handleDelete = async (ruleId: string) => {
        if (confirm("Voulez-vous vraiment supprimer ce profil d'offres ?")) {
            await deleteRule(ruleId);
        }
    };

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
            <div className="max-w-[1600px] mx-auto w-full flex flex-col pt-2 md:pt-4 pb-8 h-full">
                <PageHeader
                    title="Offres"
                    breadcrumbs={[
                        { label: 'Rules', href: '/dashboard/rules/offers' },
                        { label: ruleName || 'Modifier' },
                    ]}
                    icon={Tag}
                    backHref="/dashboard/rules/offers"
                    onBack={() => setEditingRule(null)}
                    actions={
                        <Button
                            onClick={handleSave}
                            disabled={isSaving}
                            size="sm"
                            className="h-8 rounded-lg text-xs font-bold px-4 bg-[#FF5A1F] hover:bg-[#E04D1A] text-white shadow-sm"
                        >
                            {isSaving ? <Loader2 size={13} className="mr-1.5 animate-spin" /> : <Save size={13} className="mr-1.5" />}
                            Enregistrer
                        </Button>
                    }
                />

                {/* Editable Name */}
                <div className="mb-5 pt-2">
                    <Input
                        value={ruleName}
                        onChange={(e) => setRuleName(e.target.value)}
                        className="text-lg font-bold text-slate-900 bg-white border-slate-200 rounded-lg h-11 px-4 shadow-sm focus:ring-1 focus:ring-slate-900/5 max-w-md"
                        placeholder="Nom du profil"
                    />
                </div>

                {/* Split Screen */}
                <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-6 min-h-0">
                    {/* Left: Configuration */}
                    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 overflow-y-auto">
                        <h2 className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-4">Configuration</h2>
                        <div className="bg-[#F8F5F1] rounded-xl p-4 sm:p-5 border border-slate-200">
                            <PacksManager offers={localOffers} onOffersChange={setLocalOffers} />
                        </div>
                    </div>

                    {/* Right: Live Preview */}
                    <div className="bg-slate-50 rounded-xl border border-slate-200 p-5 flex flex-col">
                        <div className="flex items-center gap-2 mb-4">
                            <Eye size={14} className="text-slate-400" />
                            <h3 className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Aperçu en Direct</h3>
                        </div>

                        <div className="flex-1 flex items-start justify-center">
                            <div className="w-full max-w-sm bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-4">
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
    const headerActions = (
        <Button
            size="sm"
            onClick={handleCreateNew}
            className="h-8 rounded-lg text-xs font-bold px-4 bg-[#FF5A1F] hover:bg-[#FF5A1F]/90 text-white shadow-sm"
        >
            <Plus size={13} className="mr-1.5" />
            Nouveau Profil
        </Button>
    );

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
                    <Button onClick={handleCreateNew} size="sm" className="h-8 rounded-lg text-xs font-bold px-4 bg-[#FF5A1F] hover:bg-[#FF5A1F]/90 text-white">
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
                                            <span className="text-sm font-semibold text-slate-900">{rule.name || 'Sans nom'}</span>
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
