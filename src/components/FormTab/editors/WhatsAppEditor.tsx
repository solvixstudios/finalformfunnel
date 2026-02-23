import { Phone, Check, Plus, Unlink, ChevronRight } from "lucide-react";
import { useSearchParams } from "react-router-dom";
import { auth } from "../../../lib/firebase";
import { useWhatsAppProfiles } from "../../../lib/firebase/whatsappHooks";
import { useFormStore } from "../../../stores";
import { WhatsAppIntegration } from "../../integrations/WhatsAppIntegration";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";


export const WhatsAppEditor = () => {
    const formConfig = useFormStore((state) => state.formConfig);
    const setFormConfig = useFormStore((state) => state.setFormConfig);
    const userId = auth.currentUser?.uid || "";

    const { profiles, loading: waLoading } = useWhatsAppProfiles(userId);
    const selectedProfileId: string | null = formConfig.addons?.selectedWhatsappProfileId || null;
    const [, setSearchParams] = useSearchParams();

    const openIntegration = () => {
        setSearchParams(prev => {
            const next = new URLSearchParams(prev);
            next.set('open', 'whatsapp');
            next.set('profileId', 'new');
            return next;
        });
    };

    const linkProfile = (profileId: string) => {
        setFormConfig({
            ...formConfig,
            addons: { ...formConfig.addons, selectedWhatsappProfileId: profileId },
        });
    };

    const unlinkProfile = () => {
        setFormConfig({
            ...formConfig,
            addons: { ...formConfig.addons, selectedWhatsappProfileId: null },
        });
    };

    const linkedProfile = profiles.find(p => p.id === selectedProfileId);
    const unlinkedProfiles = profiles.filter(p => p.id !== selectedProfileId);

    return (
        <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
            <h3 className="text-[10px] font-black uppercase text-slate-400 tracking-[0.15em] flex items-center gap-2 px-1">
                <Phone size={14} className="text-green-500" /> WhatsApp
            </h3>

            <div className="bg-white border border-slate-200 shadow-sm rounded-2xl overflow-hidden">
                <div className="p-4 border-b border-slate-100 bg-gradient-to-r from-slate-50/80 to-white flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-50 to-green-100 border border-green-200/60 flex items-center justify-center shadow-sm shrink-0">
                        <Phone size={18} className="text-green-600" />
                    </div>
                    <div className="flex-1">
                        <h4 className="text-sm font-bold text-slate-900 leading-tight">WhatsApp Profile</h4>
                        <p className="text-[11px] text-slate-500 font-medium mt-0.5">
                            {linkedProfile ? 'Profile linked' : 'Link a profile for this form'}
                        </p>
                    </div>
                    {linkedProfile && (
                        <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center">
                            <Check size={12} className="text-green-600" />
                        </div>
                    )}
                </div>

                <div className="p-3">
                    {waLoading ? (
                        <div className="space-y-2">
                            <div className="h-14 bg-slate-50 rounded-xl animate-pulse" />
                        </div>
                    ) : profiles.length === 0 ? (
                        <div className="bg-gradient-to-br from-slate-50 to-white border border-dashed border-slate-200 rounded-xl p-6 text-center flex flex-col items-center">
                            <div className="w-14 h-14 rounded-2xl bg-white shadow-sm border border-slate-100 flex items-center justify-center mb-3">
                                <Phone size={22} className="text-slate-300" />
                            </div>
                            <p className="text-xs font-bold text-slate-700 mb-1">No profiles connected</p>
                            <p className="text-[10px] text-slate-400 mb-4 leading-relaxed">
                                Connect a WhatsApp profile to enable messaging.
                            </p>
                            <Button
                                onClick={openIntegration}
                                className="bg-[#25D366] hover:bg-[#20bd5a] text-white shadow-md h-9 rounded-xl px-5 text-xs font-bold transition-all active:scale-95"
                            >
                                <Plus size={14} className="mr-1.5" />
                                Connect WhatsApp
                            </Button>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {/* Linked profile */}
                            {linkedProfile && (
                                <div className="flex items-center gap-3 p-3 rounded-xl border border-green-200/80 bg-gradient-to-r from-green-50/60 to-white transition-all duration-300">
                                    <div className="w-9 h-9 rounded-lg bg-green-100 border border-green-200 flex items-center justify-center shrink-0">
                                        <Check size={16} className="text-green-600" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-xs font-bold text-slate-900 truncate">{linkedProfile.name}</p>
                                        <p className="text-[9px] text-slate-400 truncate mt-0.5">{linkedProfile.phoneNumber}</p>
                                    </div>
                                    <button
                                        className="flex items-center gap-1 h-7 px-2.5 text-[10px] font-bold text-red-500 hover:text-white hover:bg-red-500 border border-red-200 hover:border-red-500 rounded-lg transition-all duration-200 shrink-0"
                                        onClick={unlinkProfile}
                                    >
                                        <Unlink size={10} /> Unlink
                                    </button>
                                </div>
                            )}

                            {/* WhatsApp button toggle — only when linked */}
                            {linkedProfile && (
                                <div className="flex items-center justify-between p-3 bg-green-50/60 border border-green-100 rounded-xl">
                                    <div className="space-y-0.5">
                                        <Label className="text-[11px] font-bold text-green-900 leading-tight">WhatsApp Button</Label>
                                        <p className="text-[10px] text-green-600/80 font-medium">Show on Thank You page</p>
                                    </div>
                                    <Switch
                                        checked={formConfig.thankYou?.enableWhatsApp || false}
                                        onCheckedChange={(checked) =>
                                            setFormConfig({
                                                ...formConfig,
                                                thankYou: { ...formConfig.thankYou, enableWhatsApp: checked },
                                            })
                                        }
                                    />
                                </div>
                            )}

                            {/* Unlinked profiles */}
                            {unlinkedProfiles.map(profile => (
                                <button
                                    key={profile.id}
                                    onClick={() => linkProfile(profile.id)}
                                    className={`w-full flex items-center gap-3 p-2.5 rounded-xl border ${linkedProfile ? 'border-dashed border-slate-200 bg-slate-50/30' : 'border-slate-200 bg-white'
                                        } hover:border-green-300 hover:bg-green-50/40 hover:shadow-sm transition-all duration-200 group cursor-pointer text-left`}
                                >
                                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-colors ${linkedProfile
                                        ? 'bg-white text-green-400 border border-slate-200 group-hover:border-green-200 group-hover:bg-green-50'
                                        : 'bg-green-50 text-green-600 border border-green-100'
                                        }`}>
                                        {linkedProfile ? <Plus size={14} /> : <Phone size={14} />}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-xs font-bold text-slate-800 group-hover:text-green-700 truncate transition-colors">{profile.name}</p>
                                        <p className="text-[9px] text-slate-400 truncate">{profile.phoneNumber}</p>
                                    </div>
                                    <span className="flex items-center gap-0.5 text-[10px] font-bold text-slate-400 group-hover:text-green-600 transition-colors shrink-0">
                                        Link <ChevronRight size={12} />
                                    </span>
                                </button>
                            ))}

                            <div className="pt-1 border-t border-slate-100 mt-1">
                                <button onClick={openIntegration} className="w-full flex items-center justify-center gap-1.5 p-2 rounded-lg text-[10px] font-bold text-slate-400 hover:text-green-600 transition-colors cursor-pointer">
                                    <Plus size={10} /> Connect New Profile
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <WhatsAppIntegration userId={userId} hideTrigger={true} />
        </div>
    );
};
