import { ExternalLink, FileSpreadsheet, MessageCircle, Phone, Zap } from "lucide-react";
import { Link } from "react-router-dom";
import { auth } from "../../../lib/firebase";
import { useGoogleSheets } from "../../../lib/firebase/sheetsHooks";
import { useWhatsAppProfiles } from "../../../lib/firebase/whatsappHooks";
import { useMetaPixels } from "../../../lib/firebase/metaPixelHooks";
import { useTikTokPixels } from "../../../lib/firebase/tiktokHooks";
import { useFormStore } from "../../../stores";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";


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

    // Meta Pixel
    const { pixels, loading: pixelsLoading } = useMetaPixels(userId);
    const selectedPixelIds: string[] = formConfig.addons?.metaPixelIds || [];

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

    const togglePixel = (pixelId: string, checked: boolean) => {
        const current = [...selectedPixelIds];
        const updatedIds = checked
            ? [...current, pixelId]
            : current.filter((id) => id !== pixelId);

        // Derive pixelData
        const currentData = formConfig.addons?.pixelData || [];
        let updatedData = [...currentData];

        if (checked) {
            const profile = pixels.find(p => p.id === pixelId);
            if (profile) {
                // Remove if exists to avoid dupes, then push all pixels from profile
                updatedData = updatedData.filter(p => !profile.pixels?.some(pp => pp.pixelId === p.pixelId));

                // Add all pixels from this profile
                // We need to store profile ID reference if we want to remove by profile later?
                // Actually, logic is: add all pixels from this profile to pixelData.
                // But wait, pixelData in config is flat.
                // If we uncheck, we need to remove pixels associated with this profile.
                // Store structure: pixelData: { id: profileId, pixelId: string, ... } ?
                // The prompt says "Flatten selected profiles' pixels array into formConfig.addons.pixelData".

                // Let's store profileId in the pixelData entries to track source.
                const profilePixels = (profile.pixels || []).map(p => ({
                    id: profile.id, // Profile ID for removal/tracking
                    pixelId: p.pixelId,
                    capiToken: p.capiToken,
                    testCode: p.testCode,
                    name: profile.name
                }));

                // If legacy profile has no pixels array but has pixelId (handled in types but just in case)
                if (profilePixels.length === 0 && (profile as any).pixelId) {
                    profilePixels.push({
                        id: profile.id,
                        pixelId: (profile as any).pixelId,
                        capiToken: (profile as any).capiToken,
                        testCode: (profile as any).testCode,
                        name: profile.name
                    });
                }

                updatedData.push(...profilePixels);
            }
        } else {
            // Unchecked: remove all pixels belonging to this profile ID
            updatedData = updatedData.filter(p => p.id !== pixelId);
        }

        setFormConfig({
            ...formConfig,
            addons: {
                ...formConfig.addons,
                metaPixelIds: updatedIds,
                pixelData: updatedData
            },
        });
    };

    // TikTok Pixel
    const { pixels: tiktokPixels, loading: tiktokLoading } = useTikTokPixels(userId);
    const selectedTikTokIds: string[] = formConfig.addons?.tiktokPixelIds || [];

    const toggleTikTok = (pixelId: string, checked: boolean) => {
        const current = [...selectedTikTokIds];
        const updatedIds = checked
            ? [...current, pixelId]
            : current.filter((id) => id !== pixelId);

        // Derive tiktokPixelData
        const currentData = formConfig.addons?.tiktokPixelData || [];
        let updatedData = [...currentData];

        if (checked) {
            const profile = tiktokPixels.find(p => p.id === pixelId);
            if (profile) {
                // Remove if exists to avoid dupes
                updatedData = updatedData.filter(p => !profile.pixels?.some(pp => pp.pixelId === p.pixelId));

                const profilePixels = (profile.pixels || []).map(p => ({
                    id: profile.id,
                    pixelId: p.pixelId,
                    accessToken: p.accessToken,
                    testCode: p.testCode,
                    name: profile.name
                }));

                // Fallback for legacy structure (no pixels array)
                if (profilePixels.length === 0 && (profile as any).pixelId) {
                    profilePixels.push({
                        id: profile.id,
                        pixelId: (profile as any).pixelId,
                        accessToken: (profile as any).accessToken,
                        testCode: (profile as any).testCode,
                        name: profile.name
                    });
                }

                updatedData.push(...profilePixels);
            }
        } else {
            // Unchecked: remove all pixels belonging to this profile ID
            updatedData = updatedData.filter(p => p.id !== pixelId);
        }

        setFormConfig({
            ...formConfig,
            addons: {
                ...formConfig.addons,
                tiktokPixelIds: updatedIds,
                tiktokPixelData: updatedData
            },
        });
    };

    return (
        <div className="space-y-4">
            <h3 className="text-[10px] font-black uppercase text-slate-400 tracking-widest flex items-center gap-2 px-1">
                <Zap size={14} /> Integrations & Addons
            </h3>

            {/* WhatsApp Integration */}
            <div className="bg-white border border-slate-200 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-3">
                    <MessageCircle className="text-slate-400" size={16} />
                    <span className="text-xs font-bold text-slate-700">WhatsApp Integration</span>
                </div>
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

                    {/* Enable WhatsApp on Thank You Page */}
                    {selectedProfileId && (
                        <div className="flex items-center justify-between p-3 bg-green-50/50 border border-green-100 rounded-lg mt-1">
                            <div className="space-y-0.5">
                                <Label className="text-[10px] font-bold text-green-800 uppercase">Bouton WhatsApp</Label>
                                <p className="text-[9px] text-green-600">Afficher sur la page de confirmation</p>
                            </div>
                            <Switch
                                checked={formConfig.thankYou?.enableWhatsApp || false}
                                onCheckedChange={(checked) =>
                                    setFormConfig({
                                        ...formConfig,
                                        thankYou: {
                                            ...formConfig.thankYou,
                                            enableWhatsApp: checked,
                                        },
                                    })
                                }
                            />
                        </div>
                    )}
                </div>
            </div>

            {/* Google Sheets Integration */}
            <div className="bg-white border border-slate-200 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-3">
                    <FileSpreadsheet className="text-slate-400" size={16} />
                    <span className="text-xs font-bold text-slate-700 flex items-center gap-2">Google Sheets <Badge variant="secondary" className="text-[9px] bg-slate-100 text-slate-600">NEW</Badge></span>
                </div>
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
            </div>

            {/* Meta Pixel Integration */}
            <div className="bg-white border border-slate-200 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-3">
                    <Zap className="text-slate-400" size={16} />
                    <span className="text-xs font-bold text-slate-700 flex items-center gap-2">Meta Pixel <Badge variant="secondary" className="text-[9px] bg-slate-100 text-slate-600">NEW</Badge></span>
                </div>
                <div className="space-y-3">
                    <div className="flex justify-between items-center">
                        <label className="text-[10px] font-bold text-slate-500 uppercase">
                            Pixels de suivi
                        </label>
                        <Link to="/dashboard/integrations?open=meta-pixel">
                            <span className="text-[10px] text-indigo-600 hover:underline flex items-center gap-1 cursor-pointer">
                                Gérer <ExternalLink size={10} />
                            </span>
                        </Link>
                    </div>

                    {pixelsLoading ? (
                        <div className="h-10 bg-slate-50 rounded-lg animate-pulse" />
                    ) : pixels.length === 0 ? (
                        <div className="bg-blue-50 border border-blue-100 rounded-lg p-3 text-center">
                            <p className="text-[10px] text-blue-700 font-bold mb-2">
                                Aucun Pixel trouvé
                            </p>
                            <Link to="/dashboard/integrations?open=meta-pixel&pixelId=new">
                                <Button size="sm" variant="outline" className="h-7 text-[10px] bg-white text-blue-700 border-blue-200">
                                    Ajouter un Pixel
                                </Button>
                            </Link>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            <p className="text-[10px] text-slate-400">
                                Sélectionnez les pixels à utiliser sur ce formulaire
                            </p>
                            {pixels.map((pixel) => (
                                <CheckboxItem
                                    key={pixel.id}
                                    id={`pixel-${pixel.id}`}
                                    label={pixel.name}
                                    sublabel={
                                        (pixel.pixels && pixel.pixels.length > 0)
                                            ? `${pixel.pixels.length} Pixel${pixel.pixels.length !== 1 ? 's' : ''}`
                                            : `ID: ${(pixel as unknown).pixelId || 'N/A'}`
                                    }
                                    icon={Zap}
                                    iconColor="text-blue-600"
                                    bgColor="bg-blue-100"
                                    checked={selectedPixelIds.includes(pixel.id)}
                                    onChange={(checked) => togglePixel(pixel.id, checked)}
                                />
                            ))}
                            {selectedPixelIds.length > 0 && (
                                <Badge variant="secondary" className="text-[9px] bg-blue-50 text-blue-700 border border-blue-100 mt-1">
                                    {pixels.filter(p => selectedPixelIds.includes(p.id)).length} pixel{pixels.filter(p => selectedPixelIds.includes(p.id)).length !== 1 ? "s" : ""} actif{pixels.filter(p => selectedPixelIds.includes(p.id)).length !== 1 ? "s" : ""}
                                </Badge>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* TikTok Pixel Integration */}
            <div className="bg-white border border-slate-200 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-3">
                    <MessageCircle className="text-slate-400" size={16} />
                    <span className="text-xs font-bold text-slate-700 flex items-center gap-2">TikTok Pixel <Badge variant="secondary" className="text-[9px] bg-slate-100 text-slate-600">NEW</Badge></span>
                </div>
                <div className="space-y-3">
                    <div className="flex justify-between items-center">
                        <label className="text-[10px] font-bold text-slate-500 uppercase">
                            TikTok Pixels
                        </label>
                        <Link to="/dashboard/integrations?open=tiktok-pixel">
                            <span className="text-[10px] text-indigo-600 hover:underline flex items-center gap-1 cursor-pointer">
                                Gérer <ExternalLink size={10} />
                            </span>
                        </Link>
                    </div>

                    {tiktokLoading ? (
                        <div className="h-10 bg-slate-50 rounded-lg animate-pulse" />
                    ) : tiktokPixels.length === 0 ? (
                        <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-center">
                            <p className="text-[10px] text-slate-700 font-bold mb-2">
                                Aucun Pixel TikTok trouvé
                            </p>
                            <Link to="/dashboard/integrations?open=tiktok-pixel&profileId=new">
                                <Button size="sm" variant="outline" className="h-7 text-[10px] bg-white text-slate-700 border-slate-200">
                                    Ajouter un Pixel
                                </Button>
                            </Link>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            <p className="text-[10px] text-slate-400">
                                Sélectionnez les pixels TikTok pour ce formulaire
                            </p>
                            {tiktokPixels.map((pixel) => (
                                <CheckboxItem
                                    key={pixel.id}
                                    id={`tiktok-${pixel.id}`}
                                    label={pixel.name}
                                    sublabel={
                                        (pixel.pixels && pixel.pixels.length > 0)
                                            ? `${pixel.pixels.length} Pixel${pixel.pixels.length !== 1 ? 's' : ''}`
                                            : 'N/A'
                                    }
                                    icon={MessageCircle} // Using MessageCircle as placeholder icon, ideally Music note
                                    iconColor="text-slate-900"
                                    bgColor="bg-slate-100"
                                    checked={selectedTikTokIds.includes(pixel.id)}
                                    onChange={(checked) => toggleTikTok(pixel.id, checked)}
                                />
                            ))}
                            {selectedTikTokIds.length > 0 && (
                                <Badge variant="secondary" className="text-[9px] bg-slate-100 text-slate-900 border border-slate-200 mt-1">
                                    {tiktokPixels.filter(p => selectedTikTokIds.includes(p.id)).length} pixel{tiktokPixels.filter(p => selectedTikTokIds.includes(p.id)).length !== 1 ? "s" : ""} actif{tiktokPixels.filter(p => selectedTikTokIds.includes(p.id)).length !== 1 ? "s" : ""}
                                </Badge>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
