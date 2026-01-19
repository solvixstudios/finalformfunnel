import { CheckCircle } from "lucide-react";
import { useFormStore } from "../../../stores";

export const ThankYouEditor = () => {
  const formConfig = useFormStore((state) => state.formConfig);
  const setFormConfig = useFormStore((state) => state.setFormConfig);
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
        </div>{" "}
      </div>{" "}
    </div>
  );
};
