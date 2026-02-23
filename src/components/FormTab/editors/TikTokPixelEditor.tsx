import { MessageCircle, Check, Plus, Unlink, ChevronRight } from "lucide-react";
import { useSearchParams } from "react-router-dom";
import { auth } from "../../../lib/firebase";
import { useTikTokPixels } from "../../../lib/firebase/tiktokHooks";
import { useFormStore } from "../../../stores";
import { TikTokIntegration } from "../../integrations/TikTokIntegration";
import { Button } from "@/components/ui/button";


export const TikTokPixelEditor = () => {
    const formConfig = useFormStore((state) => state.formConfig);
    const setFormConfig = useFormStore((state) => state.setFormConfig);
    const userId = auth.currentUser?.uid || "";

    const { pixels: tiktokPixels, loading: tiktokLoading } = useTikTokPixels(userId);
    const selectedTikTokIds: string[] = formConfig.addons?.tiktokPixelIds || [];
    const [, setSearchParams] = useSearchParams();

    const openIntegration = () => {
        setSearchParams(prev => {
            const next = new URLSearchParams(prev);
            next.set('open', 'tiktok-pixel');
            next.set('profileId', 'new');
            return next;
        });
    };

    const linkPixel = (pixelId: string) => {
        const updatedIds = [...selectedTikTokIds, pixelId];
        const currentData: any[] = formConfig.addons?.tiktokPixelData || [];
        let updatedData: any[] = [...currentData];

        const profile = tiktokPixels.find(p => p.id === pixelId);
        if (profile) {
            updatedData = updatedData.filter((p: any) => !profile.pixels?.some((pp: any) => pp.pixelId === p.pixelId));
            const profilePixels = (profile.pixels || []).map((p: any) => ({
                id: profile.id, pixelId: p.pixelId, accessToken: p.accessToken, testCode: p.testCode, name: profile.name
            }));
            if (profilePixels.length === 0 && (profile as any).pixelId) {
                profilePixels.push({
                    id: profile.id, pixelId: (profile as any).pixelId, accessToken: (profile as any).accessToken,
                    testCode: (profile as any).testCode, name: profile.name
                });
            }
            updatedData.push(...profilePixels);
        }

        setFormConfig({
            ...formConfig,
            addons: { ...formConfig.addons, tiktokPixelIds: updatedIds, tiktokPixelData: updatedData },
        });
    };

    const unlinkPixel = (pixelId: string) => {
        const updatedIds = selectedTikTokIds.filter(id => id !== pixelId);
        const updatedData = (formConfig.addons?.tiktokPixelData || []).filter((p: any) => p.id !== pixelId);

        setFormConfig({
            ...formConfig,
            addons: { ...formConfig.addons, tiktokPixelIds: updatedIds, tiktokPixelData: updatedData },
        });
    };

    const linkedPixels = tiktokPixels.filter(p => selectedTikTokIds.includes(p.id));
    const unlinkedPixels = tiktokPixels.filter(p => !selectedTikTokIds.includes(p.id));

    return (
        <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
            <h3 className="text-[10px] font-black uppercase text-slate-400 tracking-[0.15em] flex items-center gap-2 px-1">
                <MessageCircle size={14} className="text-slate-800" /> TikTok Pixel
            </h3>

            <div className="bg-white border border-slate-200 shadow-sm rounded-2xl overflow-hidden">
                <div className="p-4 border-b border-slate-100 bg-gradient-to-r from-slate-50/80 to-white flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-slate-100 to-slate-200 border border-slate-300/60 flex items-center justify-center shadow-sm shrink-0">
                        <MessageCircle size={18} className="text-slate-800" />
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
                        <div className="w-6 h-6 rounded-full bg-slate-200 flex items-center justify-center">
                            <Check size={12} className="text-slate-700" />
                        </div>
                    )}
                </div>

                <div className="p-3">
                    {tiktokLoading ? (
                        <div className="space-y-2">
                            <div className="h-14 bg-slate-50 rounded-xl animate-pulse" />
                        </div>
                    ) : tiktokPixels.length === 0 ? (
                        <div className="bg-gradient-to-br from-slate-50 to-white border border-dashed border-slate-200 rounded-xl p-6 text-center flex flex-col items-center">
                            <div className="w-14 h-14 rounded-2xl bg-white shadow-sm border border-slate-100 flex items-center justify-center mb-3">
                                <MessageCircle size={22} className="text-slate-300" />
                            </div>
                            <p className="text-xs font-bold text-slate-700 mb-1">No pixels connected</p>
                            <p className="text-[10px] text-slate-400 mb-4 leading-relaxed">
                                Connect a TikTok Pixel to track conversions.
                            </p>
                            <Button
                                onClick={openIntegration}
                                className="bg-slate-800 hover:bg-slate-900 text-white shadow-md h-9 rounded-xl px-5 text-xs font-bold transition-all active:scale-95"
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
                                    <div key={pixel.id} className="flex items-center gap-3 p-3 rounded-xl border border-slate-300/80 bg-gradient-to-r from-slate-100/60 to-white transition-all duration-300">
                                        <div className="w-9 h-9 rounded-lg bg-slate-200 border border-slate-300 flex items-center justify-center shrink-0">
                                            <Check size={16} className="text-slate-800" />
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
                                            } hover:border-slate-400 hover:bg-slate-50 hover:shadow-sm transition-all duration-200 group cursor-pointer text-left`}
                                    >
                                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-colors ${linkedPixels.length > 0
                                            ? 'bg-white text-slate-400 border border-slate-200 group-hover:border-slate-300 group-hover:bg-slate-50'
                                            : 'bg-slate-100 text-slate-600 border border-slate-200'
                                            }`}>
                                            {linkedPixels.length > 0 ? <Plus size={14} /> : <MessageCircle size={14} />}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-xs font-bold text-slate-800 group-hover:text-slate-900 truncate transition-colors">{pixel.name}</p>
                                            <p className="text-[9px] text-slate-400 truncate">{sublabel}</p>
                                        </div>
                                        <span className="flex items-center gap-0.5 text-[10px] font-bold text-slate-400 group-hover:text-slate-700 transition-colors shrink-0">
                                            Link <ChevronRight size={12} />
                                        </span>
                                    </button>
                                );
                            })}

                            <div className="pt-1 border-t border-slate-100 mt-1">
                                <button onClick={openIntegration} className="w-full flex items-center justify-center gap-1.5 p-2 rounded-lg text-[10px] font-bold text-slate-400 hover:text-slate-700 transition-colors cursor-pointer">
                                    <Plus size={10} /> Connect New Pixel
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <TikTokIntegration userId={userId} hideTrigger={true} />
        </div>
    );
};
