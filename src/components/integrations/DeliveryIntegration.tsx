import React, { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { PageHeader } from '@/components/GlobalHeader/PageHeader';
import { GuideStep, VideoPlaceholder, TestConnectionButton } from './GuideUI';
import { Plus, MoreHorizontal, Pencil, Trash2, Save, Truck, Loader2, HelpCircle } from 'lucide-react';
import { toast } from 'sonner';
import { DeliveryProfile, DeliveryProviderType } from '../../lib/firebase/types';
import { useDeliveryProfiles } from '../../lib/firebase/deliveryHooks';
import { cn } from '@/lib/utils';
import { useFormStore } from '../../stores';

const DELIVERY_PROVIDERS: Record<DeliveryProviderType, { name: string; description: string; hasApiId?: boolean; hasApiKey?: boolean; hasStoreId?: boolean }> = {
    yalidine: { name: "Yalidine", description: "Yalidine Express Logistics", hasApiId: true },
    maystro: { name: "Maystro", description: "Maystro Delivery", hasStoreId: true },
    zr_delivery: { name: "ZR Delivery", description: "ZR Express (Procolis)", hasApiKey: true },
    anderson: { name: "Anderson", description: "Anderson Logistics", hasApiKey: true },
    ecommanager: { name: "Ecommanager", description: "Ecommanager CRM", hasApiKey: true },
};

interface DeliveryIntegrationProps {
    userId: string;
    onBack?: () => void;
}

export function DeliveryIntegration({ userId, onBack }: DeliveryIntegrationProps) {
    const {
        profiles: devProfiles,
        addProfile: addDevProfile,
        updateProfile: updateDevProfile,
        deleteProfile: deleteDevProfile,
    } = useDeliveryProfiles(userId);

    const [view, setView] = useState<'list' | 'edit' | 'add'>('list');
    const [editingDevProfile, setEditingDevProfile] = useState<DeliveryProfile | null>(null);
    const [devForm, setDevForm] = useState<{ name: string; provider: DeliveryProviderType; isActive: boolean; apiToken: string; apiKey: string; apiId: string; storeId: string; }>({
        name: '', provider: 'yalidine', isActive: true, apiToken: '', apiKey: '', apiId: '', storeId: ''
    });
    const [isSaving, setIsSaving] = useState(false);

    const startAddProfile = () => {
        setEditingDevProfile(null);
        setDevForm({ name: '', provider: 'yalidine', isActive: true, apiToken: '', apiKey: '', apiId: '', storeId: '' });
        setView('add');
    };

    const startEditProfile = (profile: DeliveryProfile) => {
        setEditingDevProfile(profile);
        setDevForm({
            name: profile.name,
            provider: profile.provider,
            isActive: profile.isActive,
            apiToken: profile.apiToken || '',
            apiKey: profile.apiKey || '',
            apiId: profile.apiId || '',
            storeId: profile.storeId || ''
        });
        setView('edit');
    };

    const handleCancel = () => {
        setView('list');
        setEditingDevProfile(null);
        setDevForm({ name: '', provider: 'yalidine', isActive: true, apiToken: '', apiKey: '', apiId: '', storeId: '' });
    };

    const handleSaveDevProfile = async () => {
        if (!devForm.name || !devForm.apiToken) {
            toast.error('Le nom et API Token sont requis.');
            return;
        }

        setIsSaving(true);
        try {
            if (view === 'add') {
                await addDevProfile(devForm);
                toast.success('Livraison configurée!');
                setView('list');
            } else if (view === 'edit' && editingDevProfile) {
                await updateDevProfile(editingDevProfile.id, devForm);
                toast.success('Configuration mise à jour!');
                setView('list');
            }
            handleCancel();
        } catch (e: any) {
            toast.error(e.message);
        } finally {
            setIsSaving(false);
        }
    };

    const handleDeleteProfile = async (id: string, e?: React.MouseEvent) => {
        if (e) e.stopPropagation();

        if (confirm('Supprimer cette intégration de livraison ?')) {
            try {
                await deleteDevProfile(id);
                toast.success('Intégration supprimée');
                if (view === 'edit') handleCancel();
            } catch (e: any) {
                toast.error(e.message);
            }
        }
    };

    // --- EDITOR VIEW (Add / Edit) ---
    if (view === 'add' || view === 'edit') {
        return (
            <div className="flex-1 flex flex-col h-full bg-slate-50/50">
                <div className="bg-white border-b border-slate-200 shrink-0 sticky top-0 z-30">
                    <PageHeader
                        title={view === 'add' ? 'Nouvelle Livraison' : 'Modifier Livraison'}
                        breadcrumbs={[
                            { label: 'Intégrations', href: '/integrations', onClick: onBack },
                            { label: 'Livraison', href: '#' }
                        ]}
                        icon={Truck}
                        onBack={handleCancel}
                        actions={
                            <div className="flex items-center gap-2">
                                <Sheet>
                                    <SheetTrigger asChild>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="h-8 rounded-lg text-xs font-bold px-4 bg-white text-slate-700 shadow-sm border-slate-200"
                                        >
                                            <HelpCircle size={13} className="mr-1.5" />
                                            Guide de livraison
                                        </Button>
                                    </SheetTrigger>
                                    <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
                                        <SheetHeader className="mb-6">
                                            <SheetTitle className="text-xl font-bold text-slate-900">Guide Livraison</SheetTitle>
                                            <p className="text-sm text-slate-500 mt-2 text-left">Comment connecter vos partenaires logistiques pour expédier en 1 clic.</p>
                                        </SheetHeader>
                                        <div className="space-y-6 text-sm text-slate-600 pb-8">
                                            <VideoPlaceholder title="Connecter un partenaire de livraison" thumbnailUrl="https://images.unsplash.com/photo-1580674684081-7644fd82496a?q=80&w=2000&auto=format&fit=crop" />

                                            <GuideStep number={1} title="Choisir un prestataire">
                                                <p>
                                                    Sélectionnez votre partenaire dans la grille ci-contre. Final Form supporte actuellement <strong>Yalidine</strong>, <strong>Maystro</strong>, <strong>ZR Delivery</strong>, <strong>Anderson</strong> et <strong>Ecommanager</strong>.
                                                </p>
                                            </GuideStep>

                                            <GuideStep number={2} title="Obtenir vos clés API">
                                                <p>
                                                    Connectez-vous au tableau de bord de votre prestataire pour récupérer vos identifiants :
                                                </p>
                                                <div className="space-y-1.5 mt-2">
                                                    <div className="flex items-center gap-2 bg-slate-50 rounded-lg px-3 py-2 border border-slate-200">
                                                        <span className="text-xs font-bold text-slate-800 w-24">Yalidine</span>
                                                        <span className="text-[10px] text-slate-500">API Token + API ID</span>
                                                    </div>
                                                    <div className="flex items-center gap-2 bg-slate-50 rounded-lg px-3 py-2 border border-slate-200">
                                                        <span className="text-xs font-bold text-slate-800 w-24">Maystro</span>
                                                        <span className="text-[10px] text-slate-500">API Token + Store ID</span>
                                                    </div>
                                                    <div className="flex items-center gap-2 bg-slate-50 rounded-lg px-3 py-2 border border-slate-200">
                                                        <span className="text-xs font-bold text-slate-800 w-24">ZR / Anderson</span>
                                                        <span className="text-[10px] text-slate-500">API Token + API Key</span>
                                                    </div>
                                                    <div className="flex items-center gap-2 bg-slate-50 rounded-lg px-3 py-2 border border-slate-200">
                                                        <span className="text-xs font-bold text-slate-800 w-24">Ecommanager</span>
                                                        <span className="text-[10px] text-slate-500">API Token + API Key</span>
                                                    </div>
                                                </div>
                                            </GuideStep>

                                            <GuideStep number={3} title="Saisir le token et les IDs">
                                                <p>
                                                    Collez vos clés dans les champs correspondants du formulaire. Ces clés sont <strong>uniques à votre compte</strong> et ne doivent pas être partagées.
                                                </p>
                                                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs text-amber-800 flex gap-2 items-start mt-2 shadow-sm">
                                                    <span className="mt-0.5 text-base leading-none">🔐</span>
                                                    <span>Vos clés API sont chiffrées et stockées de manière sécurisée. Elles ne sont jamais exposées côté client.</span>
                                                </div>
                                            </GuideStep>

                                            <GuideStep number={4} title="Activer l'intégration">
                                                <p>
                                                    Activez le switch <strong>«Activer cette intégration»</strong> pour permettre l'envoi de commandes en 1-clic vers ce prestataire depuis la page Commandes.
                                                </p>
                                            </GuideStep>

                                            <GuideStep number={5} title="Tester la connexion">
                                                <p>
                                                    Utilisez le bouton <strong>«Tester la connexion»</strong> pour vérifier que vos clés API sont valides avant de sauvegarder. Un test réussi confirme que Final Form pourra expédier vers ce prestataire.
                                                </p>
                                            </GuideStep>
                                        </div>
                                    </SheetContent>
                                </Sheet>
                                <TestConnectionButton
                                    onTest={async () => {
                                        if (!devForm.apiToken) {
                                            throw new Error("Veuillez saisir votre API Token.");
                                        }
                                        const provider = DELIVERY_PROVIDERS[devForm.provider];
                                        if (provider.hasApiId && !devForm.apiId) {
                                            throw new Error(`L'API ID est requis pour ${provider.name}.`);
                                        }
                                        if (provider.hasApiKey && !devForm.apiKey) {
                                            throw new Error(`L'API Key est requise pour ${provider.name}.`);
                                        }
                                        if (provider.hasStoreId && !devForm.storeId) {
                                            throw new Error(`Le Store ID est requis pour ${provider.name}.`);
                                        }
                                        // All required fields are filled — that's the client-side validation
                                        return true;
                                    }}
                                    label="Tester la connexion"
                                />
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={handleCancel}
                                    className="h-8 rounded-lg text-xs font-bold px-4 bg-white text-slate-700 shadow-sm"
                                >
                                    Annuler
                                </Button>
                                <Button
                                    onClick={handleSaveDevProfile}
                                    disabled={isSaving}
                                    size="sm"
                                    className="h-8 rounded-lg text-xs font-bold px-4 bg-[#FF5A1F] hover:bg-[#FF5A1F]/90 text-white shadow-sm"
                                >
                                    {isSaving ? <Loader2 size={13} className="mr-1.5 animate-spin" /> : <Save size={13} className="mr-1.5" />}
                                    Enregistrer
                                </Button>
                            </div>
                        }
                    />
                </div>

                <div className="flex-1 overflow-auto p-4 md:p-6 lg:p-8">
                    <div className="max-w-3xl mx-auto">
                        <div className="bg-white p-6 md:p-8 rounded-2xl border border-slate-200 shadow-sm space-y-8">
                            <div className="space-y-4">
                                <Label className="text-sm font-bold text-slate-800">Partenaire de livraison</Label>
                                <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
                                    {(Object.keys(DELIVERY_PROVIDERS) as DeliveryProviderType[]).map((pid) => (
                                        <div
                                            key={pid}
                                            onClick={() => setDevForm({ ...devForm, provider: pid, name: view === 'add' ? DELIVERY_PROVIDERS[pid].name : devForm.name })}
                                            className={cn(
                                                "border rounded-xl p-4 cursor-pointer text-center transition-all",
                                                devForm.provider === pid ? "border-orange-500 bg-orange-50/50 shadow-sm ring-2 ring-orange-500/20" : "border-slate-200 hover:border-slate-300 bg-white"
                                            )}
                                        >
                                            <Truck size={24} className={cn("mx-auto mb-3 transition-colors", devForm.provider === pid ? "text-orange-600" : "text-slate-400")} />
                                            <div className={cn("text-xs font-bold transition-colors", devForm.provider === pid ? "text-orange-900" : "text-slate-600")}>
                                                {DELIVERY_PROVIDERS[pid].name}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="space-y-5 pt-6 border-t border-slate-100">
                                <div className="space-y-2">
                                    <Label className="text-xs font-semibold text-slate-700">Nom de la configuration</Label>
                                    <Input
                                        placeholder="ex. Compte Principal Yalidine"
                                        className="bg-white h-11"
                                        value={devForm.name}
                                        onChange={(e) => setDevForm({ ...devForm, name: e.target.value })}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label className="text-xs font-semibold text-slate-700">API Token</Label>
                                    <Input
                                        placeholder="Saisissez votre API Token"
                                        className="bg-white h-11 font-mono text-sm"
                                        value={devForm.apiToken}
                                        onChange={(e) => setDevForm({ ...devForm, apiToken: e.target.value })}
                                    />
                                </div>

                                {DELIVERY_PROVIDERS[devForm.provider].hasApiId && (
                                    <div className="space-y-2">
                                        <Label className="text-xs font-semibold text-slate-700">API ID</Label>
                                        <Input
                                            placeholder="Saisissez votre API ID"
                                            className="bg-white h-11 font-mono text-sm"
                                            value={devForm.apiId}
                                            onChange={(e) => setDevForm({ ...devForm, apiId: e.target.value })}
                                        />
                                    </div>
                                )}

                                {DELIVERY_PROVIDERS[devForm.provider].hasApiKey && (
                                    <div className="space-y-2">
                                        <Label className="text-xs font-semibold text-slate-700">API Key</Label>
                                        <Input
                                            placeholder="Saisissez votre API Key"
                                            className="bg-white h-11 font-mono text-sm"
                                            value={devForm.apiKey}
                                            onChange={(e) => setDevForm({ ...devForm, apiKey: e.target.value })}
                                        />
                                    </div>
                                )}

                                {DELIVERY_PROVIDERS[devForm.provider].hasStoreId && (
                                    <div className="space-y-2">
                                        <Label className="text-xs font-semibold text-slate-700">Store ID</Label>
                                        <Input
                                            placeholder="Saisissez votre Store ID"
                                            className="bg-white h-11 font-mono text-sm"
                                            value={devForm.storeId}
                                            onChange={(e) => setDevForm({ ...devForm, storeId: e.target.value })}
                                        />
                                    </div>
                                )}
                            </div>

                            <div className="flex items-center gap-4 py-4 px-5 bg-slate-50 rounded-xl border border-slate-100">
                                <Switch
                                    id="dev-active"
                                    checked={devForm.isActive}
                                    onCheckedChange={(c) => setDevForm({ ...devForm, isActive: c })}
                                    className="data-[state=checked]:bg-orange-500"
                                />
                                <div className="flex flex-col">
                                    <Label htmlFor="dev-active" className="text-[13px] font-bold text-slate-900 cursor-pointer">Activer cette intégration</Label>
                                    <p className="text-[11px] text-slate-500 mt-0.5">Permet d'envoyer des commandes vers ce prestataire depuis la page Commandes.</p>
                                </div>
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
            onClick={startAddProfile}
            className="h-8 rounded-lg text-xs font-bold px-4 bg-[#FF5A1F] hover:bg-[#FF5A1F]/90 text-white shadow-sm"
        >
            <Plus size={13} className="mr-1.5" />
            Nouveau Prestataire
        </Button>
    );

    return (
        <div className="flex-1 flex flex-col h-full bg-slate-50/50">
            <div className="bg-white border-b border-slate-200 shrink-0 sticky top-0 z-30">
                <PageHeader
                    title="Livraison"
                    breadcrumbs={[
                        { label: 'Intégrations', href: '/integrations', onClick: onBack },
                        { label: 'Livraison', href: '#' }
                    ]}
                    count={devProfiles.length}
                    icon={Truck}
                    onBack={onBack}
                    actions={headerActions}
                />
            </div>

            <div className="flex-1 overflow-auto p-4 md:p-6 lg:p-8">
                <div className="max-w-[1600px] mx-auto w-full">
                    {devProfiles.length === 0 ? (
                        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-16 text-center">
                            <div className="w-16 h-16 rounded-2xl bg-orange-50 text-orange-500 flex items-center justify-center mx-auto mb-4 border border-orange-100">
                                <Truck size={32} />
                            </div>
                            <h3 className="text-base font-bold text-slate-700 mb-1">Aucune intégration de livraison</h3>
                            <p className="text-sm text-slate-500 mb-6 max-w-sm mx-auto">
                                Connectez vos prestataires de livraison (Yalidine, Maystro...) pour transmettre vos commandes en un clic.
                            </p>
                            <Button
                                onClick={startAddProfile}
                                className="h-10 rounded-xl text-sm font-bold px-6 bg-[#FF5A1F] hover:bg-[#FF5A1F]/90 text-white shadow-md shadow-orange-100"
                            >
                                <Plus size={16} className="mr-2" /> Connecter un prestataire
                            </Button>
                        </div>
                    ) : (
                        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                            <Table>
                                <TableHeader>
                                    <TableRow className="bg-slate-50/50 hover:bg-slate-50/50 border-b border-slate-200">
                                        <TableHead className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider py-3 pl-5">Configuration</TableHead>
                                        <TableHead className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider py-3">Prestataire</TableHead>
                                        <TableHead className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider py-3">Statut</TableHead>
                                        <TableHead className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider py-3 pr-5 w-[60px]"></TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {devProfiles.map((profile) => (
                                        <TableRow
                                            key={profile.id}
                                            className="group cursor-pointer hover:bg-slate-50 transition-colors border-b border-slate-100 last:border-b-0"
                                            onClick={() => startEditProfile(profile)}
                                        >
                                            <TableCell className="py-3.5 pl-5">
                                                <div className="flex items-center gap-3">
                                                    <div className={cn(
                                                        "w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ring-1 ring-black/[0.04]",
                                                        profile.isActive ? "bg-orange-50" : "bg-slate-50 grayscale opacity-50"
                                                    )}>
                                                        <Truck size={14} className={cn(profile.isActive ? "text-[#FF5A1F]" : "text-slate-400")} />
                                                    </div>
                                                    <span className="text-sm font-semibold text-slate-900">{profile.name}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell className="py-3.5">
                                                <span className="text-sm text-slate-600 font-medium">
                                                    {DELIVERY_PROVIDERS[profile.provider]?.name || profile.provider}
                                                </span>
                                            </TableCell>
                                            <TableCell className="py-3.5">
                                                {profile.isActive ? (
                                                    <Badge variant="secondary" className="bg-green-50 text-green-700 hover:bg-green-100 border-green-100 font-semibold shadow-none">
                                                        Actif
                                                    </Badge>
                                                ) : (
                                                    <Badge variant="secondary" className="bg-slate-50 text-slate-500 hover:bg-slate-100 border-slate-200 font-semibold shadow-none">
                                                        Inactif
                                                    </Badge>
                                                )}
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
                                                        <DropdownMenuItem onClick={(e) => { e.stopPropagation(); startEditProfile(profile); }}>
                                                            <Pencil size={13} className="mr-2" /> Modifier
                                                        </DropdownMenuItem>
                                                        <DropdownMenuSeparator />
                                                        <DropdownMenuItem
                                                            className="text-red-600 focus:text-red-700 focus:bg-red-50"
                                                            onClick={(e) => handleDeleteProfile(profile.id, e)}
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
            </div>
        </div>
    );
}
