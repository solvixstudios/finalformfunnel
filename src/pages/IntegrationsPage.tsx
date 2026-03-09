import { PageHeader } from '@/components/GlobalHeader/PageHeader';
import React, { useState } from 'react';
import { WhatsAppIntegration } from '../components/integrations/WhatsAppIntegration';
import { DeliveryIntegration } from '../components/integrations/DeliveryIntegration';
import { MetaPixelIntegration } from '../components/integrations/MetaPixelIntegration';
import { TikTokIntegration } from '../components/integrations/TikTokIntegration';
import { GoogleSheetsIntegration } from '../components/integrations/GoogleSheetsIntegration';
import { ShopifyIntegration } from '../components/integrations/ShopifyIntegration';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faWhatsapp, faMeta, faTiktok, faShopify } from '@fortawesome/free-brands-svg-icons';
import { faTruck, faTable, faBoxOpen, faLayerGroup } from '@fortawesome/free-solid-svg-icons';
import { cn } from '@/lib/utils';
import { WoocommerceIntegration } from '@/components/integrations/WoocommerceIntegration';

interface IntegrationsPageProps {
    userId: string;
}

type IntegrationId = 'whatsapp' | 'delivery' | 'meta' | 'tiktok' | 'shopify' | 'woocommerce' | 'google_sheets' | null;

const INTEGRATIONS_LIST = [
    { id: 'whatsapp', title: 'WhatsApp', icon: <FontAwesomeIcon icon={faWhatsapp} className="text-lg" />, color: 'text-green-600', bg: 'bg-green-50' },
    { id: 'delivery', title: 'Livraison', icon: <FontAwesomeIcon icon={faTruck} className="text-sm" />, color: 'text-orange-600', bg: 'bg-orange-50' },
    { id: 'meta', title: 'Meta Pixel', icon: <FontAwesomeIcon icon={faMeta} className="text-lg" />, color: 'text-blue-600', bg: 'bg-blue-50' },
    { id: 'tiktok', title: 'TikTok Pixel', icon: <FontAwesomeIcon icon={faTiktok} className="text-lg" />, color: 'text-zinc-800', bg: 'bg-zinc-100' },
    { id: 'shopify', title: 'Shopify', icon: <FontAwesomeIcon icon={faShopify} className="text-lg" />, color: 'text-indigo-600', bg: 'bg-indigo-50' },
    { id: 'woocommerce', title: 'WooCommerce', icon: <FontAwesomeIcon icon={faBoxOpen} className="text-sm" />, color: 'text-[#96588a]', bg: 'bg-[#96588a]/10' },
    { id: 'google_sheets', title: 'Google Sheets', icon: <FontAwesomeIcon icon={faTable} className="text-base" />, color: 'text-emerald-600', bg: 'bg-emerald-50' },
];

const IntegrationsPage: React.FC<IntegrationsPageProps> = ({ userId }) => {
    const [activeIntegration, setActiveIntegration] = useState<IntegrationId>(null);

    const handleBack = () => setActiveIntegration(null);

    const renderActiveIntegration = () => {
        switch (activeIntegration) {
            case 'whatsapp': return <WhatsAppIntegration userId={userId} onBack={handleBack} />;
            case 'delivery': return <DeliveryIntegration userId={userId} onBack={handleBack} />;
            case 'meta': return <MetaPixelIntegration userId={userId} onBack={handleBack} />;
            case 'tiktok': return <TikTokIntegration userId={userId} onBack={handleBack} />;
            case 'shopify': return <ShopifyIntegration userId={userId} onBack={handleBack} />;
            case 'woocommerce': return <WoocommerceIntegration userId={userId} onBack={handleBack} />;
            case 'google_sheets': return <GoogleSheetsIntegration userId={userId} onBack={handleBack} />;
            default: return null;
        }
    };

    return (
        <div className="flex-1 flex flex-col h-full overflow-hidden bg-slate-50/50">
            {/* Header section matching other pages - hidden when an integration is active */}
            {!activeIntegration && (
                <div className="bg-white border-b border-slate-200 shrink-0 sticky top-0 z-30">
                    <PageHeader
                        title="Intégrations"
                        breadcrumbs={[
                            { label: 'Accueil', href: '/' },
                            { label: 'Intégrations', href: '/integrations', onClick: handleBack }
                        ]}
                    />
                </div>
            )}

            <div className="flex-1 overflow-hidden flex flex-col md:flex-row w-full max-w-[1600px] mx-auto">
                {/* Sidebar - visibly always on Desktop, list view on Mobile when nothing selected */}
                <div className={cn("w-full md:w-64 border-b md:border-b-0 md:border-r border-slate-200 bg-white flex-col shrink-0 overflow-y-auto", activeIntegration ? "hidden md:flex" : "flex")}>
                    <div className="flex-1 p-3 space-y-1">
                        <h4 className="text-[10px] font-black uppercase tracking-wider text-slate-400 px-3 mb-2 mt-4">
                            Intégrations Disponibles
                        </h4>
                        {INTEGRATIONS_LIST.map((int) => (
                            <button
                                key={int.id}
                                onClick={() => setActiveIntegration(int.id as IntegrationId)}
                                className={cn(
                                    "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 text-left",
                                    activeIntegration === int.id
                                        ? "bg-slate-100/80 text-slate-900 shadow-[inset_0_1px_2px_rgba(0,0,0,0.02)] border border-slate-200"
                                        : "text-slate-600 hover:bg-slate-50 border border-transparent hover:border-slate-200"
                                )}
                            >
                                <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center shadow-sm", int.bg, int.color)}>
                                    {int.icon}
                                </div>
                                <span className="flex-1 truncate">{int.title}</span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Main Content Area */}
                <div className={cn("flex-1 overflow-x-hidden overflow-y-auto bg-slate-50/50 relative flex-col", !activeIntegration ? "hidden md:flex" : "flex")}>
                    {!activeIntegration ? (
                        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-slate-50">
                            <div className="w-16 h-16 rounded-2xl bg-white border border-slate-200 shadow-sm flex items-center justify-center mb-5 text-slate-300">
                                <FontAwesomeIcon icon={faLayerGroup} className="text-3xl" />
                            </div>
                            <h3 className="text-lg font-bold text-slate-800">Sélectionnez une intégration</h3>
                            <p className="text-sm text-slate-500 max-w-sm mt-2 leading-relaxed">Choisissez une intégration dans le menu de gauche pour la configurer et commencer la liaison avec vos fiches formulaires.</p>
                        </div>
                    ) : (
                        <div className="flex-1 w-full h-full flex flex-col relative z-0">
                            {renderActiveIntegration()}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default IntegrationsPage;
