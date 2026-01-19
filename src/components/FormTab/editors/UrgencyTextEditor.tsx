import { Zap } from "lucide-react";
import {
  URGENCY_COLOR_PRESETS,
  URGENCY_STYLE_PRESETS,
} from "../../../lib/constants";
import { useFormStore } from "../../../stores";

export const UrgencyTextEditor = () => {
  const formConfig = useFormStore((state) => state.formConfig);
  const setFormConfig = useFormStore((state) => state.setFormConfig);
  return (
    <div className="space-y-4">
      {" "}
      <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4 shadow-sm">
        {" "}
        <div className="flex items-center gap-3 mb-4">
          {" "}
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-white shadow-lg">
            {" "}
            <Zap size={20} />{" "}
          </div>{" "}
          <div>
            {" "}
            <h4 className="text-sm font-bold text-slate-800">
              Texte d'urgence
            </h4>{" "}
            <p className="text-[10px] text-slate-400">
              Message personnalisé pour créer l'urgence
            </p>{" "}
          </div>{" "}
        </div>{" "}
        <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
          {" "}
          <div>
            {" "}
            <span className="text-xs font-bold text-slate-700 block">
              Activer
            </span>{" "}
            <span className="text-[10px] text-slate-400">
              Affiche un message d'urgence animé
            </span>{" "}
          </div>{" "}
          <button
            onClick={() =>
              setFormConfig({
                ...formConfig,
                urgencyText: {
                  ...formConfig.urgencyText,
                  enabled: !formConfig.urgencyText?.enabled,
                },
              })
            }
            className={`w-12 h-6 rounded-full relative transition-colors ${formConfig.urgencyText?.enabled ? "bg-indigo-600" : "bg-slate-200"}`}
          >
            {" "}
            <div
              className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform shadow ${formConfig.urgencyText?.enabled ? "translate-x-6" : ""}`}
            />{" "}
          </button>{" "}
        </div>{" "}
        {formConfig.urgencyText?.enabled && (
          <div className="space-y-4">
            {" "}
            {/* Style Selector */}{" "}
            <div className="space-y-3">
              {" "}
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">
                Style d'affichage
              </label>{" "}
              <div className="grid grid-cols-4 gap-2">
                {" "}
                {URGENCY_STYLE_PRESETS.text.map((style) => (
                  <button
                    key={style.id}
                    onClick={() =>
                      setFormConfig({
                        ...formConfig,
                        urgencyText: {
                          ...formConfig.urgencyText,
                          style: style.id,
                        },
                      })
                    }
                    className={`p-2.5 rounded-xl border-2 flex flex-col items-center gap-1 transition-all ${(formConfig.urgencyText?.style || "banner") === style.id ? "border-indigo-500 bg-indigo-50 text-indigo-600" : "border-slate-200 bg-white text-slate-500 hover:border-slate-300"}`}
                  >
                    {" "}
                    <span className="text-[10px] font-bold">
                      {style.name}
                    </span>{" "}
                  </button>
                ))}{" "}
              </div>{" "}
            </div>{" "}
            {/* Color Preset Selector */}{" "}
            <div className="space-y-3">
              {" "}
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">
                Couleur
              </label>{" "}
              <div className="flex flex-wrap gap-2">
                {" "}
                {URGENCY_COLOR_PRESETS.filter((p) => p.id !== "dynamic").map(
                  (preset) => (
                    <button
                      key={preset.id}
                      onClick={() =>
                        setFormConfig({
                          ...formConfig,
                          urgencyText: {
                            ...formConfig.urgencyText,
                            colorPreset: preset.id,
                          },
                        })
                      }
                      className={`p-2 rounded-lg border-2 flex items-center gap-2 transition-all ${(formConfig.urgencyText?.colorPreset || "default") === preset.id ? "border-indigo-500 bg-indigo-50" : "border-slate-200 bg-white hover:border-slate-300"}`}
                    >
                      {" "}
                      {preset.id === "default" && (
                        <div
                          className="w-4 h-4 rounded-full border-2 border-dashed border-indigo-400"
                          style={{ backgroundColor: `${formConfig.accentColor}50` }}
                        />
                      )}{" "}
                      {preset.id !== "custom" && preset.id !== "default" && (
                        <div
                          className="w-4 h-4 rounded-full"
                          style={{ backgroundColor: preset.color }}
                        />
                      )}{" "}
                      {preset.id === "custom" && (
                        <div className="w-4 h-4 rounded-full bg-gradient-to-r from-pink-500 via-purple-500 to-blue-500" />
                      )}{" "}
                      <span className="text-[10px] font-bold text-slate-600">
                        {preset.name}
                      </span>{" "}
                    </button>
                  ),
                )}{" "}
              </div>{" "}
              {formConfig.urgencyText?.colorPreset === "custom" && (
                <input
                  type="color"
                  value={formConfig.urgencyText?.customColor || "#f59e0b"}
                  onChange={(e) =>
                    setFormConfig({
                      ...formConfig,
                      urgencyText: {
                        ...formConfig.urgencyText,
                        customColor: e.target.value,
                      },
                    })
                  }
                  className="w-full h-10 rounded-lg cursor-pointer border border-slate-200"
                />
              )}{" "}
            </div>{" "}
            {/* Text Inputs */}{" "}
            <div className="space-y-3">
              {" "}
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">
                Texte affiché
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
                    value={formConfig.urgencyText?.text?.fr || ""}
                    onChange={(e) =>
                      setFormConfig({
                        ...formConfig,
                        urgencyText: {
                          ...formConfig.urgencyText,
                          text: {
                            ...formConfig.urgencyText?.text,
                            fr: e.target.value,
                          },
                        },
                      })
                    }
                    className="w-full text-xs border border-slate-200 rounded-lg p-3 focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400 outline-none transition-all"
                    placeholder="⚡ Offre limitée!"
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
                    value={formConfig.urgencyText?.text?.ar || ""}
                    onChange={(e) =>
                      setFormConfig({
                        ...formConfig,
                        urgencyText: {
                          ...formConfig.urgencyText,
                          text: {
                            ...formConfig.urgencyText?.text,
                            ar: e.target.value,
                          },
                        },
                      })
                    }
                    className="w-full text-xs border border-slate-200 rounded-lg p-3 focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400 outline-none transition-all"
                    placeholder="⚡ عرض محدود!"
                  />{" "}
                </div>{" "}
              </div>{" "}
            </div>{" "}
          </div>
        )}{" "}
      </div>{" "}
    </div >
  );
};
