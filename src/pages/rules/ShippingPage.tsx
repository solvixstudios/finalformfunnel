import React, { useState, useMemo } from 'react';
import { Plus, Trash2, ArrowLeft, Save, Eye, Truck, MoreHorizontal, Pencil, Loader2, ChevronDown, MapPin } from 'lucide-react';
import { useFormRules, ShippingRule } from '@/hooks/useFormRules';
import ShippingManager, { ShippingConfig } from '@/components/managers/ShippingManager';
import { DeliverySection } from '@/components/FormTab/preview/sections/DeliverySection';
import { SummarySection } from '@/components/FormTab/preview/sections/SummarySection';
import { WILAYAS } from '@/lib/constants';
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

    const shippingCost = useMemo(() => {
        const exception = previewWilaya ? localShipping.exceptions?.find(ex => ex.id === previewWilaya) : null;
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

    const handleDelete = async (ruleId: string) => {
        if (confirm("Voulez-vous vraiment supprimer ce profil de livraison ?")) {
            await deleteRule(ruleId);
        }
    };

    // --- EDITOR VIEW ---
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
                        { label: ruleName || 'Modifier' },
                    ]}
                    icon={Truck}
                    backHref="/dashboard/rules/shipping"
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
                        <h2 className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-4">Frais de Livraison</h2>
                        <div className="bg-[#F8F5F1] rounded-xl p-4 sm:p-5 border border-slate-200">
                            <ShippingManager shipping={localShipping} onShippingChange={setLocalShipping} />
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
                                    lang="fr"
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
                                            <span className="text-sm font-semibold text-slate-900">{rule.name || 'Sans nom'}</span>
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
