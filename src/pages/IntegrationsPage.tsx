
import { PageHeader } from '@/components/GlobalHeader/PageHeader';
import { ComingSoonCard } from '@/components/integrations/ComingSoonCard';
import { ShopifyIntegration } from '@/components/integrations/ShopifyIntegration';
import { WhatsAppIntegration } from '@/components/integrations/WhatsAppIntegration';
import { GoogleSheetsIntegration } from '@/components/integrations/GoogleSheetsIntegration';
import { MetaPixelIntegration } from '@/components/integrations/MetaPixelIntegration';
import { TikTokIntegration } from '@/components/integrations/TikTokIntegration';
import { cn } from '@/lib/utils';
import { Plug, Store } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useI18n } from '../lib/i18n/i18nContext';

interface IntegrationsPageProps {
  userId: string;
}

type FilterCategory = 'all' | 'ecommerce' | 'communication' | 'marketing' | 'delivery';

export default function IntegrationsPage({ userId }: IntegrationsPageProps) {
  const { dir } = useI18n();
  const [filter, setFilter] = useState<FilterCategory>('all');
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const openParam = searchParams.get('open');
    const integrationParam = searchParams.get('integration');
    const target = openParam || integrationParam;

    if (target) {
      if (target === 'whatsapp') setFilter('communication');
      else if (target === 'google-sheets') setFilter('marketing');
      else if (target === 'meta-pixel') setFilter('marketing');
      else setFilter('all');
    }
  }, [searchParams]);

  const categories = [
    { id: 'all', label: 'All Apps' },
    { id: 'ecommerce', label: 'E-commerce' },
    { id: 'communication', label: 'Communication' },
    { id: 'marketing', label: 'Marketing & Data' },
    { id: 'delivery', label: 'Delivery' },
  ];

  return (
    <div className="max-w-[1600px] mx-auto w-full space-y-8 h-full flex flex-col pt-2" dir={dir}>
      <PageHeader
        title="Integrations"
        breadcrumbs={[{ label: 'Integrations' }]}
        icon={Plug}
        actions={
          <div className="flex bg-slate-100 p-1 rounded-full border border-slate-200">
            {categories.map(cat => (
              <button
                key={cat.id}
                onClick={() => setFilter(cat.id as FilterCategory)}
                className={cn(
                  "px-4 py-1.5 rounded-full text-xs font-semibold transition-all",
                  filter === cat.id
                    ? "bg-white text-slate-900 shadow-sm"
                    : "text-slate-500 hover:text-slate-700 hover:bg-slate-200/50"
                )}
              >
                {cat.label}
              </button>
            ))}
          </div>
        }
      />

      {/* Main Content Area */}
      <div className="space-y-12 pb-20 overflow-y-auto flex-1 pr-2">
        <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">

          {/* E-COMMERCE */}
          {(filter === 'all' || filter === 'ecommerce') && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-2">
                <h3 className="text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
                  <Store size={18} className="text-indigo-500" /> E-commerce Platforms
                </h3>
                <div className="h-px bg-slate-100 flex-1 ml-4" />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                <ShopifyIntegration userId={userId} />
                <ComingSoonCard name="WooCommerce" emoji="📦" />
              </div>
            </div>
          )}

          {/* COMMUNICATION */}
          {(filter === 'all' || filter === 'communication') && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-2">
                <h3 className="text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-green-500" /> Communication
                </h3>
                <div className="h-px bg-slate-100 flex-1 ml-4" />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                <WhatsAppIntegration userId={userId} />
              </div>
            </div>
          )}

          {/* MARKETING & DATA */}
          {(filter === 'all' || filter === 'marketing') && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-2">
                <h3 className="text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-blue-500" /> Marketing & Data
                </h3>
                <div className="h-px bg-slate-100 flex-1 ml-4" />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                <MetaPixelIntegration userId={userId} />
                <TikTokIntegration userId={userId} />
                <GoogleSheetsIntegration userId={userId} />
                <ComingSoonCard name="Webhook" emoji="⚡" />
              </div>
            </div>
          )}

          {/* DELIVERY SERVICES */}
          {(filter === 'all' || filter === 'delivery') && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-2">
                <h3 className="text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-amber-500" /> Delivery Integration
                </h3>
                <div className="h-px bg-slate-100 flex-1 ml-4" />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                <ComingSoonCard name="Maystro Delivery" emoji="🚚" />
                <ComingSoonCard name="ZR Delivery" emoji="🚛" />
                <ComingSoonCard name="Yalidine" emoji="📮" />
                <ComingSoonCard name="Anderson" emoji="📦" />
                <ComingSoonCard name="Ecommanager" emoji="💼" />
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
