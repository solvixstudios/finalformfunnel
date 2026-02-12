import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { ExternalLink, FileSpreadsheet, MessageCircle, Phone, Sparkles, Trash2 } from "lucide-react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { auth } from "../../../lib/firebase";
import { useGoogleSheets } from "../../../lib/firebase/sheetsHooks";
import { useWhatsAppProfiles } from "../../../lib/firebase/whatsappHooks";
import { useFormStore } from "../../../stores";

export const AddonsEditor = () => {
    const formConfig = useFormStore((state) => state.formConfig);
    const setFormConfig = useFormStore((state) => state.setFormConfig);
    const userId = auth.currentUser?.uid || "";

    // WhatsApp
    const { profiles, loading: waLoading } = useWhatsAppProfiles(userId);
    const selectedProfile = profiles.find(
        (p) => p.id === formConfig.thankYou?.selectedWhatsappProfileId
    );
    const defaultProfile = profiles.find((p) => p.isDefault);

    // Google Sheets
    const { sheets, loading: sheetsLoading, deleteSheet } = useGoogleSheets(userId);

    const selectedSheet = sheets.find(
        (s) => s.id === formConfig.addons?.selectedSheetId
    );
    const defaultSheet = sheets.find((s) => s.isDefault);

    const handleProfileChange = (profileId: string) => {
        setFormConfig({
            ...formConfig,
            thankYou: {
                ...formConfig.thankYou,
                selectedWhatsappProfileId: profileId === "default" ? "" : profileId,
            },
        });
    };

    const handleSheetChange = (sheetId: string) => {
        setFormConfig({
            ...formConfig,
            addons: {
                ...formConfig.addons,
                selectedSheetId: sheetId === "default" ? "" : sheetId,
                enableSheets: true,
            },
        });
    };

    const handleDeleteSheet = async (id: string) => {
        try {
            await deleteSheet(id);
            toast.success("Sheet removed");
            // Clear selection if deleted
            if (formConfig.addons?.selectedSheetId === id) {
                setFormConfig({
                    ...formConfig,
                    addons: { ...formConfig.addons, selectedSheetId: "" },
                });
            }
        } catch (e: any) {
            toast.error(e.message);
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="bg-gradient-to-br from-pink-50 via-rose-50 to-orange-50 border border-pink-100 rounded-2xl p-5">
                <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-pink-500 to-rose-600 flex items-center justify-center text-white shadow-lg shadow-pink-200/50">
                        <Sparkles size={22} />
                    </div>
                    <div>
                        <h3 className="text-base font-bold text-slate-800">Form Addons</h3>
                        <p className="text-xs text-slate-500">
                            Configure integrations and extensions for this form
                        </p>
                    </div>
                </div>
            </div>

            {/* WhatsApp Profile Selection */}
            <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center text-white shadow-md shadow-green-200/50">
                            <MessageCircle size={18} />
                        </div>
                        <div>
                            <h4 className="text-sm font-bold text-slate-800">WhatsApp Profile</h4>
                            <p className="text-[11px] text-slate-400">
                                Select which WhatsApp number receives orders
                            </p>
                        </div>
                    </div>
                    <Link to="/dashboard/integrations">
                        <Button variant="ghost" size="sm" className="h-8 text-xs gap-1.5 text-slate-500 hover:text-slate-700">
                            Manage <ExternalLink size={12} />
                        </Button>
                    </Link>
                </div>

                {waLoading ? (
                    <div className="flex items-center justify-center py-6">
                        <div className="w-5 h-5 border-2 border-green-500/30 border-t-green-500 rounded-full animate-spin" />
                    </div>
                ) : profiles.length === 0 ? (
                    <div className="bg-amber-50 border border-amber-100 rounded-lg p-4 text-center">
                        <p className="text-xs text-amber-700 font-medium">
                            No WhatsApp profiles configured yet.
                        </p>
                        <Link to="/dashboard/integrations">
                            <Button variant="outline" size="sm" className="mt-3 h-8 text-xs border-amber-200 text-amber-700 hover:bg-amber-100">
                                Set up WhatsApp <ExternalLink size={12} className="ml-1.5" />
                            </Button>
                        </Link>
                    </div>
                ) : (
                    <div className="space-y-3">
                        <Select
                            value={formConfig.thankYou?.selectedWhatsappProfileId || "default"}
                            onValueChange={handleProfileChange}
                        >
                            <SelectTrigger className="w-full h-10 text-sm">
                                <SelectValue placeholder="Select a profile" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="default">
                                    Use Default {defaultProfile && `(${defaultProfile.name})`}
                                </SelectItem>
                                {profiles.map((profile) => (
                                    <SelectItem key={profile.id} value={profile.id}>
                                        {profile.name} {profile.isDefault && "(Default)"}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                        {(selectedProfile || (!formConfig.thankYou?.selectedWhatsappProfileId && defaultProfile)) && (
                            <div className="bg-slate-50 border border-slate-100 rounded-lg p-3 flex items-center gap-3">
                                <div className="w-9 h-9 rounded-lg bg-green-100 flex items-center justify-center">
                                    <Phone size={16} className="text-green-600" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-xs font-semibold text-slate-800 truncate">
                                        {(selectedProfile || defaultProfile)?.name}
                                    </p>
                                    <p className="text-[11px] text-slate-500 font-mono" dir="ltr">
                                        {(selectedProfile || defaultProfile)?.phoneNumber}
                                    </p>
                                </div>
                                <Badge variant="outline" className="text-[9px] h-5 bg-green-50 text-green-700 border-green-200">
                                    Active
                                </Badge>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Google Sheets Section */}
            <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-white shadow-md shadow-emerald-200/50">
                            <FileSpreadsheet size={18} />
                        </div>
                        <div>
                            <h4 className="text-sm font-bold text-slate-800">Google Sheets</h4>
                            <p className="text-[11px] text-slate-400">
                                Export orders directly to a spreadsheet
                            </p>
                        </div>
                    </div>
                    <Link to="/dashboard/integrations">
                        <Button variant="ghost" size="sm" className="h-8 text-xs gap-1.5 text-slate-500 hover:text-slate-700">
                            Manage <ExternalLink size={12} />
                        </Button>
                    </Link>
                </div>

                {sheetsLoading ? (
                    <div className="flex items-center justify-center py-6">
                        <div className="w-5 h-5 border-2 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin" />
                    </div>
                ) : sheets.length === 0 ? (
                    <div className="bg-amber-50 border border-amber-100 rounded-lg p-4 text-center">
                        <p className="text-xs text-amber-700 font-medium">
                            No Google Sheets configured yet.
                        </p>
                        <Link to="/dashboard/integrations">
                            <Button variant="outline" size="sm" className="mt-3 h-8 text-xs border-amber-200 text-amber-700 hover:bg-amber-100">
                                Set up Google Sheets <ExternalLink size={12} className="ml-1.5" />
                            </Button>
                        </Link>
                    </div>
                ) : sheets.length > 0 && (
                    <div className="space-y-3">
                        <Select
                            value={formConfig.addons?.selectedSheetId || "default"}
                            onValueChange={handleSheetChange}
                        >
                            <SelectTrigger className="w-full h-10 text-sm">
                                <SelectValue placeholder="Select a sheet" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="default">
                                    Use Default {defaultSheet && `(${defaultSheet.name})`}
                                </SelectItem>
                                {sheets.map((sheet) => (
                                    <SelectItem key={sheet.id} value={sheet.id}>
                                        {sheet.name} {sheet.isDefault && "(Default)"}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                        {/* Sheet Preview */}
                        {(selectedSheet || (!formConfig.addons?.selectedSheetId && defaultSheet)) && (
                            <div className="bg-slate-50 border border-slate-100 rounded-lg p-3 flex items-center gap-3">
                                <div className="w-9 h-9 rounded-lg bg-emerald-100 flex items-center justify-center">
                                    <FileSpreadsheet size={16} className="text-emerald-600" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-xs font-semibold text-slate-800 truncate">
                                        {(selectedSheet || defaultSheet)?.name}
                                    </p>
                                    <p className="text-[11px] text-slate-500 font-mono truncate">
                                        {(selectedSheet || defaultSheet)?.sheetName}
                                    </p>
                                </div>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-7 w-7 p-0 text-red-400 hover:text-red-600 hover:bg-red-50"
                                    onClick={() => handleDeleteSheet((selectedSheet || defaultSheet)!.id)}
                                >
                                    <Trash2 size={14} />
                                </Button>
                            </div>
                        )}

                        <p className="text-[10px] text-slate-400">
                            💡 Orders will be automatically appended to this sheet when submitted.
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};
