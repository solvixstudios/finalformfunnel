import { Info, LayoutGrid } from "lucide-react";
import { useFormStore } from "../../../stores";

export const VariantsEditor = () => {
  const formConfig = useFormStore((state) => state.formConfig);
  const setFormConfig = useFormStore((state) => state.setFormConfig);
  return (
    <div className="space-y-6">
      {" "}
      <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4 shadow-sm">
        {" "}
        <div className="flex items-center gap-3 mb-4">
          {" "}
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white shadow-lg">
            {" "}
            <LayoutGrid size={20} />{" "}
          </div>{" "}
          <div>
            {" "}
            <h4 className="text-sm font-bold text-slate-800">
              Variantes / Modèles
            </h4>{" "}
            <p className="text-[10px] text-slate-400">
              Configuration de la section variantes
            </p>{" "}
          </div>{" "}
        </div>{" "}
        {/* Title Toggle */}{" "}
        <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
          {" "}
          <div>
            {" "}
            <span className="text-xs font-bold text-slate-700 block">
              Afficher le titre
            </span>{" "}
            <span className="text-[10px] text-slate-400">
              Titre de la section dans le formulaire
            </span>{" "}
          </div>{" "}
          <button
            onClick={() =>
              setFormConfig({
                ...formConfig,
                sectionSettings: {
                  ...formConfig.sectionSettings,
                  variants: {
                    ...formConfig.sectionSettings?.variants,
                    showTitle: !formConfig.sectionSettings?.variants?.showTitle,
                  },
                },
              })
            }
            className={`w-12 h-6 rounded-full relative transition-colors ${formConfig.sectionSettings?.variants?.showTitle !== false ? "bg-indigo-600" : "bg-slate-200"}`}
          >
            {" "}
            <div
              className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform shadow ${formConfig.sectionSettings?.variants?.showTitle !== false ? "translate-x-6" : ""}`}
            />{" "}
          </button>{" "}
        </div>{" "}
        {/* Variant Style Selector */}{" "}
        <div className="space-y-3">
          {" "}
          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">
            Style d'affichage
          </label>{" "}
          <div className="grid grid-cols-3 gap-2">
            {" "}
            {[
              { id: "cards", label: "Cartes", icon: "▣" },
              { id: "buttons", label: "Liste (Check)", icon: "☑" },
              { id: "dropdown", label: "Menu", icon: "▼" },
            ].map((style) => (
              <button
                key={style.id}
                onClick={() =>
                  setFormConfig({ ...formConfig, variantStyle: style.id as any })
                }
                className={`p-3 rounded-xl border-2 flex flex-col items-center gap-1.5 transition-all ${formConfig.variantStyle === style.id || (!formConfig.variantStyle && style.id === "cards") ? "border-indigo-500 bg-indigo-50 text-indigo-600" : "border-slate-200 bg-white text-slate-500 hover:border-slate-300"}`}
              >
                {" "}
                <span className="text-lg">{style.icon}</span>{" "}
                <span className="text-[10px] font-bold">{style.label}</span>{" "}
              </button>
            ))}{" "}
          </div>{" "}
        </div>{" "}
        {/* Title Text */}{" "}
        <div className="space-y-3">
          {" "}
          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">
            Texte du titre
          </label>{" "}
          <div className="grid grid-cols-2 gap-3">
            {" "}
            <div className="space-y-1">
              {" "}
              <span className="text-[9px] font-bold text-slate-400">
                Français
              </span>{" "}
              <input
                type="text"
                value={formConfig.translations.variants?.fr || ""}
                onChange={(e) =>
                  setFormConfig({
                    ...formConfig,
                    translations: {
                      ...formConfig.translations,
                      variants: {
                        ...formConfig.translations.variants,
                        fr: e.target.value,
                      },
                    },
                  })
                }
                className="w-full text-xs border border-slate-200 rounded-lg p-3 focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400 outline-none transition-all"
                placeholder="Sélectionnez le modèle"
              />{" "}
            </div>{" "}
            <div className="space-y-1">
              {" "}
              <span className="text-[9px] font-bold text-slate-400">
                العربية
              </span>{" "}
              <input
                type="text"
                dir="rtl"
                value={formConfig.translations.variants?.ar || ""}
                onChange={(e) =>
                  setFormConfig({
                    ...formConfig,
                    translations: {
                      ...formConfig.translations,
                      variants: {
                        ...formConfig.translations.variants,
                        ar: e.target.value,
                      },
                    },
                  })
                }
                className="w-full text-xs border border-slate-200 rounded-lg p-3 focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400 outline-none transition-all"
                placeholder="اختر الموديل"
              />{" "}
            </div>{" "}
          </div>{" "}
        </div>{" "}
      </div>{" "}
      <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl">
        {" "}
        <p className="text-[11px] font-medium text-amber-700 flex gap-2 items-start">
          {" "}
          <Info size={14} className="mt-0.5 flex-shrink-0" /> Cette section
          affiche les variantes du produit Shopify. Les options sont
          automatiquement récupérées depuis votre boutique.{" "}
        </p>{" "}
      </div>{" "}
    </div>
  );
};
