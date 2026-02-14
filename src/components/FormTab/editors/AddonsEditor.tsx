import { ExternalLink, FileSpreadsheet, MessageCircle, Phone, Zap } from "lucide-react";
import { Link } from "react-router-dom";
import { auth } from "../../../lib/firebase";
import { useGoogleSheets } from "../../../lib/firebase/sheetsHooks";
import { useWhatsAppProfiles } from "../../../lib/firebase/whatsappHooks";
import { useFormStore } from "../../../stores";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CollapsibleSection } from "../components/CollapsibleSection";

// Multi-select checkbox item
const CheckboxItem = ({
    id,
    label,
    sublabel,
    icon: Icon,
    checked,
    onChange,
    iconColor = "text-slate-600",
    bgColor = "bg-slate-100",
}: {
    id: string;
    label: string;
    sublabel?: string;
    icon: React.ElementType;
    checked: boolean;
    onChange: (checked: boolean) => void;
    iconColor?: string;
    bgColor?: string;
}) => (
    <label
        htmlFor={id}
        className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${checked
            ? "border-indigo-200 bg-indigo-50/50 ring-1 ring-indigo-100"
            : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/50"
            }`}
    >
        <input
            id={id}
            type="checkbox"
            checked={checked}
            onChange={(e) => onChange(e.target.checked)}
            className="sr-only"
        />
        <div className={`w-8 h-8 rounded-lg ${checked ? "bg-indigo-100" : bgColor} flex items-center justify-center shrink-0`}>
            <Icon size={14} className={checked ? "text-indigo-600" : iconColor} />
        </div>
        <div className="flex-1 min-w-0">
            <p className={`text-[11px] font-bold truncate ${checked ? "text-indigo-900" : "text-slate-800"}`}>
                {label}
            </p>
            {sublabel && (
                <p className="text-[10px] text-slate-500 font-mono truncate mt-0.5">
                    {sublabel}
                </p>
            )}
        </div>
        <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-all ${checked
            ? "border-indigo-500 bg-indigo-500"
            : "border-slate-300 bg-white"
            }`}>
            {checked && (
                <svg width="10" height="8" viewBox="0 0 10 8" fill="none" className="text-white">
                    <path d="M1 4L3.5 6.5L9 1" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
            )}
        </div>
    </label>
);

export const AddonsEditor = () => {
    const formConfig = useFormStore((state) => state.formConfig);
    const setFormConfig = useFormStore((state) => state.setFormConfig);
    const userId = auth.currentUser?.uid || "";

    // WhatsApp
    const { profiles, loading: waLoading } = useWhatsAppProfiles(userId);
    const selectedProfileId: string | null = formConfig.addons?.selectedWhatsappProfileId || null;

    // Google Sheets
    const { sheets, loading: sheetsLoading } = useGoogleSheets(userId);
    const selectedSheetIds: string[] = formConfig.addons?.selectedSheetIds || [];

    const selectProfile = (profileId: string) => {
        const newId = selectedProfileId === profileId ? null : profileId;
        setFormConfig({
            ...formConfig,
            addons: {
                ...formConfig.addons,
                selectedWhatsappProfileId: newId,
            },
        });
    };

    const toggleSheet = (sheetId: string, checked: boolean) => {
        const current = [...selectedSheetIds];
        const updated = checked
            ? [...current, sheetId]
            : current.filter((id) => id !== sheetId);

        setFormConfig({
            ...formConfig,
            addons: {
                ...formConfig.addons,
                selectedSheetIds: updated,
                enableSheets: updated.length > 0,
            },
        });
    };

    return (
        <div className="space-y-4">
            <h3 className="text-[10px] font-black uppercase text-slate-400 tracking-widest flex items-center gap-2 px-1">
                <Zap size={14} /> Integrations & Addons
            </h3>

            {/* WhatsApp Integration */}
            <CollapsibleSection title="WhatsApp Integration" icon={MessageCircle} defaultOpen={true}>
                <div className="space-y-3">
                    <div className="flex justify-between items-center">
                        <label className="text-[10px] font-bold text-slate-500 uppercase">
                            Profils WhatsApp
                        </label>
                        <Link to="/dashboard/integrations?open=whatsapp">
                            <span className="text-[10px] text-indigo-600 hover:underline flex items-center gap-1 cursor-pointer">
                                Gérer <ExternalLink size={10} />
                            </span>
                        </Link>
                    </div>

                    {waLoading ? (
                        <div className="h-10 bg-slate-50 rounded-lg animate-pulse" />
                    ) : profiles.length === 0 ? (
                        <div className="bg-amber-50 border border-amber-100 rounded-lg p-3 text-center">
                            <p className="text-[10px] text-amber-700 font-bold mb-2">
                                Aucun profil WhatsApp détecté
                            </p>
                            <Link to="/dashboard/integrations?open=whatsapp&profileId=new">
                                <Button size="sm" variant="outline" className="h-7 text-[10px] bg-white text-amber-700 border-amber-200">
                                    Ajouter un profil
                                </Button>
                            </Link>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            <div className="grid grid-cols-1 gap-2">
                                {profiles.map((profile) => (
                                    <CheckboxItem
                                        key={profile.id}
                                        id={`wa-${profile.id}`}
                                        checked={selectedProfileId === profile.id}
                                        onChange={() => selectProfile(profile.id)}
                                        label={profile.name}
                                        sublabel={profile.phoneNumber}
                                        icon={Phone}
                                        iconColor="text-green-600"
                                    />
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </CollapsibleSection>

            {/* Google Sheets Integration */}
            <CollapsibleSection title="Google Sheets" icon={FileSpreadsheet} badge="NEW">
                <div className="space-y-3">
                    <div className="flex justify-between items-center">
                        <label className="text-[10px] font-bold text-slate-500 uppercase">
                            Feuilles Connectées
                        </label>
                        <Link to="/dashboard/integrations?open=google-sheets">
                            <span className="text-[10px] text-indigo-600 hover:underline flex items-center gap-1 cursor-pointer">
                                Gérer <ExternalLink size={10} />
                            </span>
                        </Link>
                    </div>

                    {sheetsLoading ? (
                        <div className="h-10 bg-slate-50 rounded-lg animate-pulse" />
                    ) : sheets.length === 0 ? (
                        <div className="bg-amber-50 border border-amber-100 rounded-lg p-3 text-center">
                            <p className="text-[10px] text-amber-700 font-bold mb-2">
                                Aucune feuille connectée
                            </p>
                            <Link to="/dashboard/integrations?open=google-sheets&sheetId=new">
                                <Button size="sm" variant="outline" className="h-7 text-[10px] bg-white text-amber-700 border-amber-200">
                                    Connecter une feuille
                                </Button>
                            </Link>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            <p className="text-[10px] text-slate-400">
                                Les commandes seront envoyées à toutes les feuilles sélectionnées
                            </p>
                            {sheets.map((sheet) => (
                                <CheckboxItem
                                    key={sheet.id}
                                    id={`sheet-${sheet.id}`}
                                    label={sheet.name}
                                    sublabel={sheet.sheetName}
                                    icon={FileSpreadsheet}
                                    iconColor="text-emerald-600"
                                    bgColor="bg-emerald-100"
                                    checked={selectedSheetIds.includes(sheet.id)}
                                    onChange={(checked) => toggleSheet(sheet.id, checked)}
                                />
                            ))}
                            {selectedSheetIds.length > 0 && (
                                <Badge variant="secondary" className="text-[9px] bg-emerald-50 text-emerald-700 border border-emerald-100 mt-1">
                                    {sheets.filter(s => selectedSheetIds.includes(s.id)).length} feuille{sheets.filter(s => selectedSheetIds.includes(s.id)).length !== 1 ? "s" : ""} sélectionnée{sheets.filter(s => selectedSheetIds.includes(s.id)).length !== 1 ? "s" : ""}
                                </Badge>
                            )}
                        </div>
                    )}
                </div>
            </CollapsibleSection>
        </div>
    );
};
