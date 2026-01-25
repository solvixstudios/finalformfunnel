import { Info, Truck } from "lucide-react";
import { useFormStore } from "../../../stores";

export const DeliveryEditor = () => {
  const formConfig = useFormStore((state) => state.formConfig);
  const setFormConfig = useFormStore((state) => state.setFormConfig);
  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4 shadow-sm">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white shadow-lg">
            <Truck size={20} />
          </div>
          <div>
            <h4 className="text-sm font-bold text-slate-800">
              Type de Livraison
            </h4>
            <p className="text-[10px] text-slate-400">
              Affichage de la section dans le formulaire
            </p>
          </div>
        </div>

        {/* Section Title Toggle */}
        <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
          <div>
            <span className="text-xs font-bold text-slate-700 block">
              Afficher le titre
            </span>
            <span className="text-[10px] text-slate-400">
              Titre de la section dans le formulaire
            </span>
          </div>
          <button
            onClick={() =>
              setFormConfig({
                ...formConfig,
                sectionSettings: {
                  ...(formConfig.sectionSettings || {}),
                  delivery: {
                    ...formConfig.sectionSettings?.delivery,
                    showTitle: !formConfig.sectionSettings?.delivery?.showTitle,
                  },
                } as any,
              })
            }
            className={`w-12 h-6 rounded-full relative transition-colors ${formConfig.sectionSettings?.delivery?.showTitle !== false ? "bg-indigo-600" : "bg-slate-200"}`}
          >
            <div
              className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform shadow ${formConfig.sectionSettings?.delivery?.showTitle !== false ? "translate-x-6" : ""}`}
            />
          </button>
        </div>
      </div>

      {/* Visual Options */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4 shadow-sm">
        <label className="text-[10px] font-bold text-slate-500 uppercase">
          Options d'affichage
        </label>

        {/* Style Selector */}
        <div className="space-y-2">
          <span className="text-[11px] font-bold text-slate-700">Style</span>
          <div className="grid grid-cols-3 gap-2">
            {['cards', 'list', 'compact'].map((style) => (
              <button
                key={style}
                onClick={() => setFormConfig({
                  ...formConfig,
                  sectionSettings: {
                    ...formConfig.sectionSettings,
                    delivery: { ...formConfig.sectionSettings?.delivery, layout: style as any, showTitle: formConfig.sectionSettings?.delivery?.showTitle ?? true }
                  }
                })}
                className={`p-2 rounded-lg border text-xs font-bold transition-all ${(formConfig.sectionSettings?.delivery?.layout || 'cards') === style
                  ? 'bg-indigo-50 border-indigo-200 text-indigo-700'
                  : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                  }`}
              >
                {style === 'cards' ? 'Cartes' : style === 'list' ? 'Liste' : 'Compact'}
              </button>
            ))}
          </div>
        </div>

        {/* Show Prices Toggle */}
        <div className="flex items-center justify-between p-3 rounded-lg border border-slate-100 bg-slate-50/50">
          <span className="text-[11px] font-bold text-slate-700">Afficher les tarifs</span>
          <button
            onClick={() => setFormConfig({
              ...formConfig,
              sectionSettings: {
                ...formConfig.sectionSettings,
                delivery: {
                  ...formConfig.sectionSettings?.delivery,
                  showPrices: !(formConfig.sectionSettings?.delivery?.showPrices ?? true)
                }
              }
            })}
            className={`w-8 h-4 rounded-full relative transition-colors ${(formConfig.sectionSettings?.delivery?.showPrices ?? true) ? 'bg-indigo-500' : 'bg-slate-300'
              }`}
          >
            <div className={`absolute top-0.5 left-0.5 w-3 h-3 bg-white rounded-full transition-transform ${(formConfig.sectionSettings?.delivery?.showPrices ?? true) ? 'translate-x-4' : ''
              }`} />
          </button>
        </div>
      </div>

      {/* Title Texts */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4 shadow-sm">
        <label className="text-[10px] font-bold text-slate-500 uppercase">
          Textes des options
        </label>

        <div className="space-y-3">
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
            <span className="text-[9px] font-black bg-slate-100 px-1.5 py-0.5 rounded text-slate-500 uppercase tracking-tighter">
              Titre Section
            </span>
            <div className="grid grid-cols-2 gap-2">
              <input
                type="text"
                value={formConfig.translations.delivery?.fr || ""}
                onChange={(e) =>
                  setFormConfig({
                    ...formConfig,
                    translations: {
                      ...formConfig.translations,
                      delivery: {
                        ...formConfig.translations.delivery,
                        fr: e.target.value,
                      },
                    },
                  })
                }
                className="text-[11px] border border-slate-200 rounded-lg p-2 focus:border-indigo-500 outline-none"
                placeholder="Type de livraison"
              />
              <input
                type="text"
                value={formConfig.translations.delivery?.ar || ""}
                dir="rtl"
                onChange={(e) =>
                  setFormConfig({
                    ...formConfig,
                    translations: {
                      ...formConfig.translations,
                      delivery: {
                        ...formConfig.translations.delivery,
                        ar: e.target.value,
                      },
                    },
                  })
                }
                className="text-[11px] border border-slate-200 rounded-lg p-2 focus:border-indigo-500 outline-none"
                placeholder="نوع التوصيل"
              />
            </div>
          </div>

          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
            <span className="text-[9px] font-black bg-slate-100 px-1.5 py-0.5 rounded text-slate-500 uppercase tracking-tighter">
              À Domicile
            </span>
            <div className="grid grid-cols-2 gap-2">
              <input
                type="text"
                value={formConfig.translations.home?.fr || ""}
                onChange={(e) =>
                  setFormConfig({
                    ...formConfig,
                    translations: {
                      ...formConfig.translations,
                      home: {
                        ...formConfig.translations.home,
                        fr: e.target.value,
                      },
                    },
                  })
                }
                className="text-[11px] border border-slate-200 rounded-lg p-2 focus:border-indigo-500 outline-none"
              />
              <input
                type="text"
                value={formConfig.translations.home?.ar || ""}
                dir="rtl"
                onChange={(e) =>
                  setFormConfig({
                    ...formConfig,
                    translations: {
                      ...formConfig.translations,
                      home: {
                        ...formConfig.translations.home,
                        ar: e.target.value,
                      },
                    },
                  })
                }
                className="text-[11px] border border-slate-200 rounded-lg p-2 focus:border-indigo-500 outline-none"
              />
            </div>
          </div>

          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
            <span className="text-[9px] font-black bg-slate-100 px-1.5 py-0.5 rounded text-slate-500 uppercase tracking-tighter">
              En Bureau
            </span>
            <div className="grid grid-cols-2 gap-2">
              <input
                type="text"
                value={formConfig.translations.desk?.fr || ""}
                onChange={(e) =>
                  setFormConfig({
                    ...formConfig,
                    translations: {
                      ...formConfig.translations,
                      desk: {
                        ...formConfig.translations.desk,
                        fr: e.target.value,
                      },
                    },
                  })
                }
                className="text-[11px] border border-slate-200 rounded-lg p-2 focus:border-indigo-500 outline-none"
              />
              <input
                type="text"
                value={formConfig.translations.desk?.ar || ""}
                dir="rtl"
                onChange={(e) =>
                  setFormConfig({
                    ...formConfig,
                    translations: {
                      ...formConfig.translations,
                      desk: {
                        ...formConfig.translations.desk,
                        ar: e.target.value,
                      },
                    },
                  })
                }
                className="text-[11px] border border-slate-200 rounded-lg p-2 focus:border-indigo-500 outline-none"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Info Box */}
      <div className="p-4 bg-indigo-50 border border-indigo-200 rounded-xl">
        <p className="text-[11px] font-medium text-indigo-700 flex gap-2 items-start">
          <Info size={14} className="mt-0.5 flex-shrink-0" />
          Pour activer/désactiver les types de livraison (Domicile/Bureau), utilisez la section "Formulaire de Livraison" dans le menu principal.
        </p>
      </div>
    </div>
  );
};
