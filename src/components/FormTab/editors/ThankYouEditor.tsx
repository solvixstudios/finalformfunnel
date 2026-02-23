import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  CheckCircle,
  MessageSquare,
  MousePointerClick,
  Settings,
} from "lucide-react";
import { useFormStore } from "../../../stores";


export const ThankYouEditor = () => {
  const formConfig = useFormStore((state) => state.formConfig);
  const setFormConfig = useFormStore((state) => state.setFormConfig);
  return (

    <div className="space-y-4">
      {/* Contenu Principal */}
      <div className="bg-white border border-slate-200 rounded-xl p-4">
        <div className="flex items-center gap-2 mb-4">
          <MessageSquare className="text-slate-400" size={16} />
          <span className="text-xs font-bold text-slate-700">Contenu du Message</span>
        </div>
        <div className="space-y-4">
          <div className="space-y-1">
            <label className="text-[9px] font-bold text-slate-400 uppercase">
              Titre
            </label>
            <div className="grid grid-cols-2 gap-2">
              <input
                type="text"
                value={formConfig.thankYou?.title?.fr || ""}
                onChange={(e) =>
                  setFormConfig({
                    ...formConfig,
                    thankYou: {
                      ...formConfig.thankYou,
                      title: {
                        ...formConfig.thankYou.title,
                        fr: e.target.value,
                      },
                    },
                  })
                }
                className="text-[11px] border border-slate-200 rounded-lg p-2"
                placeholder="Merci !"
              />
              <input
                type="text"
                dir="rtl"
                value={formConfig.thankYou?.title?.ar || ""}
                onChange={(e) =>
                  setFormConfig({
                    ...formConfig,
                    thankYou: {
                      ...formConfig.thankYou,
                      title: {
                        ...formConfig.thankYou.title,
                        ar: e.target.value,
                      },
                    },
                  })
                }
                className="text-[11px] border border-slate-200 rounded-lg p-2"
                placeholder="شكرا !"
              />
            </div>
          </div>
          <div className="space-y-1">
            <label className="text-[9px] font-bold text-slate-400 uppercase">
              Message
            </label>
            <div className="grid grid-cols-2 gap-2">
              <textarea
                rows={2}
                value={formConfig.thankYou?.message?.fr || ""}
                onChange={(e) =>
                  setFormConfig({
                    ...formConfig,
                    thankYou: {
                      ...formConfig.thankYou,
                      message: {
                        ...formConfig.thankYou.message,
                        fr: e.target.value,
                      },
                    },
                  })
                }
                className="text-[11px] border border-slate-200 rounded-lg p-2 resize-none"
                placeholder="Votre commande a été reçue."
              />
              <textarea
                rows={2}
                dir="rtl"
                value={formConfig.thankYou?.message?.ar || ""}
                onChange={(e) =>
                  setFormConfig({
                    ...formConfig,
                    thankYou: {
                      ...formConfig.thankYou,
                      message: {
                        ...formConfig.thankYou.message,
                        ar: e.target.value,
                      },
                    },
                  })
                }
                className="text-[11px] border border-slate-200 rounded-lg p-2 resize-none"
                placeholder="تم استلام طلبك بنجاح."
              />
            </div>
          </div>
          <div className="space-y-1">
            <label className="text-[9px] font-bold text-slate-400 uppercase">
              Note de Confirmation
            </label>
            <div className="grid grid-cols-2 gap-2">
              <textarea
                rows={3}
                value={formConfig.thankYou?.confirmationNote?.fr || ""}
                onChange={(e) =>
                  setFormConfig({
                    ...formConfig,
                    thankYou: {
                      ...formConfig.thankYou,
                      confirmationNote: {
                        fr: e.target.value,
                        ar: formConfig.thankYou?.confirmationNote?.ar || "",
                      },
                    },
                  })
                }
                className="text-[11px] border border-slate-200 rounded-lg p-2 resize-none"
                placeholder="Message de confirmation..."
              />
              <textarea
                rows={3}
                dir="rtl"
                value={formConfig.thankYou?.confirmationNote?.ar || ""}
                onChange={(e) =>
                  setFormConfig({
                    ...formConfig,
                    thankYou: {
                      ...formConfig.thankYou,
                      confirmationNote: {
                        fr: formConfig.thankYou?.confirmationNote?.fr || "",
                        ar: e.target.value,
                      },
                    },
                  })
                }
                className="text-[11px] border border-slate-200 rounded-lg p-2 resize-none"
                placeholder="رسالة التأكيد..."
              />
            </div>
          </div>
        </div>
      </div>

      {/* Actions & Boutons */}
      <div className="bg-white border border-slate-200 rounded-xl p-4">
        <div className="flex items-center gap-2 mb-4">
          <MousePointerClick className="text-slate-400" size={16} />
          <span className="text-xs font-bold text-slate-700">Actions & Boutons</span>
        </div>
        <div className="space-y-4">
          <div className="space-y-1">
            <label className="text-[9px] font-bold text-slate-400 uppercase">
              Bouton Résumé
            </label>
            <div className="grid grid-cols-2 gap-2">
              <input
                type="text"
                value={formConfig.thankYou?.summaryButton?.fr || ""}
                onChange={(e) =>
                  setFormConfig({
                    ...formConfig,
                    thankYou: {
                      ...formConfig.thankYou,
                      summaryButton: {
                        ...formConfig.thankYou.summaryButton,
                        fr: e.target.value,
                      },
                    },
                  })
                }
                className="text-[11px] border border-slate-200 rounded-lg p-2"
                placeholder="Voir le résumé"
              />
              <input
                type="text"
                dir="rtl"
                value={formConfig.thankYou?.summaryButton?.ar || ""}
                onChange={(e) =>
                  setFormConfig({
                    ...formConfig,
                    thankYou: {
                      ...formConfig.thankYou,
                      summaryButton: {
                        ...formConfig.thankYou.summaryButton,
                        ar: e.target.value,
                      },
                    },
                  })
                }
                className="text-[11px] border border-slate-200 rounded-lg p-2"
                placeholder="عرض ملخص الطلب"
              />
            </div>
          </div>
          <div className="space-y-1">
            <label className="text-[9px] font-bold text-slate-400 uppercase">
              Bouton WhatsApp
            </label>
            <div className="grid grid-cols-2 gap-2">
              <input
                type="text"
                value={formConfig.thankYou?.whatsappButton?.fr || ""}
                onChange={(e) =>
                  setFormConfig({
                    ...formConfig,
                    thankYou: {
                      ...formConfig.thankYou,
                      whatsappButton: {
                        ...formConfig.thankYou.whatsappButton,
                        fr: e.target.value,
                      },
                    },
                  })
                }
                className="text-[11px] border border-slate-200 rounded-lg p-2"
                placeholder="Confirmer via WhatsApp"
              />
              <input
                type="text"
                dir="rtl"
                value={formConfig.thankYou?.whatsappButton?.ar || ""}
                onChange={(e) =>
                  setFormConfig({
                    ...formConfig,
                    thankYou: {
                      ...formConfig.thankYou,
                      whatsappButton: {
                        ...formConfig.thankYou.whatsappButton,
                        ar: e.target.value,
                      },
                    },
                  })
                }
                className="text-[11px] border border-slate-200 rounded-lg p-2"
                placeholder="تأكيد عبر واتساب"
              />
            </div>
          </div>

          <div className="space-y-1 pt-2 border-t border-slate-100">
            <label className="text-[9px] font-bold text-slate-400 uppercase">
              Boutons Secondaires (Résumé)
            </label>
            <div className="space-y-2">
              {/* Modify Button */}
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  value={formConfig.thankYou?.modifyButton?.fr || ""}
                  onChange={(e) =>
                    setFormConfig({
                      ...formConfig,
                      thankYou: {
                        ...formConfig.thankYou,
                        modifyButton: {
                          ...formConfig.thankYou.modifyButton,
                          fr: e.target.value,
                        },
                      },
                    })
                  }
                  className="text-[11px] border border-slate-200 rounded-lg p-2"
                  placeholder="Modifier la commande"
                />
                <input
                  type="text"
                  dir="rtl"
                  value={formConfig.thankYou?.modifyButton?.ar || ""}
                  onChange={(e) =>
                    setFormConfig({
                      ...formConfig,
                      thankYou: {
                        ...formConfig.thankYou,
                        modifyButton: {
                          ...formConfig.thankYou.modifyButton,
                          ar: e.target.value,
                        },
                      },
                    })
                  }
                  className="text-[11px] border border-slate-200 rounded-lg p-2"
                  placeholder="تعديل الطلب"
                />
              </div>
              {/* Back Button */}
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  value={formConfig.thankYou?.backButton?.fr || ""}
                  onChange={(e) =>
                    setFormConfig({
                      ...formConfig,
                      thankYou: {
                        ...formConfig.thankYou,
                        backButton: {
                          ...formConfig.thankYou.backButton,
                          fr: e.target.value,
                        },
                      },
                    })
                  }
                  className="text-[11px] border border-slate-200 rounded-lg p-2"
                  placeholder="Retour"
                />
                <input
                  type="text"
                  dir="rtl"
                  value={formConfig.thankYou?.backButton?.ar || ""}
                  onChange={(e) =>
                    setFormConfig({
                      ...formConfig,
                      thankYou: {
                        ...formConfig.thankYou,
                        backButton: {
                          ...formConfig.thankYou.backButton,
                          ar: e.target.value,
                        },
                      },
                    })
                  }
                  className="text-[11px] border border-slate-200 rounded-lg p-2"
                  placeholder="رجوع"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Paramètres & Effets */}
      <div className="bg-white border border-slate-200 rounded-xl p-4">
        <div className="flex items-center gap-2 mb-4">
          <Settings className="text-slate-400" size={16} />
          <span className="text-xs font-bold text-slate-700">Paramètres & Effets</span>
        </div>
        <div className="space-y-4">
          {/* Price Formatting Section */}
          <div>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-[10px] font-bold text-slate-500 uppercase">Prix en toutes lettres</Label>
                <p className="text-[9px] text-slate-400">Afficher dans le résumé de commande</p>
              </div>
              <Switch
                checked={formConfig.thankYou?.priceInLetters?.enabled || false}
                onCheckedChange={(checked) =>
                  setFormConfig({
                    ...formConfig,
                    thankYou: {
                      ...formConfig.thankYou,
                      priceInLetters: {
                        ...formConfig.thankYou?.priceInLetters,
                        enabled: checked,
                        mode: formConfig.thankYou?.priceInLetters?.mode || 'dinars'
                      },
                    },
                  })
                }
              />
            </div>
            {formConfig.thankYou?.priceInLetters?.enabled && (
              <div className="mt-2 grid grid-cols-2 gap-2 animate-in slide-in-from-top-1 duration-200">
                <button
                  onClick={() =>
                    setFormConfig({
                      ...formConfig,
                      thankYou: {
                        ...formConfig.thankYou,
                        priceInLetters: {
                          ...formConfig.thankYou?.priceInLetters,
                          enabled: true,
                          mode: 'dinars'
                        },
                      },
                    })
                  }
                  className={`p-2 rounded-lg border text-[10px] font-bold transition-all ${formConfig.thankYou?.priceInLetters?.mode === 'dinars'
                    ? "border-indigo-500 bg-indigo-50 text-indigo-600"
                    : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
                    }`}
                >
                  Dinars (DA)
                </button>
                <button
                  onClick={() =>
                    setFormConfig({
                      ...formConfig,
                      thankYou: {
                        ...formConfig.thankYou,
                        priceInLetters: {
                          ...formConfig.thankYou?.priceInLetters,
                          enabled: true,
                          mode: 'centimes'
                        },
                      },
                    })
                  }
                  className={`p-2 rounded-lg border text-[10px] font-bold transition-all ${formConfig.thankYou?.priceInLetters?.mode === 'centimes'
                    ? "border-indigo-500 bg-indigo-50 text-indigo-600"
                    : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
                    }`}
                >
                  Centimes
                </button>
              </div>
            )}
          </div>

          {/* Effects Section */}
          <div className="pt-2 border-t border-slate-100 space-y-3">
            <Label className="text-[10px] font-bold text-slate-500 uppercase">Effets Visuels & Sonores</Label>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <span className="text-[11px] font-medium text-slate-700">Confettis</span>
                <p className="text-[9px] text-slate-400">Animation festive au succès</p>
              </div>
              <Switch
                checked={(formConfig.thankYou as any)?.enableConfetti !== false}
                onCheckedChange={(checked) =>
                  setFormConfig({
                    ...formConfig,
                    thankYou: {
                      ...formConfig.thankYou,
                      enableConfetti: checked,
                    } as any,
                  })
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <span className="text-[11px] font-medium text-slate-700">Effet Sonore</span>
                <p className="text-[9px] text-slate-400">Son de confirmation "Ding"</p>
              </div>
              <Switch
                checked={(formConfig.thankYou as any)?.enableSound !== false}
                onCheckedChange={(checked) =>
                  setFormConfig({
                    ...formConfig,
                    thankYou: {
                      ...formConfig.thankYou,
                      enableSound: checked,
                    } as any,
                  })
                }
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
