import { FileSpreadsheet, Check, Plus, Unlink, ChevronRight } from "lucide-react";
import { useSearchParams } from "react-router-dom";
import { auth } from "../../../lib/firebase";
import { useGoogleSheets } from "../../../lib/firebase/sheetsHooks";
import { useFormStore } from "../../../stores";
import { GoogleSheetsIntegration } from "../../integrations/GoogleSheetsIntegration";
import { Button } from "@/components/ui/button";


export const GoogleSheetsEditor = () => {
    const formConfig = useFormStore((state) => state.formConfig);
    const setFormConfig = useFormStore((state) => state.setFormConfig);
    const userId = auth.currentUser?.uid || "";

    const { sheets, loading: sheetsLoading } = useGoogleSheets(userId);
    const selectedSheetIds: string[] = formConfig.addons?.selectedSheetIds || [];
    const [, setSearchParams] = useSearchParams();

    const openIntegration = () => {
        setSearchParams(prev => {
            const next = new URLSearchParams(prev);
            next.set('open', 'google-sheets');
            next.set('sheetId', 'new');
            return next;
        });
    };

    const linkSheet = (sheetId: string) => {
        const updated = [...selectedSheetIds, sheetId];
        setFormConfig({
            ...formConfig,
            addons: { ...formConfig.addons, selectedSheetIds: updated, enableSheets: true },
        });
    };

    const unlinkSheet = (sheetId: string) => {
        const updated = selectedSheetIds.filter(id => id !== sheetId);
        setFormConfig({
            ...formConfig,
            addons: { ...formConfig.addons, selectedSheetIds: updated, enableSheets: updated.length > 0 },
        });
    };

    const linkedSheets = sheets.filter(s => selectedSheetIds.includes(s.id));
    const unlinkedSheets = sheets.filter(s => !selectedSheetIds.includes(s.id));

    return (
        <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
            <h3 className="text-[10px] font-black uppercase text-slate-400 tracking-[0.15em] flex items-center gap-2 px-1">
                <FileSpreadsheet size={14} className="text-emerald-500" /> Google Sheets
            </h3>

            <div className="bg-white border border-slate-200 shadow-sm rounded-2xl overflow-hidden">
                <div className="p-4 border-b border-slate-100 bg-gradient-to-r from-slate-50/80 to-white flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-50 to-emerald-100 border border-emerald-200/60 flex items-center justify-center shadow-sm shrink-0">
                        <FileSpreadsheet size={18} className="text-emerald-600" />
                    </div>
                    <div className="flex-1">
                        <h4 className="text-sm font-bold text-slate-900 leading-tight">Connected Sheets</h4>
                        <p className="text-[11px] text-slate-500 font-medium mt-0.5">
                            {linkedSheets.length > 0
                                ? `${linkedSheets.length} sheet${linkedSheets.length !== 1 ? 's' : ''} linked`
                                : 'Link sheets to receive orders'}
                        </p>
                    </div>
                    {linkedSheets.length > 0 && (
                        <div className="w-6 h-6 rounded-full bg-emerald-100 flex items-center justify-center">
                            <Check size={12} className="text-emerald-600" />
                        </div>
                    )}
                </div>

                <div className="p-3">
                    {sheetsLoading ? (
                        <div className="space-y-2">
                            <div className="h-14 bg-slate-50 rounded-xl animate-pulse" />
                        </div>
                    ) : sheets.length === 0 ? (
                        <div className="bg-gradient-to-br from-slate-50 to-white border border-dashed border-slate-200 rounded-xl p-6 text-center flex flex-col items-center">
                            <div className="w-14 h-14 rounded-2xl bg-white shadow-sm border border-slate-100 flex items-center justify-center mb-3">
                                <FileSpreadsheet size={22} className="text-slate-300" />
                            </div>
                            <p className="text-xs font-bold text-slate-700 mb-1">No sheets connected</p>
                            <p className="text-[10px] text-slate-400 mb-4 leading-relaxed">
                                Connect a Google Sheet to log orders automatically.
                            </p>
                            <Button
                                onClick={openIntegration}
                                className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-md h-9 rounded-xl px-5 text-xs font-bold transition-all active:scale-95"
                            >
                                <Plus size={14} className="mr-1.5" />
                                Connect Sheet
                            </Button>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {/* Linked sheets */}
                            {linkedSheets.map(sheet => (
                                <div key={sheet.id} className="flex items-center gap-3 p-3 rounded-xl border border-emerald-200/80 bg-gradient-to-r from-emerald-50/60 to-white transition-all duration-300">
                                    <div className="w-9 h-9 rounded-lg bg-emerald-100 border border-emerald-200 flex items-center justify-center shrink-0">
                                        <Check size={16} className="text-emerald-600" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-xs font-bold text-slate-900 truncate">{sheet.name}</p>
                                        <p className="text-[9px] text-slate-400 truncate mt-0.5">{sheet.sheetName}</p>
                                    </div>
                                    <button
                                        className="flex items-center gap-1 h-7 px-2.5 text-[10px] font-bold text-red-500 hover:text-white hover:bg-red-500 border border-red-200 hover:border-red-500 rounded-lg transition-all duration-200 shrink-0"
                                        onClick={() => unlinkSheet(sheet.id)}
                                    >
                                        <Unlink size={10} /> Unlink
                                    </button>
                                </div>
                            ))}

                            {/* Unlinked sheets */}
                            {unlinkedSheets.map(sheet => (
                                <button
                                    key={sheet.id}
                                    onClick={() => linkSheet(sheet.id)}
                                    className={`w-full flex items-center gap-3 p-2.5 rounded-xl border ${linkedSheets.length > 0 ? 'border-dashed border-slate-200 bg-slate-50/30' : 'border-slate-200 bg-white'
                                        } hover:border-emerald-300 hover:bg-emerald-50/40 hover:shadow-sm transition-all duration-200 group cursor-pointer text-left`}
                                >
                                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-colors ${linkedSheets.length > 0
                                        ? 'bg-white text-emerald-400 border border-slate-200 group-hover:border-emerald-200 group-hover:bg-emerald-50'
                                        : 'bg-emerald-50 text-emerald-600 border border-emerald-100'
                                        }`}>
                                        {linkedSheets.length > 0 ? <Plus size={14} /> : <FileSpreadsheet size={14} />}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-xs font-bold text-slate-800 group-hover:text-emerald-700 truncate transition-colors">{sheet.name}</p>
                                        <p className="text-[9px] text-slate-400 truncate">{sheet.sheetName}</p>
                                    </div>
                                    <span className="flex items-center gap-0.5 text-[10px] font-bold text-slate-400 group-hover:text-emerald-600 transition-colors shrink-0">
                                        Link <ChevronRight size={12} />
                                    </span>
                                </button>
                            ))}

                            <div className="pt-1 border-t border-slate-100 mt-1">
                                <button onClick={openIntegration} className="w-full flex items-center justify-center gap-1.5 p-2 rounded-lg text-[10px] font-bold text-slate-400 hover:text-emerald-600 transition-colors cursor-pointer">
                                    <Plus size={10} /> Connect New Sheet
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <GoogleSheetsIntegration userId={userId} hideTrigger={true} />
        </div>
    );
};
