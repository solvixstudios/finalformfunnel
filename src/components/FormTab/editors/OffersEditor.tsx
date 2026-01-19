import { Tag } from "lucide-react";
import { useFormStore } from "../../../stores";

interface OffersEditorProps {
  setEditingSection: (section: string) => void;
}

export const OffersEditor = ({ setEditingSection }: OffersEditorProps) => {
  const formConfig = useFormStore((state) => state.formConfig);
  const setFormConfig = useFormStore((state) => state.setFormConfig);
  return (
    <div className="space-y-6">
      <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4 shadow-sm">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-white shadow-lg">
            <Tag size={20} />
          </div>
          <div>
            <h4 className="text-sm font-bold text-slate-800">
              Liste des Offres
            </h4>
            <p className="text-[10px] text-slate-400">
              Visibilité et affichage de la section offres
            </p>
          </div>
        </div>

        {/* Title Toggle */}
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
                  ...formConfig.sectionSettings,
                  offers: {
                    ...formConfig.sectionSettings?.offers,
                    showTitle: !formConfig.sectionSettings?.offers?.showTitle,
                  },
                },
              })
            }
            className={`w-12 h-6 rounded-full relative transition-colors ${formConfig.sectionSettings?.offers?.showTitle !== false ? "bg-indigo-600" : "bg-slate-200"}`}
          >
            <div
              className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform shadow ${formConfig.sectionSettings?.offers?.showTitle !== false ? "translate-x-6" : ""}`}
            />
          </button>
        </div>

        <div className="space-y-3">
          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">
            Texte du titre
          </label>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <span className="text-[9px] font-bold text-slate-400">
                Français
              </span>
              <input
                type="text"
                value={formConfig.translations.offers?.fr || ""}
                onChange={(e) =>
                  setFormConfig({
                    ...formConfig,
                    translations: {
                      ...formConfig.translations,
                      offers: {
                        ...formConfig.translations.offers,
                        fr: e.target.value,
                      },
                    },
                  })
                }
                className="w-full text-xs border border-slate-200 rounded-lg p-3 focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400 outline-none transition-all"
                placeholder="Choisissez votre offre"
              />
            </div>
            <div className="space-y-1">
              <span className="text-[9px] font-bold text-slate-400">
                العربية
              </span>
              <input
                type="text"
                dir="rtl"
                value={formConfig.translations.offers?.ar || ""}
                onChange={(e) =>
                  setFormConfig({
                    ...formConfig,
                    translations: {
                      ...formConfig.translations,
                      offers: {
                        ...formConfig.translations.offers,
                        ar: e.target.value,
                      },
                    },
                  })
                }
                className="w-full text-xs border border-slate-200 rounded-lg p-3 focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400 outline-none transition-all"
                placeholder="اختر عرضك"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
