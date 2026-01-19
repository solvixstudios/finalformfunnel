import { Info, Ticket } from "lucide-react";
import { useFormStore } from "../../../stores";

interface PromoCodeEditorProps {
    setEditingSection: (section: string) => void;
}

export const PromoCodeEditor = ({ setEditingSection }: PromoCodeEditorProps) => {
    const formConfig = useFormStore((state) => state.formConfig);
    const setFormConfig = useFormStore((state) => state.setFormConfig);
    return (
        <div className="space-y-4">
            <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4 shadow-sm">
                <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-white shadow-lg">
                        <Ticket size={20} />
                    </div>
                    <div>
                        <h4 className="text-sm font-bold text-slate-800">Textes du Code Promo</h4>
                        <p className="text-[10px] text-slate-400">
                            Personnaliser les textes affichés
                        </p>
                    </div>
                </div>

                {/* Link to Manager */}
                <div className="p-4 bg-violet-50 border border-violet-200 rounded-xl flex flex-col gap-3">
                    <p className="text-[11px] font-medium text-violet-700 flex gap-2 items-start">
                        <Info size={14} className="mt-0.5 flex-shrink-0" />
                        Pour ajouter ou modifier des codes promo, utilisez le gestionnaire.
                    </p>
                    <button
                        onClick={() => setEditingSection('promo_code_manager')}
                        className="w-full py-2 bg-violet-600 text-white rounded-lg text-xs font-bold hover:bg-violet-700 transition-colors shadow-sm"
                    >
                        Gérer les Codes Promo
                    </button>
                </div>

                {/* Section Title Toggle */}
                <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                    <span className="text-[11px] font-bold text-slate-600">
                        Afficher le titre de section
                    </span>
                    <button
                        onClick={() =>
                            setFormConfig({
                                ...formConfig,
                                sectionSettings: {
                                    ...formConfig.sectionSettings,
                                    promoCode: {
                                        ...formConfig.sectionSettings?.promoCode,
                                        showTitle: !formConfig.sectionSettings?.promoCode?.showTitle,
                                    },
                                },
                            })
                        }
                        className={`w-10 h-5 rounded-full relative transition-colors ${formConfig.sectionSettings?.promoCode?.showTitle ? "bg-indigo-600" : "bg-slate-200"}`}
                    >
                        <div
                            className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full transition-transform shadow ${formConfig.sectionSettings?.promoCode?.showTitle ? "translate-x-5" : ""}`}
                        />
                    </button>
                </div>

                {/* Placeholder Texts */}
                <div className="space-y-3">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">
                        Placeholder
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                            <span className="text-[9px] font-bold text-slate-400">
                                Français
                            </span>
                            <input
                                type="text"
                                value={formConfig.promoCode?.placeholder?.fr || ""}
                                onChange={(e) =>
                                    setFormConfig({
                                        ...formConfig,
                                        promoCode: {
                                            ...formConfig.promoCode,
                                            placeholder: {
                                                ...formConfig.promoCode?.placeholder,
                                                fr: e.target.value,
                                            },
                                        },
                                    })
                                }
                                className="w-full text-xs border border-slate-200 rounded-lg p-3 focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400 outline-none transition-all"
                                placeholder="Code promo"
                            />
                        </div>
                        <div className="space-y-1">
                            <span className="text-[9px] font-bold text-slate-400">
                                العربية
                            </span>
                            <input
                                type="text"
                                dir="rtl"
                                value={formConfig.promoCode?.placeholder?.ar || ""}
                                onChange={(e) =>
                                    setFormConfig({
                                        ...formConfig,
                                        promoCode: {
                                            ...formConfig.promoCode,
                                            placeholder: {
                                                ...formConfig.promoCode?.placeholder,
                                                ar: e.target.value,
                                            },
                                        },
                                    })
                                }
                                className="w-full text-xs border border-slate-200 rounded-lg p-3 focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400 outline-none transition-all"
                                placeholder="كود الخصم"
                            />
                        </div>
                    </div>
                </div>

                {/* Button Text */}
                <div className="space-y-3">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">
                        Texte du bouton
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                            <span className="text-[9px] font-bold text-slate-400">
                                Français
                            </span>
                            <input
                                type="text"
                                value={formConfig.promoCode?.buttonText?.fr || ""}
                                onChange={(e) =>
                                    setFormConfig({
                                        ...formConfig,
                                        promoCode: {
                                            ...formConfig.promoCode,
                                            buttonText: {
                                                ...formConfig.promoCode?.buttonText,
                                                fr: e.target.value,
                                            },
                                        },
                                    })
                                }
                                className="w-full text-xs border border-slate-200 rounded-lg p-3 focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400 outline-none transition-all"
                                placeholder="Appliquer"
                            />
                        </div>
                        <div className="space-y-1">
                            <span className="text-[9px] font-bold text-slate-400">
                                العربية
                            </span>
                            <input
                                type="text"
                                dir="rtl"
                                value={formConfig.promoCode?.buttonText?.ar || ""}
                                onChange={(e) =>
                                    setFormConfig({
                                        ...formConfig,
                                        promoCode: {
                                            ...formConfig.promoCode,
                                            buttonText: {
                                                ...formConfig.promoCode?.buttonText,
                                                ar: e.target.value,
                                            },
                                        },
                                    })
                                }
                                className="w-full text-xs border border-slate-200 rounded-lg p-3 focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400 outline-none transition-all"
                                placeholder="تطبيق"
                            />
                        </div>
                    </div>
                </div>
            </div>

        </div>

    );
};
