import { ShopifyManager } from '@/components/integrations/ShopifyManager';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import {
  Check,
  ChevronRight,
  Copy,
  ExternalLink,
  Loader2,
  Plug,
  Store
} from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { connectToShopify } from '../lib/api';
import { useConnectedStores } from '../lib/firebase/hooks';
import { useI18n } from '../lib/i18n/i18nContext';

interface IntegrationsPageProps {
  userId: string;
}

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

// --- COMPONENTS ---

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

const ShopifyGuide = () => {
  // ... kept same as before but ensured styling is clean
  return (
    <div className="py-4">
      <GuideStep number={1} title="Create Custom App">
        <p>
          Log in to your <a href="https://dev.shopify.com/dashboard" target="_blank" className="text-indigo-600 font-medium hover:underline inline-flex items-center gap-0.5">Shopify Partners Dashboard <ExternalLink size={10} /></a>.
          Click <strong>Create App</strong> and select <strong>Manually created</strong>.
        </p>
        <div className="flex items-center gap-2 mt-2">
          <div className="relative flex-1">
            <Input
              readOnly
              value="Final Form Funnel"
              className="bg-slate-50 border-slate-200 font-mono text-xs h-9 pr-20"
              onClick={(e) => e.currentTarget.select()}
            />
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
            <Input
              readOnly
              value="https://oauth.n8n.cloud/oauth2/callback"
              className="bg-slate-50 border-slate-200 font-mono text-xs h-9 pr-20"
              onClick={(e) => e.currentTarget.select()}
            />
            <div className="absolute right-1 top-1">
              <CopyButton text="https://oauth.n8n.cloud/oauth2/callback" className="h-7 bg-white shadow-sm border border-slate-200 hover:bg-slate-50" />
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
};

// --- MAIN PAGE ---

export default function IntegrationsPage({ userId }: IntegrationsPageProps) {
  const { t, dir } = useI18n();
  const { stores, addStore } = useConnectedStores(userId);

  // UI State
  const [openSheet, setOpenSheet] = useState(false);
  const [activeTab, setActiveTab] = useState('connect');
  const [selectedIntegration, setSelectedIntegration] = useState('all');


  // Form State
  const [shopifyForm, setShopifyForm] = useState({
    subdomain: 'baraaelectromenager-com',
    clientId: '3267facf7b3733a5e74e1e9c3b077437',
    clientSecret: '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'
  });
  const [isConnecting, setIsConnecting] = useState(false);

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
      const result = await connectToShopify(cleanDomain, shopifyForm.clientId.trim(), shopifyForm.clientSecret.trim());

      if (result.success && result.shop) {
        const shopifyDomain = result.shop.myshopify_domain || `${cleanDomain}.myshopify.com`;

        try {
          await addStore({
            name: result.shop.name,
            platform: 'shopify',
            url: shopifyDomain,
            shopifyDomain: shopifyDomain,
            clientId: shopifyForm.clientId.trim(),
            clientSecret: shopifyForm.clientSecret.trim(),
            loaderInstalled: result.loaderInstalled || false,
            loaderVersion: result.loaderVersion,
            loaderScriptTagId: result.loaderScriptTagId,
            loaderInstalledAt: result.loaderInstalled ? new Date().toISOString() : undefined
          });

          toast.success(`Successfully connected ${result.shop.name}!`);
          setOpenSheet(false);
          setShopifyForm({ subdomain: '', clientId: '', clientSecret: '' });
        } catch (addError: any) {
          if (addError.message === "STORE_ALREADY_OWNED") {
            toast.error("This store is already connected to a different account. Please contact support if you believe this is an error.");
          } else if (addError.message === "STORE_ALREADY_CONNECTED") {
            toast.error("This store is already connected to your account.");
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
    <div className="max-w-[1600px] mx-auto p-6 space-y-6 h-full flex flex-col" dir={dir}>

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-6 shrink-0">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Plug className="text-indigo-600" /> Integrations
            <Badge variant="secondary" className="ml-2 font-mono text-xs">
              {stores.length} Connected
            </Badge>
          </h1>
          <p className="text-sm text-slate-500 max-w-2xl">
            Select a platform to manage connected stores and settings.
          </p>
        </div>

        {/* Integration Select Tool */}
        <div className="flex items-center gap-2">
          <Label className="text-slate-500 text-sm">Platform:</Label>
          <Select value={selectedIntegration} onValueChange={setSelectedIntegration}>
            <SelectTrigger className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Integrations</SelectItem>
              <SelectItem value="shopify">Shopify</SelectItem>
              <SelectItem value="woocommerce" disabled>WooCommerce</SelectItem>
              <SelectItem value="sheets" disabled>Google Sheets</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Main Content Area */}
      {selectedIntegration === 'all' && (
        <>
          {stores.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-slate-900">Active Connections</h3>
              </div>
              <ShopifyManager userId={userId} showHeader={false} />
              {/* Future: <WooManager ... /> */}
            </div>
          )}

          <div className="space-y-3 pt-2">
            <h3 className="text-lg font-semibold text-slate-900">Available Integrations</h3>
          </div>
        </>
      )}

      {selectedIntegration === 'shopify' ? (
        <ShopifyManager
          userId={userId}
          onAddStore={() => setOpenSheet(true)}
        />
      ) : selectedIntegration !== 'all' ? (
        <div className="flex items-center justify-center p-12 text-slate-400">
          <p>Integration not supported yet.</p>
        </div>
      ) : null}


      {/* Available Integrations Grid */}
      {(selectedIntegration === 'all' || selectedIntegration === 'shopify') && (
        <div className={cn("space-y-3", selectedIntegration === 'shopify' && "pt-6 border-t border-slate-200")}>
          {selectedIntegration === 'shopify' && <h3 className="text-sm font-semibold text-slate-900">Add New Integration</h3>}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">

            {/* Shopify (Clickable) */}
            <Sheet open={openSheet} onOpenChange={setOpenSheet}>
              <SheetTrigger asChild>
                <Card className="cursor-pointer hover:border-indigo-400 hover:shadow-md transition-all group relative overflow-hidden h-full flex flex-col border-slate-200">
                  <div className="absolute inset-0 bg-gradient-to-br from-indigo-50/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  <CardHeader className="p-5 pb-3">
                    <div className="w-12 h-12 rounded-xl bg-[#95BF47]/10 flex items-center justify-center text-2xl mb-3 shadow-sm group-hover:scale-105 transition-transform duration-300">
                      🛍️
                    </div>
                    <CardTitle className="text-base font-bold text-slate-900">Shopify</CardTitle>
                  </CardHeader>
                  <CardContent className="px-5 pb-5 flex-1 flex flex-col justify-between gap-4">
                    <p className="text-sm text-slate-500 leading-relaxed">
                      Connect more Shopify stores.
                    </p>
                    <div className="text-xs font-bold text-indigo-600 flex items-center group-hover:translate-x-1 transition-transform uppercase tracking-wider">
                      Connect <ChevronRight size={14} className="ml-1" />
                    </div>
                  </CardContent>
                </Card>
              </SheetTrigger>

              <SheetContent className="sm:max-w-lg w-[90vw] flex flex-col h-full p-0 gap-0">
                <SheetHeader className="px-6 py-5 border-b border-slate-100 bg-white/50 backdrop-blur-sm sticky top-0 z-10">
                  <SheetTitle className="flex items-center gap-2.5 text-xl">
                    <div className="w-8 h-8 rounded-lg bg-[#95BF47]/20 flex items-center justify-center text-lg">🛍️</div>
                    Connect Shopify
                  </SheetTitle>
                  <SheetDescription>
                    Connect your Shopify store to sync products and orders.
                  </SheetDescription>
                </SheetHeader>

                <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col min-h-0">
                  <div className="px-6 pt-4 pb-2">
                    <TabsList className="grid w-full grid-cols-2">
                      <TabsTrigger value="connect">Credentials</TabsTrigger>
                      <TabsTrigger value="guide">Step-by-Step Guide</TabsTrigger>
                    </TabsList>
                  </div>

                  <ScrollArea className="flex-1 px-6">
                    <TabsContent value="connect" className="mt-4 space-y-6 pb-8">
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="subdomain">Store Domain</Label>
                          <div className="flex shadow-sm rounded-md">
                            <Input
                              id="subdomain"
                              placeholder="my-store-name"
                              value={shopifyForm.subdomain}
                              onChange={e => setShopifyForm(prev => ({ ...prev, subdomain: e.target.value }))}
                              className="rounded-r-none focus-visible:ring-0 focus-visible:ring-offset-0 relative z-10"
                            />
                            <div className="bg-slate-50 border border-l-0 border-slate-200 px-3 py-2 text-sm text-slate-500 font-medium rounded-r-md flex items-center whitespace-nowrap">
                              .myshopify.com
                            </div>
                          </div>
                        </div>

                        <div className="grid gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="clientId">Client ID</Label>
                            <Input
                              id="clientId"
                              value={shopifyForm.clientId}
                              onChange={e => setShopifyForm(prev => ({ ...prev, clientId: e.target.value }))}
                              className="font-mono text-sm"
                              placeholder="From App settings"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="clientSecret">Client Secret</Label>
                            <Input
                              id="clientSecret"
                              type="password"
                              value={shopifyForm.clientSecret}
                              onChange={e => setShopifyForm(prev => ({ ...prev, clientSecret: e.target.value }))}
                              className="font-mono text-sm"
                              placeholder="From App settings"
                            />
                          </div>
                        </div>
                      </div>

                      <div className="bg-slate-50 border border-slate-100 rounded-lg p-3 text-xs text-slate-500">
                        Credentials are used securely to establish the API connection.
                      </div>
                    </TabsContent>

                    <TabsContent value="guide" className="mt-0 pb-8">
                      <ShopifyGuide />
                    </TabsContent>
                  </ScrollArea>

                  <div className="p-6 border-t border-slate-100 bg-slate-50/50 mt-auto sticky bottom-0 z-10">
                    {activeTab === 'guide' ? (
                      <Button className="w-full" onClick={() => setActiveTab('connect')}>
                        Enter Credentials <ChevronRight size={16} className="ml-2" />
                      </Button>
                    ) : (
                      <Button
                        className="w-full bg-[#95BF47] hover:bg-[#85AB3E] text-white"
                        onClick={handleShopifyConnect}
                        disabled={isConnecting}
                      >
                        {isConnecting ? <Loader2 size={16} className="animate-spin mr-2" /> : <Store size={16} className="mr-2" />}
                        {isConnecting ? 'Verifying...' : 'Connect Store'}
                      </Button>
                    )}
                  </div>
                </Tabs>
              </SheetContent>
            </Sheet>

            {/* WooCommerce (Coming Soon) */}
            <Card className="opacity-60 grayscale cursor-not-allowed border-dashed h-full flex flex-col group hover:opacity-75 transition-all">
              <CardHeader className="p-5 pb-3">
                <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center text-2xl mb-3">
                  📦
                </div>
                <CardTitle className="text-base font-bold text-slate-700">WooCommerce</CardTitle>
              </CardHeader>
              <CardContent className="px-5 pb-5 flex-1">
                <p className="text-sm text-slate-400 mb-3">WordPress e-commerce integration.</p>
                <Badge variant="outline" className="text-slate-400 pointer-events-none">Coming Soon</Badge>
              </CardContent>
            </Card>

            {/* WhatsApp (Coming Soon) */}
            <Card className="opacity-60 grayscale cursor-not-allowed border-dashed h-full flex flex-col group hover:opacity-75 transition-all">
              <CardHeader className="p-5 pb-3">
                <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center text-2xl mb-3">
                  💬
                </div>
                <CardTitle className="text-base font-bold text-slate-700">WhatsApp</CardTitle>
              </CardHeader>
              <CardContent className="px-5 pb-5 flex-1">
                <p className="text-sm text-slate-400 mb-3">Order notifications & support.</p>
                <Badge variant="outline" className="text-slate-400 pointer-events-none">Coming Soon</Badge>
              </CardContent>
            </Card>

            {/* Google Sheets (Coming Soon) */}
            <Card className="opacity-60 grayscale cursor-not-allowed border-dashed h-full flex flex-col group hover:opacity-75 transition-all">
              <CardHeader className="p-5 pb-3">
                <div className="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center text-2xl mb-3">
                  📊
                </div>
                <CardTitle className="text-base font-bold text-slate-700">Google Sheets</CardTitle>
              </CardHeader>
              <CardContent className="px-5 pb-5 flex-1">
                <p className="text-sm text-slate-400 mb-3">Export leads to spreadsheets.</p>
                <Badge variant="outline" className="text-slate-400 pointer-events-none">Coming Soon</Badge>
              </CardContent>
            </Card>

          </div>
        </div>
      )}
    </div>
  );
}
