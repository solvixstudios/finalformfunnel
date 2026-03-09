import React, { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBoxOpen } from '@fortawesome/free-solid-svg-icons';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { PageHeader } from '@/components/GlobalHeader/PageHeader';
import { GuideStep, VideoPlaceholder, CopyButton, TestConnectionButton } from './GuideUI';
import {
    Activity,
    Check,
    Copy,
    ExternalLink,
    Loader2,
    MoreHorizontal,
    Plus,
    RotateCw,
    Store,
    Trash2,
    HelpCircle
} from 'lucide-react';
import { toast } from 'sonner';
import { useConnectedStores } from '@/lib/firebase/hooks';
import { cn } from '@/lib/utils';
// @ts-ignore
import feedData from '../../../feed.json';

// --- Helper Components ---
const WoocommerceGuide = () => (
    <div className="py-2 animate-in fade-in duration-300">
        <VideoPlaceholder title="Connecter WooCommerce à Final Form (Guide)" thumbnailUrl="https://images.unsplash.com/photo-1614332287897-cdc485fa562d?q=80&w=2000&auto=format&fit=crop" />

        <GuideStep number={1} title="Accéder aux paramètres de l'API REST">
            <p>
                Connectez-vous à votre tableau de bord administrateur WordPress et allez dans <strong>WooCommerce &gt; Réglages</strong>.
            </p>
            <p>
                Cliquez sur l'onglet <strong>Avancé</strong> et sélectionnez <strong>API REST</strong> dans le sous-menu.
            </p>
        </GuideStep>

        <GuideStep number={2} title="Créer des clés d'API">
            <ul className="list-disc list-outside ml-4 space-y-1.5 text-slate-600">
                <li>Cliquez sur <strong>Ajouter une clé</strong> ou <strong>Créer une clé d'API</strong>.</li>
                <li>Ajoutez une description (ex. "Final Form").</li>
                <li>Sélectionnez un Utilisateur dans la liste déroulante (doit être un administrateur).</li>
                <li>Définissez les autorisations sur <strong>Lecture/Écriture</strong>.</li>
            </ul>
        </GuideStep>

        <GuideStep number={3} title="Générer et copier les clés">
            <p>
                Cliquez sur <strong>Générer une clé d'API</strong>. WooCommerce va générer les clés pour l'utilisateur sélectionné.
            </p>
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs text-amber-800 flex gap-2 items-start mt-2 shadow-sm">
                <span className="mt-0.5 text-base leading-none">⚠️</span>
                <span>Assurez-vous de copier ces clés immédiatement, car vous ne pourrez plus voir le Secret Consommateur une fois la page quittée.</span>
            </div>
        </GuideStep>

        <GuideStep number={4} title="Configurer les Permaliens">
            <p>
                Assurez-vous que vos permaliens WordPress sont configurés correctement. Allez dans <strong>Réglages &gt; Permaliens</strong> et sélectionnez "Titre de la publication" (ou tout autre format qui n'est pas "Simple"). L'API REST a besoin de beaux permaliens pour fonctionner.
            </p>
        </GuideStep>
    </div>
);

// Custom Icon
const WooIcon = () => (
    <FontAwesomeIcon icon={faBoxOpen} className="text-[#96588a] text-xl md:text-2xl" />
);

interface WoocommerceIntegrationProps {
    userId: string;
    onBack?: () => void;
}

export function WoocommerceIntegration({ userId, onBack }: WoocommerceIntegrationProps) {
    const { stores, addStore, deleteStore } = useConnectedStores(userId);

    const [view, setView] = useState<'list' | 'add'>('list');
    const [addTab, setAddTab] = useState<'setup' | 'guide'>('setup');
    const [isConnecting, setIsConnecting] = useState(false);
    const [processingStoreId, setProcessingStoreId] = useState<string | null>(null);

    const [wooForm, setWooForm] = useState({
        domain: (feedData as any).woocommerce?.domain || '',
        consumerKey: (feedData as any).woocommerce?.consumerKey || '',
        consumerSecret: (feedData as any).woocommerce?.consumerSecret || '',
    });

    // Get all connected WooCommerce stores
    const wooStores = stores.filter((s) => s.platform === 'woocommerce');

    const handleCancel = () => {
        setView('list');
        setWooForm({ domain: '', consumerKey: '', consumerSecret: '' });
    };

    const handleConnect = async () => {
        if (!wooForm.domain || !wooForm.consumerKey || !wooForm.consumerSecret) {
            toast.error('Veuillez remplir tous les champs.');
            return;
        }

        const cleanDomain = wooForm.domain
            .replace(/https?:\/\//, '')
            .replace(/\/$/, '')
            .trim();

        setIsConnecting(true);
        try {
            // Note: WooCommerceAdapter is currently a stub in this environment.
            // Placeholder logic until full WooCommerce sync is implemented.
            await new Promise((resolve) => setTimeout(resolve, 1500));

            // Add WooCommerce store to the profile
            await addStore({
                name: `WooCommerce - ${cleanDomain}`,
                platform: 'woocommerce',
                url: cleanDomain,
                shopifyDomain: cleanDomain, // Reused column structure
                clientId: wooForm.consumerKey.trim(), // Storing as clientId for consistency
                clientSecret: wooForm.consumerSecret.trim(), // Storing as clientSecret
                loaderInstalled: false, // WooCommerce doesn't use the exact same loader system yet, but keep field
            });

            toast.success(`Boutique WooCommerce connectée : ${cleanDomain} !`);
            toast.info("La synchronisation des produits et commandes WooCommerce est en version bêta.");

            setView('list');
            setWooForm({ domain: '', consumerKey: '', consumerSecret: '' });
        } catch (error: any) {
            console.error(error);
            if (error.message === 'STORE_ALREADY_OWNED') {
                toast.error('Cette boutique est déjà liée à un autre compte.');
            } else if (error.message === 'STORE_ALREADY_CONNECTED') {
                toast.error('Cette boutique est déjà connectée à votre compte.');
            } else {
                toast.error(error.message || 'Une erreur inattendue est survenue.');
            }
        } finally {
            setIsConnecting(false);
        }
    };

    const handleDeleteStore = async (storeId: string) => {
        if (confirm('Voulez-vous vraiment déconnecter cette boutique ? Toutes les configurations liées seront perdues.')) {
            setProcessingStoreId(storeId);
            try {
                await deleteStore(storeId);
                toast.success('Boutique déconnectée avec succès.');
            } catch (error: any) {
                console.error(error);
                toast.error(error.message || 'Impossible de déconnecter la boutique.');
            } finally {
                setProcessingStoreId(null);
            }
        }
    };

    const handleRefreshProducts = async (store: any) => {
        setProcessingStoreId(store.id);
        const loadingToast = toast.loading('Synchronisation des produits...');

        try {
            // Simulate sync for WooCommerce (beta)
            await new Promise((resolve) => setTimeout(resolve, 2000));
            toast.success(`Produits mis à jour de manière simulée (Beta).`);
        } catch (error: any) {
            console.error("Refresh failed:", error);
            toast.error(error.message || 'La synchronisation a échoué.');
        } finally {
            toast.dismiss(loadingToast);
            setProcessingStoreId(null);
        }
    };

    // --- EDITOR VIEW (Add Store) ---
    if (view === 'add') {
        return (
            <div className="flex-1 flex flex-col h-full bg-slate-50/50">
                <div className="bg-white border-b border-slate-200 shrink-0 sticky top-0 z-30">
                    <PageHeader
                        title="Connecter une boutique WooCommerce"
                        breadcrumbs={[
                            { label: 'Intégrations', href: '/integrations', onClick: onBack },
                            { label: 'WooCommerce', href: '#' }
                        ]}
                        icon={WooIcon}
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
                                            Guide d'intégration
                                        </Button>
                                    </SheetTrigger>
                                    <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
                                        <SheetHeader className="mb-6">
                                            <SheetTitle className="text-xl font-bold text-slate-900">Guide d'intégration WooCommerce</SheetTitle>
                                            <p className="text-sm text-slate-500 mt-2 text-left">Suivez ces étapes dans votre panel WordPress pour générer les clés d'API REST nécessaires.</p>
                                        </SheetHeader>
                                        <WoocommerceGuide />
                                    </SheetContent>
                                </Sheet>
                                <TestConnectionButton
                                    onTest={async () => {
                                        if (!wooForm.domain || !wooForm.consumerKey || !wooForm.consumerSecret) {
                                            throw new Error("Veuillez remplir tous les champs avant de tester.");
                                        }
                                        const cleanDomain = wooForm.domain
                                            .replace(/https?:\/\//, '')
                                            .replace(/\/$/, '')
                                            .trim();
                                        try {
                                            const res = await fetch(
                                                `https://${cleanDomain}/wp-json/wc/v3/system_status?consumer_key=${encodeURIComponent(wooForm.consumerKey.trim())}&consumer_secret=${encodeURIComponent(wooForm.consumerSecret.trim())}`,
                                                { method: 'GET' }
                                            );
                                            return res.ok;
                                        } catch {
                                            return false;
                                        }
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
                                    onClick={handleConnect}
                                    disabled={isConnecting}
                                    size="sm"
                                    className="h-8 rounded-lg text-xs font-bold px-4 bg-[#96588a] hover:bg-[#804b75] text-white shadow-sm"
                                >
                                    {isConnecting ? <Loader2 size={13} className="mr-1.5 animate-spin" /> : <Plus size={13} className="mr-1.5" />}
                                    {isConnecting ? 'Connexion...' : 'Connecter'}
                                </Button>
                            </div>
                        }
                    />
                </div>

                <div className="flex-1 overflow-auto p-4 md:p-6 lg:p-8">
                    <div className="max-w-3xl mx-auto">
                        <div className="bg-white p-6 md:p-8 rounded-2xl border border-slate-200 shadow-sm space-y-6">
                            <div>
                                <h3 className="text-lg font-bold text-slate-900 mb-1">Détails de connexion</h3>
                                <p className="text-sm text-slate-500">Saisissez les clés d'API REST générées dans WooCommerce pour lier votre boutique.</p>
                            </div>

                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="domain" className="text-sm font-semibold text-slate-700">Domaine de la boutique</Label>
                                    <Input
                                        id="domain"
                                        placeholder="maboutique.com"
                                        value={wooForm.domain}
                                        onChange={(e) => setWooForm((prev) => ({ ...prev, domain: e.target.value }))}
                                        className="bg-slate-50 h-11 border-slate-200 focus:bg-white transition-colors"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="consumerKey" className="text-sm font-semibold text-slate-700">Clé Client (Consumer Key)</Label>
                                    <Input
                                        id="consumerKey"
                                        value={wooForm.consumerKey}
                                        onChange={(e) => setWooForm((prev) => ({ ...prev, consumerKey: e.target.value }))}
                                        className="font-mono text-xs bg-slate-50 h-11 border-slate-200 focus:bg-white"
                                        placeholder="ck_..."
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="consumerSecret" className="text-sm font-semibold text-slate-700">Secret Client (Consumer Secret)</Label>
                                    <Input
                                        id="consumerSecret"
                                        type="password"
                                        value={wooForm.consumerSecret}
                                        onChange={(e) => setWooForm((prev) => ({ ...prev, consumerSecret: e.target.value }))}
                                        className="font-mono text-xs bg-slate-50 h-11 border-slate-200 focus:bg-white"
                                        placeholder="cs_..."
                                    />
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
            onClick={() => setView('add')}
            className="h-8 rounded-lg text-xs font-bold px-4 bg-[#96588a] hover:bg-[#804b75] text-white shadow-sm"
        >
            <Plus size={13} className="mr-1.5" />
            Connecter une boutique
        </Button>
    );

    return (
        <div className="flex-1 flex flex-col h-full bg-slate-50/50">
            <div className="bg-white border-b border-slate-200 shrink-0 sticky top-0 z-30">
                <PageHeader
                    title="WooCommerce"
                    breadcrumbs={[
                        { label: 'Intégrations', href: '/integrations', onClick: onBack },
                        { label: 'WooCommerce', href: '#' }
                    ]}
                    count={wooStores.length}
                    icon={WooIcon}
                    onBack={onBack}
                    actions={headerActions}
                />
            </div>

            <div className="flex-1 overflow-auto p-4 md:p-6 lg:p-8">
                <div className="max-w-[1600px] mx-auto w-full">
                    {wooStores.length === 0 ? (
                        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-16 text-center">
                            <div className="w-16 h-16 rounded-2xl bg-[#96588a]/10 border border-[#96588a]/20 text-[#96588a] flex items-center justify-center mx-auto mb-4">
                                <WooIcon />
                            </div>
                            <h3 className="text-base font-bold text-slate-700 mb-1">Aucune boutique connectée</h3>
                            <p className="text-sm text-slate-500 mb-6 max-w-sm mx-auto">
                                Connectez votre boutique WooCommerce pour synchroniser (beta) vos produits et commandes.
                            </p>
                            <Button
                                onClick={() => setView('add')}
                                className="h-10 rounded-xl text-sm font-bold px-6 bg-[#96588a] hover:bg-[#804b75] text-white shadow-md shadow-[#96588a]/20"
                            >
                                <Plus size={16} className="mr-2" /> Connecter la première boutique
                            </Button>
                        </div>
                    ) : (
                        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                            <Table>
                                <TableHeader>
                                    <TableRow className="bg-slate-50/50 hover:bg-slate-50/50 border-b border-slate-200">
                                        <TableHead className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider py-3 pl-5">Boutique</TableHead>
                                        <TableHead className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider py-3">Statut</TableHead>
                                        <TableHead className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider py-3 pr-5 w-[60px]"></TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {wooStores.map((store) => (
                                        <TableRow
                                            key={store.id}
                                            className="group hover:bg-slate-50 transition-colors border-b border-slate-100 last:border-b-0"
                                        >
                                            <TableCell className="py-4 pl-5">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-10 h-10 rounded-xl bg-[#96588a]/10 border border-[#96588a]/20 flex items-center justify-center shrink-0">
                                                        <WooIcon />
                                                    </div>
                                                    <div>
                                                        <div className="text-sm font-bold text-slate-900 mb-0.5">{store.name}</div>
                                                        <a
                                                            href={`https://${store.url}`}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="text-xs text-slate-500 hover:text-[#96588a] inline-flex items-center gap-1 group/link"
                                                        >
                                                            {store.url}
                                                            <ExternalLink size={10} className="opacity-0 group-hover/link:opacity-100 transition-opacity" />
                                                        </a>
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell className="py-4">
                                                <Badge variant="secondary" className="bg-green-50 text-green-700 hover:bg-green-100 border-green-200 font-semibold gap-1">
                                                    <Check size={12} /> Connecté
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="py-4 pr-5 text-right">
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-8 w-8 rounded-md opacity-0 group-hover:opacity-100 transition-opacity text-slate-400 hover:text-slate-900 hover:bg-slate-100"
                                                        >
                                                            <MoreHorizontal size={16} />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end" className="w-56 rounded-xl">
                                                        <DropdownMenuItem className="text-xs font-medium" onClick={() => window.open(`https://${store.url}`, '_blank')}>
                                                            <ExternalLink size={14} className="mr-2" /> Ouvrir la boutique
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem className="text-xs font-medium" onClick={() => handleRefreshProducts(store)}>
                                                            <RotateCw size={14} className="mr-2" /> Actualiser les produits (Beta)
                                                        </DropdownMenuItem>
                                                        <DropdownMenuSeparator />
                                                        <DropdownMenuItem
                                                            className="text-red-600 focus:text-red-700 focus:bg-red-50 text-xs font-medium"
                                                            onClick={() => handleDeleteStore(store.id)}
                                                        >
                                                            <Trash2 size={14} className="mr-2" /> Déconnecter la boutique
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
