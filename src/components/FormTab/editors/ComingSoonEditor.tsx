import { useFormStore } from "../../../stores";
import { CollapsibleSection } from "../components/CollapsibleSection";
import { Sparkles } from "lucide-react";

export const COMING_SOON_INTEGRATIONS: Record<string, { name: string, emoji: string, description: string }> = {
    woocommerce: { name: 'WooCommerce', emoji: '📦', description: 'Connect directly to your WooCommerce store.' },
    webhook: { name: 'Webhook', emoji: '⚡', description: 'Send data to any URL or Zapier/Make flow.' },
    maystro: { name: 'Maystro Delivery', emoji: '🚚', description: 'Automate tracking and delivery with Maystro.' },
    zr_delivery: { name: 'ZR Delivery', emoji: '🚛', description: 'Ship your orders easily with ZR Delivery.' },
    yalidine: { name: 'Yalidine', emoji: '📮', description: 'Seamless integration with Yalidine Express.' },
    anderson: { name: 'Anderson', emoji: '📦', description: 'Anderson logistics integration.' },
    ecommanager: { name: 'Ecommanager', emoji: '💼', description: 'Connect with Ecommanager CRM.' },
};

export const ComingSoonEditor = () => {
    const editingSection = useFormStore(state => state.editingSection);

    // Fallback if not mapped
    const integrationInfo = COMING_SOON_INTEGRATIONS[editingSection || ''] || {
        name: 'Coming Soon',
        emoji: '✨',
        description: 'We are working hard to bring this feature to you.'
    };

    return (
        <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
            <h3 className="text-[10px] font-black uppercase text-slate-400 tracking-widest flex items-center gap-2 px-1">
                <Sparkles size={14} className="text-indigo-400" /> {integrationInfo.name}
            </h3>

            <CollapsibleSection title={integrationInfo.name} icon={Sparkles} defaultOpen={true}>
                <div className="flex flex-col items-center justify-center p-8 text-center bg-slate-50/50 border border-slate-100 rounded-xl space-y-4">
                    <div className="w-16 h-16 rounded-2xl bg-white border border-slate-200 flex items-center justify-center text-4xl shadow-sm grayscale opacity-50">
                        {integrationInfo.emoji}
                    </div>
                    <div className="space-y-1">
                        <h4 className="text-sm font-bold text-slate-700">{integrationInfo.name} Integration</h4>
                        <p className="text-[11px] text-slate-500 max-w-[200px] mx-auto leading-relaxed">
                            {integrationInfo.description}
                        </p>
                    </div>
                    <div className="inline-flex items-center justify-center px-3 py-1 mt-2 text-[10px] font-bold tracking-widest uppercase rounded-full bg-indigo-50 text-indigo-600 border border-indigo-100">
                        Coming Soon
                    </div>
                </div>
            </CollapsibleSection>
        </div>
    );
};
