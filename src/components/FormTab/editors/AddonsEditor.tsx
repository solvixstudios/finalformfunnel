import { ChevronDown, ChevronRight, ExternalLink, FileSpreadsheet, MessageCircle, Phone, Zap } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import { auth } from "../../../lib/firebase";
import { useGoogleSheets } from "../../../lib/firebase/sheetsHooks";
import { useWhatsAppProfiles } from "../../../lib/firebase/whatsappHooks";
import { useFormStore } from "../../../stores";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DEFAULT_FORM_CONFIG } from "../../../config/defaults";

// Collapsible Section Component
const CollapsibleSection = ({
    title,
    icon: Icon,
    children,
    defaultOpen = false,
    badge
}: {
    title: string;
    icon: React.ElementType;
    children: React.ReactNode;
    defaultOpen?: boolean;
    badge?: string;
}) => {
    const [isOpen, setIsOpen] = useState(defaultOpen);

    return (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full px-4 py-3.5 flex items-center justify-between hover:bg-slate-50 transition-colors"
            >
                <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white shadow-sm">
                        <Icon size={14} />
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-700">{title}</span>
                        {badge && (
                            <span className="bg-indigo-50 text-indigo-600 text-[9px] font-black px-1.5 py-0.5 rounded tracking-wide uppercase">
                                {badge}
                            </span>
                        )}
                    </div>
                </div>
                {isOpen ? <ChevronDown size={16} className="text-slate-400" /> : <ChevronRight size={16} className="text-slate-400" />}
            </button>
            {isOpen && (
                <div className="px-4 pb-4 pt-2 space-y-4 border-t border-slate-100 animate-in slide-in-from-top-2 duration-200">
                    {children}
                </div>
            )}
        </div>
    );
};

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

    // Fallback for existing forms
    const effectiveColumns = (formConfig.addons?.sheetColumns && formConfig.addons.sheetColumns.length > 0)
        ? formConfig.addons.sheetColumns
        : DEFAULT_FORM_CONFIG.addons.sheetColumns;

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

    const updateColumns = (newColumns: typeof effectiveColumns) => {
        setFormConfig({
            ...formConfig,
            addons: { ...formConfig.addons, sheetColumns: newColumns }
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
                            {profiles.length === 0 ? (
                                <div className="text-center py-8 text-slate-500 bg-slate-50 rounded-lg border border-dashed text-sm">
                                    No WhatsApp profiles found.
                                    <br />
                                    Please add one in the main settings.
                                </div>
                            ) : (
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
                            )}
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
                                    sublabel={`${sheet.sheetName} • ${sheet.abandonedSheetName || "—"}`}
                                    icon={FileSpreadsheet}
                                    iconColor="text-emerald-600"
                                    bgColor="bg-emerald-100"
                                    checked={selectedSheetIds.includes(sheet.id)}
                                    onChange={(checked) => toggleSheet(sheet.id, checked)}
                                />
                            ))}
                            {selectedSheetIds.length > 0 && (
                                <Badge variant="secondary" className="text-[9px] bg-emerald-50 text-emerald-700 border border-emerald-100 mt-1">
                                    {selectedSheetIds.length} feuille{selectedSheetIds.length > 1 ? "s" : ""} sélectionnée{selectedSheetIds.length > 1 ? "s" : ""}
                                </Badge>
                            )}
                        </div>
                    )}

                    {/* Column Configuration */}
                    {selectedSheetIds.length > 0 && (
                        <div className="pt-4 border-t border-slate-100 space-y-3">
                            <label className="text-[10px] font-bold text-slate-500 uppercase flex justify-between items-center">
                                <span>Colonnes à exporter</span>
                                <span className="text-[9px] font-normal text-slate-400 bg-slate-50 px-1.5 py-0.5 rounded">
                                    Ordre respecté
                                </span>
                            </label>

                            <div className="space-y-1">
                                {effectiveColumns.map((col, index) => (
                                    <div key={col.id} className="flex items-center gap-2 p-2 rounded-md border border-slate-100 bg-slate-50/50 hover:bg-slate-100 transition-colors group">
                                        <input
                                            type="checkbox"
                                            checked={col.enabled}
                                            onChange={(e) => {
                                                const newCols = [...effectiveColumns];
                                                newCols[index] = { ...newCols[index], enabled: e.target.checked };
                                                updateColumns(newCols);
                                            }}
                                            className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 h-3.5 w-3.5"
                                        />
                                        <span className={`text-[11px] font-medium flex-1 ${col.enabled ? 'text-slate-700' : 'text-slate-400'}`}>
                                            {col.label}
                                        </span>

                                        <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button
                                                disabled={index === 0}
                                                onClick={() => {
                                                    const newCols = [...effectiveColumns];
                                                    [newCols[index - 1], newCols[index]] = [newCols[index], newCols[index - 1]];
                                                    updateColumns(newCols);
                                                }}
                                                className="p-1 hover:bg-white rounded disabled:opacity-30 disabled:hover:bg-transparent text-slate-400 hover:text-slate-600"
                                            >
                                                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m18 15-6-6-6 6" /></svg>
                                            </button>
                                            <button
                                                disabled={index === effectiveColumns.length - 1}
                                                onClick={() => {
                                                    const newCols = [...effectiveColumns];
                                                    [newCols[index + 1], newCols[index]] = [newCols[index], newCols[index + 1]];
                                                    updateColumns(newCols);
                                                }}
                                                className="p-1 hover:bg-white rounded disabled:opacity-30 disabled:hover:bg-transparent text-slate-400 hover:text-slate-600"
                                            >
                                                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6" /></svg>
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </CollapsibleSection>
        </div>
    );
};
