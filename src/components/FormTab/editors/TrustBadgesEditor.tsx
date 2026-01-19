import { Check, Info, Shield } from "lucide-react";
import { useFormStore } from "../../../stores";

export const TrustBadgesEditor = () => {
  const formConfig = useFormStore((state) => state.formConfig);
  const setFormConfig = useFormStore((state) => state.setFormConfig);
  return (
    <div className="space-y-4">
      {" "}
      <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4 shadow-sm">
        {" "}
        <div className="flex items-center gap-3 mb-4">
          {" "}
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white shadow-lg">
            {" "}
            <Shield size={20} />{" "}
          </div>{" "}
          <div>
            {" "}
            <h4 className="text-sm font-bold text-slate-800">
              Badges de Confiance
            </h4>{" "}
            <p className="text-[10px] text-slate-400">
              Renforcez la confiance des clients
            </p>{" "}
          </div>{" "}
        </div>{" "}
        <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
          {" "}
          <div>
            {" "}
            <span className="text-xs font-bold text-slate-700 block">
              Afficher le titre
            </span>{" "}
            <span className="text-[10px] text-slate-400">
              Titre "Garanties" au-dessus des badges
            </span>{" "}
          </div>{" "}
          <button
            onClick={() =>
              setFormConfig({
                ...formConfig,
                sectionSettings: {
                  ...formConfig.sectionSettings,
                  trustBadges: {
                    ...formConfig.sectionSettings?.trustBadges,
                    showTitle:
                      !formConfig.sectionSettings?.trustBadges?.showTitle,
                  },
                },
              })
            }
            className={`w-12 h-6 rounded-full relative transition-colors ${formConfig.sectionSettings?.trustBadges?.showTitle !== false ? "bg-indigo-600" : "bg-slate-200"}`}
          >
            {" "}
            <div
              className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform shadow ${formConfig.sectionSettings?.trustBadges?.showTitle !== false ? "translate-x-6" : ""}`}
            />{" "}
          </button>{" "}
        </div>{" "}
      </div>{" "}
      {/* Style Selector */}{" "}
      <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4 shadow-sm">
        {" "}
        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">
          Style d'affichage
        </label>{" "}
        <div className="grid grid-cols-2 gap-3">
          {" "}
          {[
            {
              id: "cards",
              name: "Cartes",
              desc: "Grille 2 colonnes",
              preview: (
                <div className="flex gap-1">
                  <div className="w-6 h-6 rounded bg-gradient-to-br from-slate-100 to-slate-50 border border-slate-200/50" />
                  <div className="w-6 h-6 rounded bg-gradient-to-br from-slate-100 to-slate-50 border border-slate-200/50" />
                </div>
              ),
            },
            {
              id: "pills",
              name: "Pilules",
              desc: "Badges arrondis",
              preview: (
                <div className="flex gap-1">
                  <div className="px-2 py-1 rounded-full bg-emerald-100 text-[8px]">✓</div>
                  <div className="px-2 py-1 rounded-full bg-blue-100 text-[8px]">✓</div>
                </div>
              ),
            },
            {
              id: "minimal",
              name: "Minimal",
              desc: "Liste à cocher",
              preview: (
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 rounded-full bg-emerald-400" />
                    <div className="w-8 h-1.5 rounded bg-slate-100" />
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 rounded-full bg-emerald-400" />
                    <div className="w-6 h-1.5 rounded bg-slate-100" />
                  </div>
                </div>
              ),
            },
            {
              id: "banner",
              name: "Bannière",
              desc: "Fond coloré",
              preview: (
                <div className="w-full h-6 rounded bg-gradient-to-r from-indigo-50 to-purple-50 flex items-center justify-center">
                  <div className="flex gap-2">
                    <div className="w-3 h-3 rounded bg-indigo-200" />
                    <div className="w-3 h-3 rounded bg-purple-200" />
                  </div>
                </div>
              ),
            },
            {
              id: "lines",
              name: "Lignes",
              desc: "Liste verticale",
              preview: (
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-3 rounded-full bg-emerald-200" />
                    <div className="w-10 h-2 rounded bg-slate-100" />
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-3 rounded-full bg-blue-200" />
                    <div className="w-8 h-2 rounded bg-slate-100" />
                  </div>
                </div>
              ),
            },
            {
              id: "compactLines",
              name: "Compact",
              desc: "Ligne horizontale",
              preview: (
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 rounded-full bg-emerald-200" />
                  <div className="w-1 h-1 rounded-full bg-slate-300" />
                  <div className="w-3 h-3 rounded-full bg-amber-200" />
                  <div className="w-1 h-1 rounded-full bg-slate-300" />
                  <div className="w-3 h-3 rounded-full bg-violet-200" />
                </div>
              ),
            },
          ].map((style) => (

            <button
              key={style.id}
              onClick={() =>
                setFormConfig({ ...formConfig, trustBadgeStyle: style.id as typeof formConfig.trustBadgeStyle })
              }
              className={`relative p-4 rounded-xl border-2 text-left transition-all duration-200 hover:shadow-md ${(formConfig.trustBadgeStyle || "cards") === style.id ? "border-indigo-500 bg-indigo-50/50 shadow-sm" : "border-slate-200 bg-white hover:border-slate-300"}`}
            >
              {" "}
              <div className="mb-3 h-8 flex items-center">
                {" "}
                {style.preview}{" "}
              </div>{" "}
              <span className="text-xs font-bold text-slate-700 block">
                {style.name}
              </span>{" "}
              <span className="text-[9px] text-slate-400">{style.desc}</span>{" "}
              {(formConfig.trustBadgeStyle || "cards") === style.id && (
                <div className="absolute top-2 right-2 w-4 h-4 rounded-full bg-indigo-500 flex items-center justify-center">
                  {" "}
                  <Check size={10} className="text-white" />{" "}
                </div>
              )}{" "}
            </button>
          ))}{" "}
        </div>{" "}
      </div>{" "}
      <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4 shadow-sm">
        {" "}
        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">
          Badges disponibles
        </label>{" "}
        <div className="space-y-2">
          {" "}
          {[
            {
              key: "cod",
              icon: "💵",
              label: "Paiement à la livraison",
              color: "#10b981",
            },
            {
              key: "guarantee",
              icon: "✓",
              label: "Garantie qualité",
              color: "#3b82f6",
            },
            {
              key: "return",
              icon: "↩",
              label: "Retour facile",
              color: "#f59e0b",
            },
            {
              key: "support",
              icon: "🎧",
              label: "Support 24/7",
              color: "#8b5cf6",
            },
            {
              key: "fastDelivery",
              icon: "🚚",
              label: "Livraison rapide",
              color: "#6366f1",
            },
          ].map((badge) => {
            const badgeConfig = formConfig.trustBadges?.[badge.key as keyof typeof formConfig.trustBadges];
            return (
              <div key={badge.key} className="space-y-2">
                <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                  {" "}
                  <div className="flex items-center gap-3">
                    {" "}
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-sm"
                      style={{
                        backgroundColor: `${badge.color}15`,
                        color: badge.color,
                      }}
                    >
                      {" "}
                      {badge.icon}{" "}
                    </div>{" "}
                    <span className="text-xs font-bold text-slate-700">
                      {badge.label}
                    </span>{" "}
                  </div>{" "}
                  <button
                    onClick={() =>
                      setFormConfig({
                        ...formConfig,
                        trustBadges: {
                          ...formConfig.trustBadges,
                          [badge.key]: {
                            ...badgeConfig,
                            enabled: !badgeConfig?.enabled,
                          },
                        },
                      })
                    }
                    className={`w-10 h-5 rounded-full relative transition-colors ${badgeConfig?.enabled ? "bg-indigo-600" : "bg-slate-200"}`}
                  >
                    {" "}
                    <div
                      className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full transition-transform shadow ${badgeConfig?.enabled ? "translate-x-5" : ""}`}
                    />{" "}
                  </button>{" "}
                </div>
                {badgeConfig?.enabled && (
                  <div className="p-3 bg-white border border-slate-200 rounded-xl space-y-2">
                    <label className="text-[9px] font-bold text-slate-500 uppercase">
                      Texte personnalisé (optionnel)
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="text"
                        value={badgeConfig?.customText?.fr || ""}
                        onChange={(e) =>
                          setFormConfig({
                            ...formConfig,
                            trustBadges: {
                              ...formConfig.trustBadges,
                              [badge.key]: {
                                ...badgeConfig,
                                customText: {
                                  ...badgeConfig?.customText,
                                  fr: e.target.value,
                                },
                              },
                            },
                          })
                        }
                        className="w-full text-xs border border-slate-200 rounded-lg p-2 focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400 outline-none"
                        placeholder="Laissez vide pour texte par défaut"
                      />
                      <input
                        type="text"
                        dir="rtl"
                        value={badgeConfig?.customText?.ar || ""}
                        onChange={(e) =>
                          setFormConfig({
                            ...formConfig,
                            trustBadges: {
                              ...formConfig.trustBadges,
                              [badge.key]: {
                                ...badgeConfig,
                                customText: {
                                  ...badgeConfig?.customText,
                                  ar: e.target.value,
                                },
                              },
                            },
                          })
                        }
                        className="w-full text-xs border border-slate-200 rounded-lg p-2 focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400 outline-none"
                        placeholder="اتركه فارغاً للنص الافتراضي"
                      />
                    </div>
                  </div>
                )}
              </div>
            );
          })}{" "}
        </div>{" "}
      </div>{" "}
      <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4 shadow-sm">
        {" "}
        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">
          Titre de la section
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
              value={formConfig.translations?.trustTitle?.fr || ""}
              onChange={(e) =>
                setFormConfig({
                  ...formConfig,
                  translations: {
                    ...formConfig.translations,
                    trustTitle: {
                      ...formConfig.translations?.trustTitle,
                      fr: e.target.value,
                    },
                  },
                })
              }
              className="w-full text-xs border border-slate-200 rounded-lg p-3 focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400 outline-none transition-all"
              placeholder="Garanties"
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
              value={formConfig.translations?.trustTitle?.ar || ""}
              onChange={(e) =>
                setFormConfig({
                  ...formConfig,
                  translations: {
                    ...formConfig.translations,
                    trustTitle: {
                      ...formConfig.translations?.trustTitle,
                      ar: e.target.value,
                    },
                  },
                })
              }
              className="w-full text-xs border border-slate-200 rounded-lg p-3 focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400 outline-none transition-all"
              placeholder="الضمانات"
            />{" "}
          </div>{" "}
        </div>{" "}
      </div>{" "}
      <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl">
        {" "}
        <p className="text-[11px] font-medium text-emerald-700 flex gap-2 items-start">
          {" "}
          <Info size={14} className="mt-0.5 flex-shrink-0" /> Les badges de
          confiance s'affichent dans une grille avec des icônes colorées. Ils
          rassurent les clients sur la qualité de votre service.{" "}
        </p>{" "}
      </div>{" "}
    </div>
  );
};
