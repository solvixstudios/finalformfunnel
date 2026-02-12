import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { CheckCircle } from "lucide-react";
import { useFormStore } from "../../../stores";

import { auth } from "../../../lib/firebase";
import { useWhatsAppProfiles } from "../../../lib/firebase/whatsappHooks";

export const ThankYouEditor = () => {
  const formConfig = useFormStore((state) => state.formConfig);
  const setFormConfig = useFormStore((state) => state.setFormConfig);
  const { profiles } = useWhatsAppProfiles(auth.currentUser?.uid || "");
  return (
    <div className="space-y-4">
      {" "}
      <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-4">
        {" "}
        <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-wide flex items-center gap-2">
          <CheckCircle size={12} /> Page de Remerciement
        </h4>{" "}
        <div className="space-y-3">
          {" "}
          <div className="space-y-1">
            {" "}
            <label className="text-[9px] font-bold text-slate-400 uppercase">
              Titre
            </label>{" "}
            <div className="grid grid-cols-2 gap-2">
              {" "}
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
              />{" "}
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
              />{" "}
            </div>{" "}
          </div>{" "}
          <div className="space-y-1">
            {" "}
            <label className="text-[9px] font-bold text-slate-400 uppercase">
              Message
            </label>{" "}
            <div className="grid grid-cols-2 gap-2">
              {" "}
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
              />{" "}
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
              />{" "}
            </div>{" "}
          </div>{" "}
        </div>{" "}
        <div className="space-y-1">
          {" "}
          <label className="text-[9px] font-bold text-slate-400 uppercase">
            Note de Confirmation
          </label>{" "}
          <div className="grid grid-cols-2 gap-2">
            {" "}
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
            />{" "}
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
            />{" "}
          </div>{" "}
        </div>{" "}
        <div className="space-y-1">
          <div className="space-y-1">
            {" "}
            <label className="text-[9px] font-bold text-slate-400 uppercase">
              Bouton Résumé
            </label>{" "}
            <div className="grid grid-cols-2 gap-2">
              {" "}
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
              />{" "}
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
              />{" "}
            </div>{" "}
          </div>{" "}
          <div className="space-y-1">
            {" "}
            <label className="text-[9px] font-bold text-slate-400 uppercase">
              Bouton WhatsApp
            </label>{" "}
            <div className="grid grid-cols-2 gap-2">
              {" "}
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
              />{" "}
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
              />{" "}
            </div>{" "}
          </div>{" "}
        </div>{" "}
        <div className="space-y-1">
          {" "}
          <label className="text-[9px] font-bold text-slate-400 uppercase">
            Boutons Secondaires (Résumé)
          </label>{" "}
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
        </div>{" "}
      </div>{" "}
      <div className="space-y-1">
        {" "}
        <label className="text-[9px] font-bold text-slate-400 uppercase">
          Boutons Secondaires (Résumé)
        </label>{" "}
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
      </div>{" "}

      <div className="pt-2 border-t border-slate-100">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label className="text-[10px] font-bold text-slate-500 uppercase">Intégration WhatsApp</Label>
            <p className="text-[9px] text-slate-400">Afficher le bouton de confirmation</p>
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
        {formConfig.thankYou?.enableWhatsApp && (
          <div className="mt-3 space-y-2">
            <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-100 rounded-lg">
              <div className="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-green-600"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg>
              </div>
              <div className="flex-1">
                <p className="text-[10px] font-semibold text-green-800">WhatsApp Profile</p>
                <p className="text-[9px] text-green-600">
                  Configure in the <button
                    onClick={() => useFormStore.getState().setEditingSection('addons')}
                    className="font-bold underline hover:text-green-700"
                  >Addons</button> tab
                </p>
              </div>
            </div>
            {profiles.length === 0 && (
              <p className="text-[9px] text-red-500">Aucun profil configuré. Allez dans Intégrations.</p>
            )}
          </div>
        )}
      </div>

      {/* Price Formatting Section */}
      <div className="pt-2 border-t border-slate-100">
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
            checked={(formConfig as any).thankYou?.enableConfetti !== false}
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
            checked={(formConfig as any).thankYou?.enableSound !== false}
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
  );
};
