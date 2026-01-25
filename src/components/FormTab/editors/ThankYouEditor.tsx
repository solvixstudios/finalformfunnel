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
                <div className="flex flex-col gap-1.5">
                  <Label className="text-[9px] font-bold text-slate-400 uppercase">Profil WhatsApp à utiliser</Label>
                  <select
                    className="w-full text-[10px] border border-slate-200 rounded-lg p-2 outline-none focus:ring-1 focus:ring-green-400"
                    value={formConfig.thankYou.selectedWhatsappProfileId || ""}
                    onChange={(e) =>
                      setFormConfig({
                        ...formConfig,
                        thankYou: {
                          ...formConfig.thankYou,
                          selectedWhatsappProfileId: e.target.value
                        }
                      })
                    }
                  >
                    <option value="">Utiliser le profil par défaut</option>
                    {profiles.map(p => (
                      <option key={p.id} value={p.id}>
                        {p.name} {p.isDefault ? '(Défaut)' : ''} ({p.phoneNumber})
                      </option>
                    ))}
                  </select>
                </div>
                {profiles.length === 0 && (
                  <p className="text-[9px] text-red-500">Aucun profil configuré. Allez dans Intégrations.</p>
                )}
              </div>
            )}
          </div>
        </div>{" "}
      </div>{" "}
    </div>
  );
};
