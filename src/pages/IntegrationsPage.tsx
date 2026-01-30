
import { PageHeader } from '@/components/GlobalHeader/PageHeader';
import { ShopifyManager } from '@/components/integrations/ShopifyManager';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import {
  Check,
  ChevronLeft,
  ChevronRight,
  Copy,
  ExternalLink,
  Loader2,
  Plug,
  Store,
  X
} from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { connectToShopify } from '../lib/api';
import { useConnectedStores } from '../lib/firebase/hooks';
import { WhatsAppProfile } from '../lib/firebase/types';
import { useWhatsAppProfiles } from '../lib/firebase/whatsappHooks';
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

  // WhatsApp State
  const { profiles: waProfiles, addProfile: addWaProfile, updateProfile: updateWaProfile, deleteProfile: deleteWaProfile, isProfileAssigned } = useWhatsAppProfiles(userId);
  const [editingWaProfile, setEditingWaProfile] = useState<WhatsAppProfile | 'new' | null>(null);
  const [waForm, setWaForm] = useState({ name: '', phoneNumber: '', isDefault: false });

  const handleEditWaProfile = (profile: WhatsAppProfile | 'new') => {
    setEditingWaProfile(profile);
    if (profile === 'new') {
      setWaForm({ name: '', phoneNumber: '+213', isDefault: waProfiles.length === 0 });
    } else {
      setWaForm({ name: profile.name, phoneNumber: profile.phoneNumber, isDefault: profile.isDefault });
    }
  };

  const handleSaveWaProfile = async () => {
    if (!waForm.name || !waForm.phoneNumber) {
      toast.error("Name and Phone Number are required.");
      return;
    }

    try {
      if (editingWaProfile === 'new') {
        await addWaProfile(waForm);
        toast.success("Profile created!");
      } else if (editingWaProfile) {
        await updateWaProfile(editingWaProfile.id, waForm);
        toast.success("Profile updated!");
      }
      setEditingWaProfile(null);
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const handleDeleteWaProfile = async (id: string) => {
    try {
      const isAssigned = await isProfileAssigned(id);
      if (isAssigned) {
        toast.error("Cannot delete this profile because it is assigned to one or more forms. Please unassign it first or select a different profile in those forms.");
        return;
      }
      if (confirm("Are you sure you want to delete this profile?")) {
        await deleteWaProfile(id);
        toast.success("Profile deleted");
        if (editingWaProfile && typeof editingWaProfile !== 'string' && editingWaProfile.id === id) {
          setEditingWaProfile(null);
        }
      }
    } catch (e: any) {
      toast.error(e.message);
    }
  };


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

          toast.success(`Successfully connected ${result.shop.name} !`);
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


  // Header Actions - Removed from PageHeader, moved to Browse section

  return (
    <div className="max-w-[1600px] mx-auto w-full space-y-6 h-full flex flex-col" dir={dir}>
      <PageHeader
        title="Integrations"
        breadcrumbs={[
          { label: 'Integrations' }
        ]}
        count={stores.length}
        icon={Plug}
        actions={
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" className="rounded-full bg-white border-slate-200 text-slate-700 hover:text-indigo-600 hover:border-indigo-200">
                My Integrations <ChevronLeft className="ml-2 rotate-180" size={14} />
              </Button>
            </SheetTrigger>
            <SheetContent className="w-[400px] sm:w-[540px]">
              <SheetHeader className="pb-6 border-b border-slate-100">
                <SheetTitle>My Integrations</SheetTitle>
                <SheetDescription>
                  Manage your active connections and settings.
                </SheetDescription>
              </SheetHeader>
              <div className="py-6">
                <ShopifyManager userId={userId} showHeader={false} viewMode="list" />
              </div>
            </SheetContent>
          </Sheet>
        }
      />


      {/* Main Content Area */}
      {selectedIntegration === 'all' && (
        <div className="space-y-12 pb-20 overflow-y-auto flex-1 pr-2">

          {/* 1. PLATFORMS */}
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
                <Store size={18} className="text-indigo-500" /> E-commerce Platforms
              </h3>
              <p className="text-sm text-slate-500 mt-1">Connect your online store ecosystem</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {/* Shopify */}
              <div className="md:col-span-1 md:row-span-1">
                <Sheet open={openSheet} onOpenChange={setOpenSheet}>
                  <SheetTrigger asChild>
                    <Card className="cursor-pointer bg-white border border-slate-200 rounded-3xl overflow-hidden hover:ring-2 hover:ring-indigo-100 hover:shadow-lg transition-all duration-300 group relative h-full flex flex-col shadow-sm min-h-[200px] p-6">
                      <ChevronRight className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-all group-hover:translate-x-1 text-slate-400" />
                      <div className="absolute inset-0 bg-gradient-to-br from-indigo-50/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                      <div className="flex flex-col h-full justify-between relative z-10">
                        <div className="w-14 h-14 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-3xl mb-4 shadow-sm group-hover:scale-110 group-hover:-rotate-3 transition-transform duration-300">
                          🛍️
                        </div>
                        <div>
                          <CardTitle className="text-xl font-bold text-slate-900 tracking-tight">Shopify</CardTitle>
                          <p className="text-sm text-slate-500 mt-2 font-medium leading-normal">
                            Sync products & orders
                          </p>
                        </div>
                      </div>
                    </Card>
                  </SheetTrigger>

                  {/* Sheet Content Implementation (Reused) */}
                  <SheetContent className="sm:max-w-lg w-[90vw] flex flex-col h-full p-0 gap-0">
                    <SheetHeader className="px-6 py-5 border-b border-slate-100 bg-white/50 backdrop-blur-sm sticky top-0 z-10">
                      <SheetTitle className="flex items-center gap-2.5 text-xl">
                        <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center text-lg">🛍️</div>
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
                            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white"
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
              </div>

              {/* WooCommerce */}
              <Card className="group h-full flex flex-col p-6 bg-slate-50/50 border border-slate-200/50 border-dashed rounded-[2rem] opacity-70 hover:opacity-100 transition-opacity min-h-[200px] relative">
                <ChevronRight className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-all group-hover:translate-x-1 text-slate-400" />
                <div className="flex flex-col h-full justify-between bg-transparent">
                  <div className="w-14 h-14 rounded-2xl bg-white border border-slate-200 flex items-center justify-center text-3xl mb-4 grayscale opacity-50 shadow-sm">
                    📦
                  </div>
                  <div>
                    <h4 className="text-lg font-bold text-slate-400 group-hover:text-slate-600 transition-colors">WooCommerce</h4>
                    <Badge variant="outline" className="mt-2 text-[10px] bg-transparent border-slate-300 text-slate-400">Coming Soon</Badge>
                  </div>
                </div>
              </Card>
            </div>
          </div>


          {/* 2. COMMUNICATION */}
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-green-500" /> Communication
              </h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {/* WhatsApp */}
              <div className="md:col-span-1 md:row-span-1">
                <Sheet>
                  <SheetTrigger asChild>
                    <Card className="cursor-pointer bg-white border border-slate-200 shadow-sm rounded-3xl overflow-hidden hover:bg-white hover:ring-2 hover:ring-green-100 transition-all duration-300 group relative h-full flex flex-col p-6 min-h-[200px]">
                      <ChevronRight className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-all group-hover:translate-x-1 text-slate-400" />
                      <div className="absolute inset-0 bg-gradient-to-br from-green-50/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                      <div className="flex flex-col h-full justify-between relative z-10">
                        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center text-3xl text-white shadow-lg shadow-green-200 group-hover:scale-110 group-hover:rotate-3 transition-transform mb-4">
                          💬
                        </div>
                        <div>
                          <h4 className="text-xl font-bold text-slate-900">WhatsApp</h4>
                          <p className="text-sm text-slate-500 mt-2 font-medium leading-normal">Order recovery & confirms</p>
                        </div>
                      </div>
                    </Card>
                  </SheetTrigger>

                  {/* WhatsApp Sheet Content (Reused) */}
                  <SheetContent className="sm:max-w-lg w-[90vw] flex flex-col h-full p-0 gap-0">
                    <SheetHeader className="px-6 py-5 border-b border-slate-100 bg-white/50 backdrop-blur-sm sticky top-0 z-10">
                      <SheetTitle className="flex items-center gap-2.5 text-xl">
                        <div className="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center text-lg">💬</div>
                        Configure WhatsApp
                      </SheetTitle>
                      <SheetDescription>
                        Manage WhatsApp profiles for order confirmation.
                      </SheetDescription>
                    </SheetHeader>

                    <ScrollArea className="flex-1 px-6">
                      <div className="py-6 space-y-6">
                        {/* Profiles List */}
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <h3 className="text-sm font-semibold text-slate-900">Profiles</h3>
                            <Button size="sm" variant="outline" className="h-8 text-xs" onClick={() => handleEditWaProfile('new')}>+ Add Profile</Button>
                          </div>

                          {waProfiles.length === 0 && (
                            <div className="text-center py-6 text-slate-400 text-xs">
                              No WhatsApp profiles yet. Add one to get started.
                            </div>
                          )}

                          {waProfiles.map(profile => (
                            <div
                              key={profile.id}
                              className={`border rounded-lg p-3 flex items-center justify-between bg-white group transition-all cursor-pointer ${editingWaProfile !== 'new' && editingWaProfile?.id === profile.id ? 'border-green-500 ring-1 ring-green-100' : 'border-slate-200 hover:border-green-300'} `}
                              onClick={() => handleEditWaProfile(profile)}
                            >
                              <div className="space-y-1">
                                <div className="text-sm font-medium text-slate-900 flex items-center gap-2">
                                  {profile.name}
                                  {profile.isDefault && <Badge variant="secondary" className="text-[10px] bg-green-50 text-green-700 h-5 px-1.5">Default</Badge>}
                                </div>
                                <div className="text-xs text-slate-500 font-mono" dir="ltr">{profile.phoneNumber}</div>
                              </div>
                              <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-green-600">
                                <ChevronRight size={16} />
                              </Button>
                            </div>
                          ))}
                        </div>

                        {/* Edit Form */}
                        {editingWaProfile && (
                          <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 space-y-3 animate-in fade-in slide-in-from-top-2">
                            <div className="flex items-center justify-between">
                              <h4 className="text-xs font-bold text-slate-500 uppercase">{editingWaProfile === 'new' ? 'New Profile' : 'Edit Profile'}</h4>
                              <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setEditingWaProfile(null)}><X size={14} /></Button>
                            </div>
                            <div className="space-y-3">
                              <div className="space-y-1">
                                <Label className="text-xs">Profile Name</Label>
                                <Input
                                  placeholder="e.g. Sales Team"
                                  className="bg-white"
                                  value={waForm.name}
                                  onChange={e => setWaForm({ ...waForm, name: e.target.value })}
                                />
                              </div>
                              <div className="space-y-1">
                                <Label className="text-xs">WhatsApp Number (International format)</Label>
                                <div className="flex shadow-sm rounded-md">
                                  <div className="bg-slate-100 border border-r-0 border-slate-200 px-3 py-2 text-sm text-slate-600 font-mono rounded-l-md flex items-center">
                                    +213
                                  </div>
                                  <Input
                                    placeholder="555123456"
                                    className="bg-white font-mono rounded-l-none"
                                    dir="ltr"
                                    value={waForm.phoneNumber.replace(/^\+213/, '')}
                                    onChange={e => {
                                      const digits = e.target.value.replace(/\D/g, '');
                                      setWaForm({ ...waForm, phoneNumber: '+213' + digits });
                                    }}
                                  />
                                </div>
                              </div>

                              <div className="flex items-center gap-2 py-1">
                                <Switch
                                  id="wa-default"
                                  checked={waForm.isDefault}
                                  onCheckedChange={(checked) => setWaForm({ ...waForm, isDefault: checked })}
                                />
                                <Label htmlFor="wa-default" className="text-xs text-slate-600">Set as default profile</Label>
                              </div>

                              <div className="flex gap-2 pt-2">
                                <Button size="sm" className="flex-1 bg-[#25D366] hover:bg-[#20bd5a] text-white" onClick={handleSaveWaProfile}>
                                  {editingWaProfile === 'new' ? 'Create Profile' : 'Save Changes'}
                                </Button>
                                {editingWaProfile !== 'new' && (
                                  <Button size="sm" variant="outline" className="text-red-600 hover:bg-red-50 hover:text-red-700 border-red-100" onClick={() => handleDeleteWaProfile(editingWaProfile.id)}>
                                    Delete
                                  </Button>
                                )}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </ScrollArea>
                  </SheetContent>
                </Sheet>
              </div>
            </div>
          </div>


          {/* 3. MARKETING & DATA */}
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-blue-500" /> Marketing & Data
              </h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {/* Facebook/Meta */}
              <Card className="group h-full flex flex-col p-6 bg-slate-50/50 border border-slate-200/50 border-dashed rounded-[2rem] opacity-70 hover:opacity-100 transition-opacity min-h-[200px] relative">
                <ChevronRight className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-all group-hover:translate-x-1 text-slate-400" />
                <div className="flex flex-col h-full justify-between">
                  <div className="w-14 h-14 rounded-2xl bg-white border border-slate-200 flex items-center justify-center text-3xl mb-4 grayscale opacity-50 shadow-sm">
                    ♾️
                  </div>
                  <div>
                    <h4 className="text-lg font-bold text-slate-400 group-hover:text-slate-600 transition-colors">Meta Pixel</h4>
                    <Badge variant="outline" className="mt-2 text-[10px] bg-transparent border-slate-300 text-slate-400">Coming Soon</Badge>
                  </div>
                </div>
              </Card>

              {/* TikTok */}
              <Card className="group h-full flex flex-col p-6 bg-slate-50/50 border border-slate-200/50 border-dashed rounded-[2rem] opacity-70 hover:opacity-100 transition-opacity min-h-[200px] relative">
                <ChevronRight className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-all group-hover:translate-x-1 text-slate-400" />
                <div className="flex flex-col h-full justify-between">
                  <div className="w-14 h-14 rounded-2xl bg-white border border-slate-200 flex items-center justify-center text-3xl mb-4 grayscale opacity-50 shadow-sm">
                    🎵
                  </div>
                  <div>
                    <h4 className="text-lg font-bold text-slate-400 group-hover:text-slate-600 transition-colors">TikTok Pixel</h4>
                    <Badge variant="outline" className="mt-2 text-[10px] bg-transparent border-slate-300 text-slate-400">Coming Soon</Badge>
                  </div>
                </div>
              </Card>

              {/* Google Sheets */}
              <Card className="group h-full flex flex-col p-6 bg-slate-50/50 border border-slate-200/50 border-dashed rounded-[2rem] opacity-70 hover:opacity-100 transition-opacity min-h-[200px] relative">
                <ChevronRight className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-all group-hover:translate-x-1 text-slate-400" />
                <div className="flex flex-col h-full justify-between">
                  <div className="w-14 h-14 rounded-2xl bg-white border border-slate-200 flex items-center justify-center text-3xl mb-4 grayscale opacity-50 shadow-sm">
                    📊
                  </div>
                  <div>
                    <h4 className="text-lg font-bold text-slate-400 group-hover:text-slate-600 transition-colors">Sheets</h4>
                    <Badge variant="outline" className="mt-2 text-[10px] bg-transparent border-slate-300 text-slate-400">Coming Soon</Badge>
                  </div>
                </div>
              </Card>

              {/* Webhook */}
              <Card className="group h-full flex flex-col p-6 bg-slate-50/50 border border-slate-200/50 border-dashed rounded-[2rem] opacity-70 hover:opacity-100 transition-opacity min-h-[200px] relative">
                <ChevronRight className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-all group-hover:translate-x-1 text-slate-400" />
                <div className="flex flex-col h-full justify-between">
                  <div className="w-14 h-14 rounded-2xl bg-white border border-slate-200 flex items-center justify-center text-3xl mb-4 grayscale opacity-50 shadow-sm">
                    ⚡
                  </div>
                  <div>
                    <h4 className="text-lg font-bold text-slate-400 group-hover:text-slate-600 transition-colors">Webhook</h4>
                    <Badge variant="outline" className="mt-2 text-[10px] bg-transparent border-slate-300 text-slate-400">Coming Soon</Badge>
                  </div>
                </div>
              </Card>
            </div>
          </div>


          {/* 4. DELIVERY SERVICES */}
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-amber-500" /> App Delivery Integration
              </h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {/* Maystro Delivery */}
              <Card className="group h-full flex flex-col p-6 bg-slate-50/50 border border-slate-200/50 border-dashed rounded-[2rem] opacity-70 hover:opacity-100 transition-opacity min-h-[200px] relative">
                <ChevronRight className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-all group-hover:translate-x-1 text-slate-400" />
                <div className="flex flex-col h-full justify-between">
                  <div className="w-14 h-14 rounded-2xl bg-white border border-slate-200 flex items-center justify-center text-3xl mb-4 grayscale opacity-50 shadow-sm">
                    🚚
                  </div>
                  <div>
                    <h4 className="text-lg font-bold text-slate-400 group-hover:text-slate-600 transition-colors">Maystro Delivery</h4>
                    <Badge variant="outline" className="mt-2 text-[10px] bg-transparent border-slate-300 text-slate-400">Coming Soon</Badge>
                  </div>
                </div>
              </Card>

              {/* ZR Delivery */}
              <Card className="group h-full flex flex-col p-6 bg-slate-50/50 border border-slate-200/50 border-dashed rounded-[2rem] opacity-70 hover:opacity-100 transition-opacity min-h-[200px] relative">
                <ChevronRight className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-all group-hover:translate-x-1 text-slate-400" />
                <div className="flex flex-col h-full justify-between">
                  <div className="w-14 h-14 rounded-2xl bg-white border border-slate-200 flex items-center justify-center text-3xl mb-4 grayscale opacity-50 shadow-sm">
                    🚛
                  </div>
                  <div>
                    <h4 className="text-lg font-bold text-slate-400 group-hover:text-slate-600 transition-colors">ZR Delivery</h4>
                    <Badge variant="outline" className="mt-2 text-[10px] bg-transparent border-slate-300 text-slate-400">Coming Soon</Badge>
                  </div>
                </div>
              </Card>

              {/* Yalidine */}
              <Card className="group h-full flex flex-col p-6 bg-slate-50/50 border border-slate-200/50 border-dashed rounded-[2rem] opacity-70 hover:opacity-100 transition-opacity min-h-[200px] relative">
                <ChevronRight className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-all group-hover:translate-x-1 text-slate-400" />
                <div className="flex flex-col h-full justify-between">
                  <div className="w-14 h-14 rounded-2xl bg-white border border-slate-200 flex items-center justify-center text-3xl mb-4 grayscale opacity-50 shadow-sm">
                    📮
                  </div>
                  <div>
                    <h4 className="text-lg font-bold text-slate-400 group-hover:text-slate-600 transition-colors">Yalidine</h4>
                    <Badge variant="outline" className="mt-2 text-[10px] bg-transparent border-slate-300 text-slate-400">Coming Soon</Badge>
                  </div>
                </div>
              </Card>

              {/* Anderson */}
              <Card className="group h-full flex flex-col p-6 bg-slate-50/50 border border-slate-200/50 border-dashed rounded-[2rem] opacity-70 hover:opacity-100 transition-opacity min-h-[200px] relative">
                <ChevronRight className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-all group-hover:translate-x-1 text-slate-400" />
                <div className="flex flex-col h-full justify-between">
                  <div className="w-14 h-14 rounded-2xl bg-white border border-slate-200 flex items-center justify-center text-3xl mb-4 grayscale opacity-50 shadow-sm">
                    📦
                  </div>
                  <div>
                    <h4 className="text-lg font-bold text-slate-400 group-hover:text-slate-600 transition-colors">Anderson</h4>
                    <Badge variant="outline" className="mt-2 text-[10px] bg-transparent border-slate-300 text-slate-400">Coming Soon</Badge>
                  </div>
                </div>
              </Card>

              {/* Ecommanager */}
              <Card className="group h-full flex flex-col p-6 bg-slate-50/50 border border-slate-200/50 border-dashed rounded-[2rem] opacity-70 hover:opacity-100 transition-opacity min-h-[200px] relative">
                <ChevronRight className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-all group-hover:translate-x-1 text-slate-400" />
                <div className="flex flex-col h-full justify-between">
                  <div className="w-14 h-14 rounded-2xl bg-white border border-slate-200 flex items-center justify-center text-3xl mb-4 grayscale opacity-50 shadow-sm">
                    💼
                  </div>
                  <div>
                    <h4 className="text-lg font-bold text-slate-400 group-hover:text-slate-600 transition-colors">Ecommanager</h4>
                    <Badge variant="outline" className="mt-2 text-[10px] bg-transparent border-slate-300 text-slate-400">Coming Soon</Badge>
                  </div>
                </div>
              </Card>
            </div>
          </div>

        </div>
      )}

      {selectedIntegration === 'shopify' && (
        <div className="flex-1 flex flex-col min-h-0">
          <div className="pb-4">
            <Button variant="ghost" onClick={() => setSelectedIntegration('all')} className="text-slate-500 mb-2 hover:text-indigo-600 hover:bg-indigo-50">
              <ChevronLeft size={16} className="mr-1" /> Back to Hub
            </Button>
          </div>
          <ShopifyManager userId={userId} onAddStore={() => setOpenSheet(true)} />
        </div>
      )}

    </div>
  );
}
