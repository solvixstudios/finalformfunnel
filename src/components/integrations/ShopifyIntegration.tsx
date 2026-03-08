import { ShopifyManager } from '@/components/integrations/ShopifyManager';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CardTitle } from '@/components/ui/card';
import { HoverSpotlightCard } from '@/components/ui/HoverSpotlightCard';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
} from '@/components/ui/sheet';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
    Check,
    ChevronRight,
    Copy,
    ExternalLink,
    Loader2,
    Plus,
    Store,
    X,
} from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { useConnectedStores } from '@/lib/firebase/hooks';
// @ts-ignore
import feedData from '../../../feed.json';
import { getAdapter, LOADER_VERSION } from '@/lib/integrations';
import { cn } from '@/lib/utils';
import { syncProductsFromShopify, notifyProductSyncComplete } from '../../lib/products';

// --- CONSTANTS ---
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

// --- Helper Components ---

const CopyButton = ({ text, label, className }: { text: string; label?: string; className?: string }) => {
    const [copied, setCopied] = useState(false);
    const handleCopy = (e: React.MouseEvent) => {
        e.stopPropagation();
        navigator.clipboard.writeText(text);
        setCopied(true);
        toast.success(label ? `${label} copied!` : 'Copied to clipboard');
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <Button
            variant="ghost"
            size="sm"
            onClick={handleCopy}
            className={cn("h-7 px-2 text-xs font-medium bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors", className)}
        >
            {copied ? <Check size={12} className="mr-1.5 text-green-600" /> : <Copy size={12} className="mr-1.5" />}
            {label || (copied ? 'Copied' : 'Copy')}
        </Button>
    );
};

const GuideStep = ({ number, title, children }: { number: number; title: string; children: React.ReactNode }) => (
    <div className="flex gap-4 relative pb-8 last:pb-0">
        <div className="flex-shrink-0 flex flex-col items-center">
            <div className="w-8 h-8 rounded-full bg-slate-50 border border-slate-200 flex items-center justify-center text-sm font-bold text-slate-700 shadow-sm z-10">
                {number}
            </div>
            <div className="w-px h-full bg-slate-200 absolute top-8 -bottom-2 -z-0" />
        </div>
        <div className="flex-1 pt-1 space-y-2">
            <h4 className="font-semibold text-slate-900">{title}</h4>
            <div className="text-sm text-slate-600 space-y-3">{children}</div>
        </div>
    </div>
);

const ShopifyGuide = () => (
    <div className="py-4">
        <GuideStep number={1} title="Create Custom App">
            <p>
                Log in to your <a href="https://dev.shopify.com/dashboard" target="_blank" className="text-indigo-600 font-medium hover:underline inline-flex items-center gap-0.5">Shopify Partners Dashboard <ExternalLink size={10} /></a>.
                Click <strong>Create App</strong> and select <strong>Manually created</strong>.
            </p>
            <div className="flex items-center gap-2 mt-2">
                <div className="relative flex-1">
                    <Input readOnly value="Final Form Funnel" className="bg-slate-50 border-slate-200 font-mono text-xs h-9 pr-20" onClick={(e) => e.currentTarget.select()} />
                    <div className="absolute right-1 top-1">
                        <CopyButton text="Final Form Funnel" className="h-7 bg-white shadow-sm border border-slate-200 hover:bg-slate-50" />
                    </div>
                </div>
            </div>
        </GuideStep>

        <GuideStep number={2} title="Configure App">
            <ul className="list-disc list-outside ml-4 space-y-1">
                <li>Uncheck <strong>"Embed app in Shopify admin"</strong>.</li>
                <li>Go to the <strong>Configuration</strong> tab.</li>
                <li>Locate <strong>Admin API integration</strong>.</li>
            </ul>
        </GuideStep>

        <GuideStep number={3} title="Set Permissions (Scopes)">
            <p>Copy the scopes below and paste them into the scopes field.</p>
            <div className="relative group mt-2">
                <div className="relative">
                    <textarea
                        readOnly
                        value={SHOPIFY_SCOPES}
                        className="w-full bg-slate-900 text-slate-300 p-3 rounded-lg font-mono text-[10px] break-all h-28 custom-scroll border border-slate-800 shadow-sm leading-relaxed resize-none focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        onClick={(e) => e.currentTarget.select()}
                    />
                    <div className="absolute top-2 right-2">
                        <CopyButton text={SHOPIFY_SCOPES} label="Copy Scopes" className="bg-slate-800 text-slate-200 hover:bg-slate-700 hover:text-white border border-slate-700 backdrop-blur-sm" />
                    </div>
                </div>
            </div>
        </GuideStep>

        <GuideStep number={4} title="Set Redirect URL">
            <p>Add the following URL to <strong>Allowed redirection URL(s)</strong>:</p>
            <div className="flex items-center gap-2 mt-2">
                <div className="relative flex-1">
                    <Input readOnly value="https://your-backend-url.com/oauth2/callback" className="bg-slate-50 border-slate-200 font-mono text-xs h-9 pr-20" onClick={(e) => e.currentTarget.select()} />
                    <div className="absolute right-1 top-1">
                        <CopyButton text="https://your-backend-url.com/oauth2/callback" className="h-7 bg-white shadow-sm border border-slate-200 hover:bg-slate-50" />
                    </div>
                </div>
            </div>
        </GuideStep>

        <GuideStep number={5} title="Install & Get Credentials">
            <ol className="list-decimal list-outside ml-4 space-y-1">
                <li>Click <strong>Release</strong> to publish a version.</li>
                <li><strong>Install</strong> the app on your target store.</li>
                <li>Copy the <strong>Client ID</strong> and <strong>Client Secret</strong>.</li>
            </ol>
        </GuideStep>
    </div>
);

// --- Main Component ---

// --- Main Component ---

interface ShopifyIntegrationProps {
    userId: string;
}

export function ShopifyIntegration({ userId }: ShopifyIntegrationProps) {
    const { stores, addStore, updateStore } = useConnectedStores(userId);

    const [openSheet, setOpenSheet] = useState(false);
    const [activeTab, setActiveTab] = useState<'manage' | 'guide'>('manage');
    const [view, setView] = useState<'list' | 'add'>('list');

    const [shopifyForm, setShopifyForm] = useState({
        subdomain: feedData.shopify.shopDomain.replace('https://', '').replace('.myshopify.com', ''),
        clientId: feedData.shopify.clientId,
        clientSecret: feedData.shopify.clientSecret,
    });
    const [isConnecting, setIsConnecting] = useState(false);

    const isConnected = stores.some((s) => s.platform === 'shopify');

    // Reset view when opening/closing
    const handleOpenChange = (open: boolean) => {
        setOpenSheet(open);
        if (!open) {
            setView('list');
            setActiveTab(isConnected ? 'manage' : 'guide');
        }
    };

    const handleShopifyConnect = async () => {
        if (!shopifyForm.subdomain || !shopifyForm.clientId || !shopifyForm.clientSecret) {
            toast.error('Please complete all fields.');
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
                    const newStore = await addStore({
                        name: result.store.name,
                        platform: 'shopify',
                        url: shopifyDomain,
                        shopifyDomain: shopifyDomain,
                        clientId: shopifyForm.clientId.trim(),
                        clientSecret: shopifyForm.clientSecret.trim(),
                        loaderInstalled: result.loader?.installed || false,
                        loaderVersion: result.loader?.version,
                        loaderScriptTagId: result.loader?.scriptId,
                        loaderInstalledAt: result.loader?.installed ? new Date().toISOString() : undefined,
                    });

                    if (!result.loader?.installed) {
                        try {
                            const loaderResult = await shopifyAdapter.enableLoader(cleanDomain, {
                                clientId: shopifyForm.clientId.trim(),
                                clientSecret: shopifyForm.clientSecret.trim(),
                            });

                            if (loaderResult.success) {
                                await updateStore(newStore.id, {
                                    loaderInstalled: true,
                                    loaderVersion: loaderResult.version || LOADER_VERSION,
                                    loaderScriptTagId: loaderResult.scriptId,
                                    loaderInstalledAt: new Date().toISOString(),
                                });
                                toast.success(`Successfully connected and loader installed on ${result.store.name}!`);
                            } else {
                                toast.success(`Store connected, but failed to auto-install loader: ${loaderResult.error}`);
                            }
                        } catch (loaderErr) {
                            console.error('Auto-install loader failed', loaderErr);
                            toast.success(`Store connected, but manual loader installation may be required.`);
                        }
                    } else {
                        toast.success(`Successfully connected ${result.store.name}!`);
                    }

                    // Auto-sync products
                    toast.info("Syncing products...");
                    try {
                        const syncedProducts = await syncProductsFromShopify(newStore);
                        notifyProductSyncComplete(newStore.id, syncedProducts);
                        toast.success(`Synced ${syncedProducts.length} products`);
                    } catch (syncErr) {
                        console.error("Auto-sync failed", syncErr);
                        toast.warning("Store connected, but initial product sync failed.");
                    }

                    setView('list');
                    setShopifyForm({ subdomain: '', clientId: '', clientSecret: '' });
                } catch (addError: any) {
                    if (addError.message === 'STORE_ALREADY_OWNED') {
                        toast.error('This store is already connected to a different account.');
                    } else if (addError.message === 'STORE_ALREADY_CONNECTED') {
                        toast.error('This store is already connected to your account.');
                    } else {
                        throw addError;
                    }
                }
            } else {
                toast.error(result.error || 'Connection failed. Please check your credentials.');
            }
        } catch (error: any) {
            console.error(error);
            toast.error(error.message || 'An unexpected error occurred.');
        } finally {
            setIsConnecting(false);
        }
    };

    return (
        <div className="md:col-span-1 md:row-span-1">
            <Sheet open={openSheet} onOpenChange={handleOpenChange}>
                <HoverSpotlightCard
                    spotlightColor="rgba(99, 102, 241, 0.15)"
                    className="rounded-2xl sm:rounded-3xl hover:ring-2 hover:ring-indigo-100 hover:shadow-xl group flex flex-col p-4 sm:p-6 min-h-[140px] sm:min-h-[180px] h-full"
                    onClick={() => {
                        setActiveTab(isConnected ? 'manage' : 'guide');
                        setOpenSheet(true);
                    }}
                >
                    <div className="absolute inset-0 bg-gradient-to-br from-indigo-50/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                    <div className="flex flex-col h-full justify-between relative z-10">
                        <div className="flex justify-between items-start">
                            <div className="w-14 h-14 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-3xl mb-4 shadow-sm group-hover:scale-110 group-hover:-rotate-3 transition-transform duration-300">
                                🛍️
                            </div>
                            {isConnected && (
                                <Badge variant="secondary" className="bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border-indigo-100">
                                    Connected
                                </Badge>
                            )}
                        </div>
                        <div>
                            <CardTitle className="text-xl font-bold text-slate-900 tracking-tight">Shopify</CardTitle>
                            <p className="text-sm text-slate-500 mt-2 font-medium leading-normal">
                                Sync products & orders
                            </p>
                        </div>
                    </div>
                </HoverSpotlightCard>

                <SheetContent hideClose className="sm:max-w-md w-full flex flex-col h-full p-0 gap-0 bg-white overflow-hidden sm:border-l sm:shadow-2xl">
                    <SheetHeader className="px-6 py-5 border-b border-slate-100 shrink-0 bg-white">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-xl shrink-0">🛍️</div>
                                <div className="flex flex-col">
                                    {view === 'add' ? (
                                        <>
                                            <SheetTitle className="text-slate-900 leading-tight">Connect Store</SheetTitle>
                                            <SheetDescription className="text-xs mt-0.5">Add your Shopify store</SheetDescription>
                                        </>
                                    ) : (
                                        <>
                                            <SheetTitle className="text-slate-900 leading-tight">Shopify</SheetTitle>
                                            <SheetDescription className="text-xs mt-0.5">Manage your stores</SheetDescription>
                                        </>
                                    )}
                                </div>
                            </div>

                            <div className="flex items-center gap-2">
                                {activeTab === 'manage' && (
                                    view === 'list' ? (
                                        <Button
                                            size="sm"
                                            className="bg-indigo-600 hover:bg-indigo-700 text-white h-8 text-xs gap-1.5 shadow-sm px-3 rounded-full"
                                            onClick={() => setView('add')}
                                        >
                                            <Plus size={14} className="stroke-[2.5]" /> Add Store
                                        </Button>
                                    ) : (
                                        <Button
                                            size="sm"
                                            variant="ghost"
                                            className="h-8 text-slate-500 hover:text-slate-900 hover:bg-slate-100 text-xs gap-1.5 px-3 rounded-full"
                                            onClick={() => setView('list')}
                                        >
                                            Cancel
                                        </Button>
                                    )
                                )}

                                <div className="h-6 w-px bg-slate-200 mx-1" />

                                <Button
                                    size="icon"
                                    variant="ghost"
                                    className="h-8 w-8 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100"
                                    onClick={() => handleOpenChange(false)}
                                >
                                    <X size={18} />
                                </Button>
                            </div>
                        </div>
                    </SheetHeader>

                    <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'manage' | 'guide')} className="flex-1 flex flex-col min-h-0">
                        <div className="flex justify-center py-4 bg-white shrink-0 border-b border-slate-100">
                            <TabsList className="inline-flex h-9 items-center justify-center rounded-full bg-slate-100/80 p-1 text-slate-500 shadow-inner">
                                <TabsTrigger value="manage" className="rounded-full px-6 py-1.5 text-xs font-semibold data-[state=active]:bg-white data-[state=active]:text-indigo-600 data-[state=active]:shadow-sm transition-all duration-300">Manage</TabsTrigger>
                                <TabsTrigger value="guide" className="rounded-full px-6 py-1.5 text-xs font-semibold data-[state=active]:bg-white data-[state=active]:text-indigo-600 data-[state=active]:shadow-sm transition-all duration-300">Setup Guide</TabsTrigger>
                            </TabsList>
                        </div>

                        <ScrollArea className="flex-1 bg-slate-50/50 [&>div>div]:!block">
                            <TabsContent value="manage" className="mt-0 p-6 space-y-4">

                                {view === 'add' ? (
                                    <div className="space-y-6 animate-in slide-in-from-right-8 fade-in duration-300">
                                        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-5">
                                            <div className="space-y-4">
                                                <div className="space-y-2">
                                                    <Label htmlFor="subdomain" className="text-xs font-semibold text-slate-700">Store Domain</Label>
                                                    <div className="flex shadow-sm rounded-lg overflow-hidden group focus-within:ring-2 focus-within:ring-indigo-100 focus-within:border-indigo-300 transition-all border border-slate-200">
                                                        <Input
                                                            id="subdomain"
                                                            placeholder="my-store-name"
                                                            value={shopifyForm.subdomain}
                                                            onChange={(e) => setShopifyForm((prev) => ({ ...prev, subdomain: e.target.value }))}
                                                            className="rounded-none border-0 focus-visible:ring-0 focus-visible:ring-offset-0 relative z-10 bg-white h-10"
                                                        />
                                                        <div className="bg-slate-50 px-3 py-2 text-xs text-slate-500 font-medium flex items-center whitespace-nowrap border-l border-slate-100">
                                                            .myshopify.com
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="space-y-2">
                                                    <Label htmlFor="clientId" className="text-xs font-semibold text-slate-700">Client ID</Label>
                                                    <Input
                                                        id="clientId"
                                                        value={shopifyForm.clientId}
                                                        onChange={(e) => setShopifyForm((prev) => ({ ...prev, clientId: e.target.value }))}
                                                        className="font-mono text-xs bg-white h-10"
                                                        placeholder="From App settings"
                                                    />
                                                </div>

                                                <div className="space-y-2">
                                                    <Label htmlFor="clientSecret" className="text-xs font-semibold text-slate-700">Client Secret</Label>
                                                    <Input
                                                        id="clientSecret"
                                                        type="password"
                                                        value={shopifyForm.clientSecret}
                                                        onChange={(e) => setShopifyForm((prev) => ({ ...prev, clientSecret: e.target.value }))}
                                                        className="font-mono text-xs bg-white h-10"
                                                        placeholder="From App settings"
                                                    />
                                                </div>
                                            </div>

                                            <div className="bg-indigo-50 border border-indigo-100 rounded-lg p-3 text-xs text-indigo-700 flex gap-2 items-start leading-relaxed">
                                                <div className="mt-0.5">ℹ️</div>
                                                <p>Credentials are encrypted and stored securely. We only use them to sync your products and orders.</p>
                                            </div>

                                            <Button
                                                className="w-full bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white shadow-lg shadow-indigo-100 transition-all duration-200 h-11 text-sm font-medium rounded-xl mt-2"
                                                onClick={handleShopifyConnect}
                                                disabled={isConnecting}
                                            >
                                                {isConnecting ? (
                                                    <>
                                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Connecting...
                                                    </>
                                                ) : (
                                                    'Connect Store'
                                                )}
                                            </Button>
                                        </div>

                                        <div className="text-center">
                                            <Button variant="link" className="text-xs text-slate-400 font-normal hover:text-indigo-600" onClick={() => setActiveTab('guide')}>
                                                Need help finding credentials? View Guide
                                            </Button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="animate-in fade-in duration-300">
                                        <ShopifyManager userId={userId} showHeader={false} viewMode="list" onAddStore={() => setView('add')} />

                                        {/* Empty State Hint if needed, handled by ShopifyManager usually, but let's add a consistent footer */}
                                        {stores.length > 0 && (
                                            <div className="mt-8 text-center">
                                                <p className="text-xs text-slate-400">
                                                    Need to connect another store? Click <span className="font-medium text-slate-600">Add Store</span> above.
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </TabsContent>

                            <TabsContent value="guide" className="mt-0 px-6 pb-8">
                                <ShopifyGuide />
                            </TabsContent>
                        </ScrollArea>
                    </Tabs>
                </SheetContent>
            </Sheet>
        </div>
    );
}

