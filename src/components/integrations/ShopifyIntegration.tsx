import React, { useState, useMemo, useCallback } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faShopify } from '@fortawesome/free-brands-svg-icons';
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
    X,
    Trash2,
    HelpCircle
} from 'lucide-react';
import { toast } from 'sonner';
import { useConnectedStores } from '@/lib/firebase/hooks';
import { claimStoreOwnership } from '@/lib/firebase/storeOwnership';
import { getAdapter, LOADER_VERSION } from '@/lib/integrations';
import { cn } from '@/lib/utils';
import { useAssignmentsContext } from '@/contexts/AssignmentsContext';
import { notifyProductSyncComplete, syncProductsFromShopify } from '@/lib/products';
// @ts-ignore
import feedData from '../../../feed.json';

const CURRENT_LOADER_VERSION = LOADER_VERSION;

const SHOPIFY_SCOPES = [
    'read_all_orders', 'read_analytics', 'read_app_proxy', 'write_app_proxy', 'read_apps',
    'read_assigned_fulfillment_orders', 'write_assigned_fulfillment_orders', 'read_audit_events',
    'read_customer_events', 'read_cart_transforms', 'write_cart_transforms', 'read_all_cart_transforms',
    'read_validations', 'write_validations', 'read_cash_tracking', 'read_channels', 'write_channels',
    'read_checkout_branding_settings', 'write_checkout_branding_settings', 'write_checkouts', 'read_checkouts',
    'read_companies', 'write_companies', 'read_custom_fulfillment_services', 'write_custom_fulfillment_services',
    'read_custom_pixels', 'write_custom_pixels', 'read_customers', 'write_customers', 'read_customer_data_erasure',
    'write_customer_data_erasure', 'read_customer_payment_methods', 'read_customer_merge', 'write_customer_merge',
    'read_delivery_customizations', 'write_delivery_customizations', 'read_price_rules', 'write_price_rules',
    'read_discounts', 'write_discounts', 'read_discounts_allocator_functions', 'write_discounts_allocator_functions',
    'read_discovery', 'write_discovery', 'write_draft_orders', 'read_draft_orders', 'read_files', 'write_files',
    'read_fulfillment_constraint_rules', 'write_fulfillment_constraint_rules', 'read_fulfillments', 'write_fulfillments',
    'read_gift_card_transactions', 'write_gift_card_transactions', 'read_gift_cards', 'write_gift_cards',
    'write_inventory', 'read_inventory', 'write_inventory_shipments', 'read_inventory_shipments',
    'write_inventory_shipments_received_items', 'read_inventory_shipments_received_items',
    'write_inventory_transfers', 'read_inventory_transfers', 'read_legal_policies', 'write_legal_policies',
    'read_delivery_option_generators', 'write_delivery_option_generators', 'read_locales', 'write_locales',
    'write_locations', 'read_locations', 'read_marketing_integrated_campaigns', 'write_marketing_integrated_campaigns',
    'write_marketing_events', 'read_marketing_events', 'read_markets', 'write_markets', 'read_markets_home',
    'write_markets_home', 'read_merchant_managed_fulfillment_orders', 'write_merchant_managed_fulfillment_orders',
    'read_metaobject_definitions', 'write_metaobject_definitions', 'read_metaobjects', 'write_metaobjects',
    'read_online_store_navigation', 'write_online_store_navigation', 'read_online_store_pages',
    'write_online_store_pages', 'write_order_edits', 'read_order_edits', 'read_orders', 'write_orders',
    'write_packing_slip_templates', 'read_packing_slip_templates', 'write_payment_mandate', 'read_payment_mandate',
    'read_payment_terms', 'write_payment_terms', 'read_payment_customizations', 'write_payment_customizations',
    'read_pixels', 'write_pixels', 'read_privacy_settings', 'write_privacy_settings', 'read_product_feeds',
    'write_product_feeds', 'read_product_listings', 'write_product_listings', 'read_products', 'write_products',
    'read_publications', 'write_publications', 'read_purchase_options', 'write_purchase_options', 'write_reports',
    'read_reports', 'read_resource_feedbacks', 'write_resource_feedbacks', 'read_returns', 'write_returns',
    'read_script_tags', 'write_script_tags', 'read_shopify_payments_provider_accounts_sensitive', 'read_shipping',
    'write_shipping', 'read_shopify_payments_accounts', 'read_shopify_payments_payouts',
    'read_shopify_payments_bank_accounts', 'read_shopify_payments_disputes', 'write_shopify_payments_disputes',
    'read_content', 'write_content', 'read_store_credit_account_transactions', 'write_store_credit_account_transactions',
    'read_store_credit_accounts', 'write_own_subscription_contracts', 'read_own_subscription_contracts',
    'write_theme_code', 'read_themes', 'write_themes', 'read_third_party_fulfillment_orders',
    'write_third_party_fulfillment_orders', 'read_translations', 'write_translations', 'customer_read_companies',
    'customer_write_companies', 'customer_write_customers', 'customer_read_customers', 'customer_read_draft_orders',
    'customer_read_markets', 'customer_read_metaobjects', 'customer_read_orders', 'customer_write_orders',
    'customer_read_quick_sale', 'customer_write_quick_sale', 'customer_read_store_credit_account_transactions',
    'customer_read_store_credit_accounts', 'customer_write_own_subscription_contracts',
    'customer_read_own_subscription_contracts', 'unauthenticated_write_bulk_operations',
    'unauthenticated_read_bulk_operations', 'unauthenticated_read_bundles', 'unauthenticated_write_checkouts',
    'unauthenticated_read_checkouts', 'unauthenticated_write_customers', 'unauthenticated_read_customers',
    'unauthenticated_read_customer_tags', 'unauthenticated_read_metaobjects',
    'unauthenticated_read_product_pickup_locations', 'unauthenticated_read_product_inventory',
    'unauthenticated_read_product_listings', 'unauthenticated_read_product_tags',
    'unauthenticated_read_selling_plans', 'unauthenticated_read_shop_pay_installments_pricing',
    'unauthenticated_read_content'
].join(',');


const ShopifyGuide = () => (
    <div className="py-2 animate-in fade-in duration-300">
        <VideoPlaceholder title="Comment lier Shopify à Final Form (Tutoriel Complet)" thumbnailUrl="https://images.unsplash.com/photo-1556742059-47bca3807878?q=80&w=2000&auto=format&fit=crop" />

        <GuideStep number={1} title="Créer une application personnalisée">
            <p>
                Connectez-vous au <a href="https://dev.shopify.com/dashboard" target="_blank" rel="noreferrer" className="text-indigo-600 font-medium hover:underline inline-flex items-center gap-0.5">Tableau de bord partenaires Shopify <ExternalLink size={10} /></a>.
                Cliquez sur <strong>Créer une application</strong> et choisissez <strong>Création manuelle</strong>.
            </p>
            <div className="flex items-center gap-2 mt-2">
                <div className="relative flex-1">
                    <Input readOnly value="Final Form Funnel" className="bg-slate-50 border-slate-200 font-mono text-xs h-10 pr-24" onClick={(e) => e.currentTarget.select()} />
                    <div className="absolute right-1.5 top-1.5">
                        <CopyButton text="Final Form Funnel" className="h-7 bg-white shadow-sm border border-slate-200 hover:bg-slate-50" />
                    </div>
                </div>
            </div>
        </GuideStep>

        <GuideStep number={2} title="Configurer l'application">
            <ul className="list-disc list-outside ml-4 space-y-1.5 text-slate-600">
                <li>Décochez <strong>"Intégrer l'application dans l'interface administrateur Shopify"</strong>.</li>
                <li>Allez dans l'onglet <strong>Configuration</strong>.</li>
                <li>Localisez <strong>Intégration de l'API Admin</strong>.</li>
            </ul>
        </GuideStep>

        <GuideStep number={3} title="Définir les autorisations (Scopes)">
            <p>Copiez les autorisations ci-dessous et collez-les dans le champ prévu.</p>
            <div className="relative group mt-2">
                <div className="relative">
                    <textarea
                        readOnly
                        value={SHOPIFY_SCOPES}
                        className="w-full bg-slate-900 text-slate-300 p-4 rounded-xl font-mono text-[11px] break-all h-32 custom-scroll border border-slate-800 shadow-inner leading-relaxed resize-none focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        onClick={(e) => e.currentTarget.select()}
                    />
                    <div className="absolute top-3 right-3">
                        <CopyButton text={SHOPIFY_SCOPES} label="Copier Scopes" className="bg-slate-800/80 hover:bg-slate-700 text-white border border-slate-600 backdrop-blur-md" />
                    </div>
                </div>
            </div>
        </GuideStep>

        <GuideStep number={4} title="Définir l'URL de redirection">
            <p>Ajoutez l'URL suivante dans <strong>URL de redirection autorisées</strong> :</p>
            <div className="flex items-center gap-2 mt-2">
                <div className="relative flex-1">
                    <Input readOnly value="https://your-backend-url.com/oauth2/callback" className="bg-slate-50 border-slate-200 font-mono text-xs h-10 pr-24 text-slate-500" onClick={(e) => e.currentTarget.select()} />
                    <div className="absolute right-1.5 top-1.5">
                        <CopyButton text="https://your-backend-url.com/oauth2/callback" className="h-7 bg-white shadow-sm border border-slate-200 hover:bg-slate-50" />
                    </div>
                </div>
            </div>
        </GuideStep>

        <GuideStep number={5} title="Installer & Obtenir les accès">
            <ol className="list-decimal list-outside ml-4 space-y-1.5 text-slate-600">
                <li>Cliquez sur <strong>Publier</strong> pour créer une version.</li>
                <li><strong>Installez</strong> l'application sur votre boutique.</li>
                <li>Copiez l'<strong>Identifiant client (Client ID)</strong> et la <strong>Clé secrète (Client Secret)</strong> dans le formulaire de connexion.</li>
            </ol>
        </GuideStep>
    </div>
);

interface ShopifyIntegrationProps {
    userId: string;
    onBack?: () => void;
}

export function ShopifyIntegration({ userId, onBack }: ShopifyIntegrationProps) {
    const { stores, addStore, updateStore, deleteStore } = useConnectedStores(userId);
    const { assignments } = useAssignmentsContext();

    const [view, setView] = useState<'list' | 'add'>('list');
    const [addTab, setAddTab] = useState<'setup' | 'guide'>('setup');
    const [isConnecting, setIsConnecting] = useState(false);
    const [processingStoreId, setProcessingStoreId] = useState<string | null>(null);
    const [shopifyForm, setShopifyForm] = useState({
        subdomain: feedData.shopify?.shopDomain?.replace('https://', '').replace('.myshopify.com', '') || '',
        clientId: feedData.shopify?.clientId || '',
        clientSecret: feedData.shopify?.clientSecret || '',
    });

    const shopifyStores = stores.filter(s => s.platform === 'shopify');

    const handleCancel = () => {
        setView('list');
        setShopifyForm({ subdomain: '', clientId: '', clientSecret: '' });
    };

    const handleShopifyConnect = async () => {
        if (!shopifyForm.subdomain || !shopifyForm.clientId || !shopifyForm.clientSecret) {
            toast.error('Veuillez remplir tous les champs.');
            return;
        }

        const cleanDomain = shopifyForm.subdomain
            .replace(/https?:\/\//, '')
            .replace('.myshopify.com', '')
            .replace(/\/$/, '')
            .trim();

        setIsConnecting(true);
        try {
            const shopifyAdapter = getAdapter('shopify');
            const result = await shopifyAdapter.connect(cleanDomain, {
                clientId: shopifyForm.clientId.trim(),
                clientSecret: shopifyForm.clientSecret.trim(),
            }, userId);

            if (result.success && result.store) {
                const shopifyDomain = result.store.domain || `${cleanDomain}.myshopify.com`;

                try {
                    // The server's connect endpoint already creates/updates the store doc
                    // in Firestore via upsertStore(). The onSnapshot listener will pick it up.
                    // Use the server's storeId so assignments match what store_domains lookup returns.
                    const newStoreId = result.firebaseStoreId;

                    // Claim ownership via client-side storeOwners collection
                    if (newStoreId) {
                        await claimStoreOwnership(shopifyDomain, userId, newStoreId);
                    }

                    if (!result.loader?.installed) {
                        try {
                            const loaderResult = await shopifyAdapter.enableLoader(cleanDomain, {
                                clientId: shopifyForm.clientId.trim(),
                                clientSecret: shopifyForm.clientSecret.trim(),
                            }, userId);

                            if (loaderResult.success && newStoreId) {
                                await updateStore(newStoreId, {
                                    loaderInstalled: true,
                                    loaderVersion: loaderResult.version || LOADER_VERSION,
                                    loaderScriptTagId: loaderResult.scriptId,
                                    loaderInstalledAt: new Date().toISOString(),
                                });
                                toast.success(`Boutique connectée et script installé sur ${result.store.name} !`);
                            } else {
                                toast.warning(`Boutique connectée, mais échec de l'installation du script: ${loaderResult.error}`);
                            }
                        } catch (loaderErr) {
                            console.error('Auto-install loader failed', loaderErr);
                            toast.warning(`Boutique connectée. Installation manuelle du script requise.`);
                        }
                    } else {
                        toast.success(`Boutique ${result.store.name} connectée avec succès !`);
                    }

                    // Auto-sync products
                    toast.info("Synchronisation des produits en cours...");
                    try {
                        const tempStoreForSync = {
                            id: newStoreId,
                            platform: 'shopify' as const,
                            url: shopifyDomain,
                            storeDomain: shopifyDomain,
                            clientId: shopifyForm.clientId.trim(),
                            clientSecret: shopifyForm.clientSecret.trim()
                        };
                        const syncedProducts = await syncProductsFromShopify(tempStoreForSync as any);
                        if (newStoreId) {
                            notifyProductSyncComplete(newStoreId, syncedProducts);
                        }
                        toast.success(`${syncedProducts.length} produits synchronisés.`);
                    } catch (syncErr) {
                        console.error("Auto-sync failed", syncErr);
                        toast.warning("Boutique connectée, mais la synchronisation initiale a échoué.");
                    }

                    setView('list');
                } catch (err: any) {
                    console.error('Post-connect error:', err);
                    throw err;
                }
            } else {
                toast.error(result.error || 'La connexion a échoué. Veuillez vérifier vos accès.');
            }
        } catch (error: any) {
            console.error(error);
            toast.error(error.message || 'Une erreur inattendue est survenue.');
        } finally {
            setIsConnecting(false);
        }
    };

    const handleEnableLoader = async (store: any, silent = false) => {
        setProcessingStoreId(store.id);
        const loadingToast = silent ? null : toast.loading('Activation du script en cours...');

        try {
            const subdomain = store.url.replace('.myshopify.com', '').replace(/https?:\/\//, '');
            if (!store.clientId || !store.clientSecret) {
                if (!silent) toast.error('Identifiants manquants. Veuillez reconnecter la boutique.');
                return;
            }
            const shopifyAdapter = getAdapter('shopify');
            const result = await shopifyAdapter.enableLoader(subdomain, {
                clientId: store.clientId,
                clientSecret: store.clientSecret
            }, userId);

            if (loadingToast) toast.dismiss(loadingToast);

            if (result.success) {
                await updateStore(store.id, {
                    loaderInstalled: true,
                    loaderVersion: result.version || CURRENT_LOADER_VERSION,
                    loaderScriptTagId: result.scriptId,
                    loaderInstalledAt: new Date().toISOString()
                });
                if (!silent) toast.success(`Script (v${result.version || CURRENT_LOADER_VERSION}) activé avec succès !`);
            } else {
                if (!silent) toast.error(result.error || "L'activation du script a échoué.");
            }
        } catch (error) {
            if (loadingToast) toast.dismiss(loadingToast);
            if (!silent) toast.error("L'activation du script a échoué.");
            console.error(error);
        } finally {
            setProcessingStoreId(null);
        }
    };

    const handleRefreshProducts = async (store: any) => {
        setProcessingStoreId(store.id);
        const loadingToast = toast.loading('Synchronisation des produits...');

        try {
            const syncedProducts = await syncProductsFromShopify(store);
            notifyProductSyncComplete(store.id, syncedProducts);
            toast.success(`${syncedProducts.length} produits mis à jour.`);
        } catch (error: any) {
            console.error("Refresh failed:", error);
            toast.error(error.message || 'La synchronisation a échoué.');
        } finally {
            toast.dismiss(loadingToast);
            setProcessingStoreId(null);
        }
    };



    const handleDeleteStore = async (storeId: string) => {
        // Guard: check if the store is used in any form assignments
        const linkedAssignments = assignments.filter(a => a.storeId === storeId);
        if (linkedAssignments.length > 0) {
            toast.error(
                `Cette boutique est liée à ${linkedAssignments.length} formulaire(s). Veuillez d'abord délier la boutique de tous les formulaires avant de la déconnecter.`
            );
            return;
        }

        if (confirm('Voulez-vous vraiment déconnecter cette boutique ? Toutes les configurations liées seront perdues.')) {
            setProcessingStoreId(storeId);
            try {
                const store = shopifyStores.find(s => s.id === storeId);
                if (store) {
                    const shopifyAdapter = getAdapter('shopify');
                    const cleanDomain = store.url.replace('.myshopify.com', '').replace(/https?:\/\//, '').trim();
                    try {
                        await shopifyAdapter.disconnectStore(cleanDomain, {
                            clientId: store.clientId,
                            clientSecret: store.clientSecret
                        }, userId);
                    } catch (err) {
                        console.warn('Failed to disconnect store explicitly', err);
                    }
                }

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

    // Custom Icon
    const ShopifyIcon = () => (
        <FontAwesomeIcon icon={faShopify} className="text-[#95BF47] text-xl md:text-2xl" />
    );

    // Auto-install script on connected stores if missing
    React.useEffect(() => {
        shopifyStores.forEach(store => {
            if (!store.loaderInstalled && !processingStoreId) {
                // Silently attempt to install the loader in the background
                handleEnableLoader(store, true);
            }
        });
    }, [shopifyStores]);

    const editorActions = useMemo(() => (
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
                        <SheetTitle className="text-xl font-bold text-slate-900">Guide d'intégration Shopify</SheetTitle>
                        <p className="text-sm text-slate-500 mt-2 text-left">Suivez ces étapes pour générer les clés API de votre application personnalisée Shopify.</p>
                    </SheetHeader>
                    <ShopifyGuide />
                </SheetContent>
            </Sheet>
            <TestConnectionButton
                onTest={async () => {
                    if (!shopifyForm.subdomain || !shopifyForm.clientId || !shopifyForm.clientSecret) {
                        throw new Error("Veuillez remplir tous les champs avant de tester.");
                    }
                    const cleanDomain = shopifyForm.subdomain
                        .replace(/https?:\/\//, '')
                        .replace('.myshopify.com', '')
                        .trim();
                    try {
                        const shopifyAdapter = getAdapter('shopify');
                        const result = await shopifyAdapter.connect(cleanDomain, {
                            clientId: shopifyForm.clientId.trim(),
                            clientSecret: shopifyForm.clientSecret.trim(),
                        }, userId);
                        return result.success === true;
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
                onClick={handleShopifyConnect}
                disabled={isConnecting}
                size="sm"
                variant="default"
                className="h-8 rounded-lg text-xs px-4 shadow-sm"
            >
                {isConnecting ? <Loader2 size={13} className="mr-1.5 animate-spin" /> : <Plus size={13} className="mr-1.5" />}
                {isConnecting ? 'Connexion...' : 'Connecter'}
            </Button>
        </div>
    ), [shopifyForm, isConnecting, userId]);

    // IMPORTANT: headerActions must be declared BEFORE any early return to satisfy React's rules of hooks
    const headerActions = useMemo(() => (
        <Button
            size="sm"
            onClick={() => setView('add')}
            className="h-8 rounded-lg text-xs font-bold px-4 bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm"
        >
            <Plus size={13} className="mr-1.5" />
            Connecter une boutique
        </Button>
    ), []);

    if (view === 'add') {
        return (
            <div className="flex-1 flex flex-col h-full bg-slate-50/50">
                <div className="bg-white border-b border-slate-200 shrink-0 sticky top-0 z-30">
                    <PageHeader
                        title="Connecter une boutique Shopify"
                        breadcrumbs={[
                            { label: 'Intégrations', href: '/integrations', onClick: onBack },
                            { label: 'Shopify', href: '#' }
                        ]}
                        icon={ShopifyIcon}
                        onBack={handleCancel}
                        actions={editorActions}
                    />
                </div>

                <div className="flex-1 overflow-auto p-4 md:p-6 lg:p-8">
                    <div className="max-w-3xl mx-auto">
                        <div className="bg-white p-6 md:p-8 rounded-2xl border border-slate-200 shadow-sm space-y-6">
                            <div className="space-y-6">
                                <div>
                                    <h3 className="text-lg font-bold text-slate-900 mb-1">Détails de connexion</h3>
                                    <p className="text-sm text-slate-500">Saisissez les informations de votre application personnalisée Shopify pour lier votre boutique.</p>
                                </div>

                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="subdomain" className="text-sm font-semibold text-slate-700">Nom de la boutique (Domaine Myshopify)</Label>
                                        <div className="flex shadow-sm rounded-xl overflow-hidden group focus-within:ring-2 focus-within:ring-indigo-100 focus-within:border-indigo-300 transition-all border border-slate-200 bg-white">
                                            <Input
                                                id="subdomain"
                                                placeholder="ma-boutique"
                                                value={shopifyForm.subdomain}
                                                onChange={(e) => setShopifyForm((prev) => ({ ...prev, subdomain: e.target.value }))}
                                                className="rounded-none border-0 focus-visible:ring-0 focus-visible:ring-offset-0 relative z-10 bg-transparent h-11"
                                            />
                                            <div className="bg-slate-50 px-4 flex items-center whitespace-nowrap border-l border-slate-200 text-sm text-slate-500 font-medium">
                                                .myshopify.com
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="clientId" className="text-sm font-semibold text-slate-700">Identifiant client (Client ID)</Label>
                                        <Input
                                            id="clientId"
                                            value={shopifyForm.clientId}
                                            onChange={(e) => setShopifyForm((prev) => ({ ...prev, clientId: e.target.value }))}
                                            className="font-mono text-xs bg-slate-50 h-11 border-slate-200 focus:bg-white"
                                            placeholder="ex. 1234567890abcdef..."
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="clientSecret" className="text-sm font-semibold text-slate-700">Clé secrète (Client Secret)</Label>
                                        <Input
                                            id="clientSecret"
                                            type="password"
                                            value={shopifyForm.clientSecret}
                                            onChange={(e) => setShopifyForm((prev) => ({ ...prev, clientSecret: e.target.value }))}
                                            className="font-mono text-xs bg-slate-50 h-11 border-slate-200 focus:bg-white"
                                            placeholder="ex. shpca_1234567890abcdef..."
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // headerActions is now declared before the early return above

    return (
        <div className="flex-1 flex flex-col h-full bg-slate-50/50">
            <div className="bg-white border-b border-slate-200 shrink-0 sticky top-0 z-30">
                <PageHeader
                    title="Shopify"
                    breadcrumbs={[
                        { label: 'Intégrations', href: '/integrations', onClick: onBack },
                        { label: 'Shopify', href: '#' }
                    ]}
                    count={shopifyStores.length}
                    icon={ShopifyIcon}
                    onBack={onBack}
                    actions={headerActions}
                />
            </div>

            <div className="flex-1 overflow-auto p-4 md:p-6 lg:p-8">
                <div className="max-w-[1600px] mx-auto w-full">
                    {shopifyStores.length === 0 ? (
                        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-16 text-center">
                            <div className="w-16 h-16 rounded-2xl bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center mx-auto mb-4">
                                <ShopifyIcon />
                            </div>
                            <h3 className="text-base font-bold text-slate-700 mb-1">Aucune boutique connectée</h3>
                            <p className="text-sm text-slate-500 mb-6 max-w-sm mx-auto">
                                Connectez votre boutique Shopify pour synchroniser vos produits et créer des commandes automatiquement.
                            </p>
                            <Button
                                onClick={() => setView('add')}
                                className="h-10 rounded-xl text-sm font-bold px-6 bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-100"
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
                                        <TableHead className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider py-3">Statut du Script d'intégration</TableHead>
                                        <TableHead className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider py-3 pr-5 w-[60px]"></TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {shopifyStores.map((store) => (
                                        <TableRow
                                            key={store.id}
                                            className="group hover:bg-slate-50 transition-colors border-b border-slate-100 last:border-b-0"
                                        >
                                            <TableCell className="py-4 pl-5">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center shrink-0">
                                                        <ShopifyIcon />
                                                    </div>
                                                    <div>
                                                        <div className="text-sm font-bold text-slate-900 mb-0.5">{store.name}</div>
                                                        <a
                                                            href={`https://${store.url}`}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="text-xs text-slate-500 hover:text-indigo-600 inline-flex items-center gap-1 group/link"
                                                        >
                                                            {store.url || store.storeDomain}
                                                            <ExternalLink size={10} className="opacity-0 group-hover/link:opacity-100 transition-opacity" />
                                                        </a>
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell className="py-4">
                                                <div className="flex items-center gap-3">
                                                    {store.loaderInstalled ? (
                                                        <Badge variant="secondary" className="bg-green-50 text-green-700 hover:bg-green-100 border-green-200 font-semibold gap-1">
                                                            <Check size={12} /> Installé (v{CURRENT_LOADER_VERSION})
                                                        </Badge>
                                                    ) : (
                                                        <Badge variant="secondary" className="bg-amber-50 text-amber-700 hover:bg-amber-100 border-amber-200 font-semibold gap-1">
                                                            Installation en cours...
                                                        </Badge>
                                                    )}
                                                </div>
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
                                                            <RotateCw size={14} className="mr-2" /> Actualiser les produits
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
