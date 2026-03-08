import { Truck, Shield } from "lucide-react";
import { useFormStore } from "../../../stores";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

export type ShippingProviderType = 'yalidine' | 'maystro' | 'zr_delivery' | 'anderson' | 'ecommanager';

interface ShippingProviderEditorProps {
    provider: ShippingProviderType;
}

const PROVIDER_METADATA = {
    yalidine: {
        name: "Yalidine",
        description: "Yalidine Express Logistics",
        colors: "from-rose-50 to-red-50 text-rose-600 border-rose-200",
        iconColors: "bg-rose-100 text-rose-600",
        fields: [
            { id: "apiId", label: "API ID", placeholder: "Your Yalidine API ID" },
            { id: "apiToken", label: "API Token", placeholder: "Your Yalidine API Token" }
        ]
    },
    maystro: {
        name: "Maystro Delivery",
        description: "Maystro Express Logistics",
        colors: "from-blue-50 to-indigo-50 text-blue-600 border-blue-200",
        iconColors: "bg-blue-100 text-blue-600",
        fields: [
            { id: "storeId", label: "Store ID", placeholder: "Your Maystro Store ID" },
            { id: "apiToken", label: "API Token", placeholder: "Your Maystro API Token" }
        ]
    },
    zr_delivery: {
        name: "ZR Delivery",
        description: "ZR Express Logistics (Procolis)",
        colors: "from-orange-50 to-amber-50 text-orange-600 border-orange-200",
        iconColors: "bg-orange-100 text-orange-600",
        fields: [
            { id: "apiToken", label: "Token", placeholder: "Your Procolis Token" },
            { id: "apiKey", label: "Key", placeholder: "Your Procolis API Key" }
        ]
    },
    anderson: {
        name: "Anderson",
        description: "Anderson Logistics",
        colors: "from-zinc-50 to-neutral-50 text-zinc-600 border-zinc-200",
        iconColors: "bg-zinc-200 text-zinc-700",
        fields: [
            { id: "apiToken", label: "Token", placeholder: "API Token" },
            { id: "apiKey", label: "Key", placeholder: "API Key" }
        ]
    },
    ecommanager: {
        name: "Ecommanager",
        description: "Ecommanager Integration",
        colors: "from-cyan-50 to-blue-50 text-cyan-600 border-cyan-200",
        iconColors: "bg-cyan-100 text-cyan-600",
        fields: [
            { id: "apiToken", label: "Token", placeholder: "API Token" },
            { id: "apiKey", label: "Key", placeholder: "API Key" }
        ]
    }
};

export const ShippingProviderEditor = ({ provider }: ShippingProviderEditorProps) => {
    const formConfig = useFormStore((state) => state.formConfig);
    const setFormConfig = useFormStore((state) => state.setFormConfig);

    // Ensure default structure
    const providersConfig = formConfig.addons?.shippingProviders || {
        yalidine: { isActive: false, apiId: "", apiToken: "" },
        maystro: { isActive: false, apiToken: "", storeId: "" },
        zr_delivery: { isActive: false, apiToken: "", apiKey: "" },
        anderson: { isActive: false, apiToken: "", apiKey: "" },
        ecommanager: { isActive: false, apiToken: "", apiKey: "" },
    };

    const config = providersConfig[provider] || { isActive: false };
    const meta = PROVIDER_METADATA[provider];

    const updateConfig = (key: string, value: string | boolean) => {
        setFormConfig({
            ...formConfig,
            addons: {
                ...formConfig.addons,
                shippingProviders: {
                    ...providersConfig,
                    [provider]: {
                        ...config,
                        [key]: value
                    }
                }
            }
        });
    };

    return (
        <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="bg-white border rounded-2xl overflow-hidden shadow-sm transition-all border-slate-200">
                <div className={`p-4 border-b border-slate-100 bg-gradient-to-r ${meta.colors.split(' ').slice(0, 2).join(' ')} flex items-center gap-3`}>
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-sm shrink-0 ${meta.iconColors}`}>
                        <Truck size={18} />
                    </div>
                    <div className="flex-1">
                        <h4 className="text-sm font-bold text-slate-900 leading-tight">{meta.name} API</h4>
                        <p className="text-[11px] text-slate-500 font-medium mt-0.5">
                            {meta.description}
                        </p>
                    </div>
                    <Switch
                        checked={config.isActive}
                        onCheckedChange={(c) => updateConfig('isActive', c)}
                    />
                </div>

                <div className="p-5 space-y-4 bg-slate-50/50">
                    {meta.fields.map(field => (
                        <div key={field.id} className="space-y-1.5">
                            <Label className="text-xs font-bold text-slate-700">{field.label}</Label>
                            <Input
                                placeholder={field.placeholder}
                                className="bg-white text-xs h-9"
                                value={(config as any)[field.id] || ""}
                                onChange={(e) => updateConfig(field.id, e.target.value)}
                            />
                        </div>
                    ))}

                    <div className="pt-2">
                        <div className="bg-blue-50 border border-blue-100 rounded-lg p-3 flex gap-3 text-blue-700">
                            <Shield size={16} className="shrink-0 mt-0.5" />
                            <div className="text-xs">
                                <p className="font-bold mb-1">Automated Dispatch</p>
                                <p className="text-blue-600/80 leading-relaxed">When active, confirmed orders will be automatically pushed to {meta.name} dispatch systems.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
