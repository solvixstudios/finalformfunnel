import { Zap, Check, Plus, Unlink, ChevronRight } from "lucide-react";
import { useSearchParams } from "react-router-dom";
import { auth } from "../../../lib/firebase";
import { useMetaPixels } from "../../../lib/firebase/metaPixelHooks";
import { useFormStore } from "../../../stores";
import { MetaPixelIntegration } from "../../integrations/MetaPixelIntegration";
import { Button } from "@/components/ui/button";


export const MetaPixelEditor = () => {
    const formConfig = useFormStore((state) => state.formConfig);
    const setFormConfig = useFormStore((state) => state.setFormConfig);
    const userId = auth.currentUser?.uid || "";

    const { pixels, loading: pixelsLoading } = useMetaPixels(userId);
    const selectedPixelIds: string[] = formConfig.addons?.metaPixelIds || [];
    const [, setSearchParams] = useSearchParams();

    const openIntegration = () => {
        setSearchParams(prev => {
            const next = new URLSearchParams(prev);
            next.set('open', 'meta-pixel');
            next.set('profileId', 'new');
            return next;
        });
    };

    const linkPixel = (pixelId: string) => {
        const updatedIds = [...selectedPixelIds, pixelId];
        const currentData: any[] = formConfig.addons?.pixelData || [];
        let updatedData: any[] = [...currentData];

        const profile = pixels.find(p => p.id === pixelId);
        if (profile) {
            updatedData = updatedData.filter((p: any) => !profile.pixels?.some((pp: any) => pp.pixelId === p.pixelId));
            const profilePixels = (profile.pixels || []).map((p: any) => ({
                id: profile.id, pixelId: p.pixelId, capiToken: p.capiToken, testCode: p.testCode, name: profile.name
            }));
            if (profilePixels.length === 0 && (profile as any).pixelId) {
                profilePixels.push({
                    id: profile.id, pixelId: (profile as any).pixelId, capiToken: (profile as any).capiToken,
                    testCode: (profile as any).testCode, name: profile.name
                });
            }
            updatedData.push(...profilePixels);
        }

        setFormConfig({
            ...formConfig,
            addons: { ...formConfig.addons, metaPixelIds: updatedIds, pixelData: updatedData },
        });
    };

    const unlinkPixel = (pixelId: string) => {
        const updatedIds = selectedPixelIds.filter(id => id !== pixelId);
        const updatedData = (formConfig.addons?.pixelData || []).filter((p: any) => p.id !== pixelId);

        setFormConfig({
            ...formConfig,
            addons: { ...formConfig.addons, metaPixelIds: updatedIds, pixelData: updatedData },
        });
    };

    const linkedPixels = pixels.filter(p => selectedPixelIds.includes(p.id));
    const unlinkedPixels = pixels.filter(p => !selectedPixelIds.includes(p.id));

    return (
        <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
            <h3 className="text-[10px] font-black uppercase text-slate-400 tracking-[0.15em] flex items-center gap-2 px-1">
                <Zap size={14} className="text-blue-500" /> Meta Pixel
            </h3>

            <div className="bg-white border border-slate-200 shadow-sm rounded-2xl overflow-hidden">
                <div className="p-4 border-b border-slate-100 bg-gradient-to-r from-slate-50/80 to-white flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200/60 flex items-center justify-center shadow-sm shrink-0">
                        <Zap size={18} className="text-blue-600" />
                    </div>
                    <div className="flex-1">
                        <h4 className="text-sm font-bold text-slate-900 leading-tight">Pixel Profiles</h4>
                        <p className="text-[11px] text-slate-500 font-medium mt-0.5">
                            {linkedPixels.length > 0
                                ? `${linkedPixels.length} pixel${linkedPixels.length !== 1 ? 's' : ''} linked`
                                : 'Link pixels to track events'}
                        </p>
                    </div>
                    {linkedPixels.length > 0 && (
                        <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center">
                            <Check size={12} className="text-blue-600" />
                        </div>
                    )}
                </div>

                <div className="p-3">
                    {pixelsLoading ? (
                        <div className="space-y-2">
                            <div className="h-14 bg-slate-50 rounded-xl animate-pulse" />
                        </div>
                    ) : pixels.length === 0 ? (
                        <div className="bg-gradient-to-br from-slate-50 to-white border border-dashed border-slate-200 rounded-xl p-6 text-center flex flex-col items-center">
                            <div className="w-14 h-14 rounded-2xl bg-white shadow-sm border border-slate-100 flex items-center justify-center mb-3">
                                <Zap size={22} className="text-slate-300" />
                            </div>
                            <p className="text-xs font-bold text-slate-700 mb-1">No pixels connected</p>
                            <p className="text-[10px] text-slate-400 mb-4 leading-relaxed">
                                Connect a Meta Pixel to track conversions.
                            </p>
                            <Button
                                onClick={openIntegration}
                                className="bg-blue-600 hover:bg-blue-700 text-white shadow-md h-9 rounded-xl px-5 text-xs font-bold transition-all active:scale-95"
                            >
                                <Plus size={14} className="mr-1.5" />
                                Connect Pixel
                            </Button>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {/* Linked pixels */}
                            {linkedPixels.map(pixel => {
                                const sublabel = (pixel.pixels && pixel.pixels.length > 0)
                                    ? `${pixel.pixels.length} Pixel${pixel.pixels.length !== 1 ? 's' : ''}`
                                    : `ID: ${(pixel as any).pixelId || 'N/A'}`;
                                return (
                                    <div key={pixel.id} className="flex items-center gap-3 p-3 rounded-xl border border-blue-200/80 bg-gradient-to-r from-blue-50/60 to-white transition-all duration-300">
                                        <div className="w-9 h-9 rounded-lg bg-blue-100 border border-blue-200 flex items-center justify-center shrink-0">
                                            <Check size={16} className="text-blue-600" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-xs font-bold text-slate-900 truncate">{pixel.name}</p>
                                            <p className="text-[9px] text-slate-400 truncate mt-0.5">{sublabel}</p>
                                        </div>
                                        <button
                                            className="flex items-center gap-1 h-7 px-2.5 text-[10px] font-bold text-red-500 hover:text-white hover:bg-red-500 border border-red-200 hover:border-red-500 rounded-lg transition-all duration-200 shrink-0"
                                            onClick={() => unlinkPixel(pixel.id)}
                                        >
                                            <Unlink size={10} /> Unlink
                                        </button>
                                    </div>
                                );
                            })}

                            {/* Unlinked pixels */}
                            {unlinkedPixels.map(pixel => {
                                const sublabel = (pixel.pixels && pixel.pixels.length > 0)
                                    ? `${pixel.pixels.length} Pixel${pixel.pixels.length !== 1 ? 's' : ''}`
                                    : `ID: ${(pixel as any).pixelId || 'N/A'}`;
                                return (
                                    <button
                                        key={pixel.id}
                                        onClick={() => linkPixel(pixel.id)}
                                        className={`w-full flex items-center gap-3 p-2.5 rounded-xl border ${linkedPixels.length > 0 ? 'border-dashed border-slate-200 bg-slate-50/30' : 'border-slate-200 bg-white'
                                            } hover:border-blue-300 hover:bg-blue-50/40 hover:shadow-sm transition-all duration-200 group cursor-pointer text-left`}
                                    >
                                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-colors ${linkedPixels.length > 0
                                            ? 'bg-white text-blue-400 border border-slate-200 group-hover:border-blue-200 group-hover:bg-blue-50'
                                            : 'bg-blue-50 text-blue-600 border border-blue-100'
                                            }`}>
                                            {linkedPixels.length > 0 ? <Plus size={14} /> : <Zap size={14} />}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-xs font-bold text-slate-800 group-hover:text-blue-700 truncate transition-colors">{pixel.name}</p>
                                            <p className="text-[9px] text-slate-400 truncate">{sublabel}</p>
                                        </div>
                                        <span className="flex items-center gap-0.5 text-[10px] font-bold text-slate-400 group-hover:text-blue-600 transition-colors shrink-0">
                                            Link <ChevronRight size={12} />
                                        </span>
                                    </button>
                                );
                            })}

                            <div className="pt-1 border-t border-slate-100 mt-1">
                                <button onClick={openIntegration} className="w-full flex items-center justify-center gap-1.5 p-2 rounded-lg text-[10px] font-bold text-slate-400 hover:text-blue-600 transition-colors cursor-pointer">
                                    <Plus size={10} /> Connect New Pixel
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <MetaPixelIntegration userId={userId} hideTrigger={true} />
        </div>
    );
};
