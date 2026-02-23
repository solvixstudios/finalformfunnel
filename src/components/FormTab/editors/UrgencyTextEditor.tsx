import { Zap, Sparkles, Flame, Info } from "lucide-react";
import {
  URGENCY_COLOR_PRESETS,
  URGENCY_STYLE_PRESETS,
} from "../../../lib/constants";
import { useFormStore } from "../../../stores";


/** Mini style preview icons */
const STYLE_ICONS: Record<string, React.ReactNode> = {
  banner: <Zap size={14} />,
  pill: <Sparkles size={14} />,
  glow: <Flame size={14} />,
  minimal: <Info size={14} />,
};

export const UrgencyTextEditor = () => {
  const formConfig = useFormStore((state) => state.formConfig);
  const setFormConfig = useFormStore((state) => state.setFormConfig);

  const update = (patch: Record<string, unknown>) =>
    setFormConfig({
      ...formConfig,
      urgencyText: { ...formConfig.urgencyText, ...patch },
    });

  const currentStyle = formConfig.urgencyText?.style || "banner";
  const currentColor = formConfig.urgencyText?.colorPreset || "default";

  return (
    <div className="space-y-4">
      {/* ── Header ── */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-white shadow-lg">
            <Zap size={20} />
          </div>
          <div>
            <h4 className="text-sm font-bold text-slate-800">
              Texte d'urgence
            </h4>
            <p className="text-[10px] text-slate-400">
              Message personnalisé pour créer l'urgence
            </p>
          </div>
        </div>

        {/* Enable toggle */}
        <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
          <div>
            <span className="text-xs font-bold text-slate-700 block">
              Activer
            </span>
            <span className="text-[10px] text-slate-400">
              Affiche un message d'urgence animé
            </span>
          </div>
          <button
            onClick={() => update({ enabled: !formConfig.urgencyText?.enabled })}
            className={`w-12 h-6 rounded-full relative transition-colors ${formConfig.urgencyText?.enabled ? "bg-indigo-600" : "bg-slate-200"}`}
          >
            <div
              className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform shadow ${formConfig.urgencyText?.enabled ? "translate-x-6" : ""}`}
            />
          </button>
        </div>
      </div>

      {formConfig.urgencyText?.enabled && (
        <>
          {/* ── Style Selector ── */}
          <div className="bg-white border border-slate-200 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="text-slate-400" size={16} />
              <span className="text-xs font-bold text-slate-700">Style d'affichage</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {URGENCY_STYLE_PRESETS.text.map((style) => (
                <button
                  key={style.id}
                  onClick={() => update({ style: style.id })}
                  className={`p-3 rounded-xl border-2 flex items-center gap-2.5 transition-all ${currentStyle === style.id
                    ? "border-indigo-500 bg-indigo-50 text-indigo-600"
                    : "border-slate-200 bg-white text-slate-500 hover:border-slate-300"
                    }`}
                >
                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${currentStyle === style.id ? "bg-indigo-100" : "bg-slate-100"
                    }`}>
                    {STYLE_ICONS[style.id] || <Zap size={14} />}
                  </div>
                  <span className="text-[11px] font-bold">
                    {style.name}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* ── Color Selector ── */}
          <div className="bg-white border border-slate-200 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <Zap className="text-slate-400" size={16} />
              <span className="text-xs font-bold text-slate-700">Couleur</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {URGENCY_COLOR_PRESETS.filter((p) => p.id !== "dynamic").map(
                (preset) => (
                  <button
                    key={preset.id}
                    onClick={() => update({ colorPreset: preset.id })}
                    className={`p-2.5 rounded-xl border-2 flex items-center gap-2 transition-all ${currentColor === preset.id
                      ? "border-indigo-500 bg-indigo-50"
                      : "border-slate-200 bg-white hover:border-slate-300"
                      }`}
                  >
                    {preset.id === "default" && (
                      <div
                        className="w-5 h-5 rounded-full border-2 border-dashed border-indigo-400"
                        style={{ backgroundColor: `${formConfig.accentColor}50` }}
                      />
                    )}
                    {preset.id !== "custom" && preset.id !== "default" && (
                      <div
                        className="w-5 h-5 rounded-full shadow-sm"
                        style={{ backgroundColor: preset.color }}
                      />
                    )}
                    {preset.id === "custom" && (
                      <div className="w-5 h-5 rounded-full bg-gradient-to-r from-pink-500 via-purple-500 to-blue-500" />
                    )}
                    <span className="text-[10px] font-bold text-slate-600">
                      {preset.name}
                    </span>
                  </button>
                ),
              )}
            </div>
            {formConfig.urgencyText?.colorPreset === "custom" && (
              <input
                type="color"
                value={formConfig.urgencyText?.customColor || "#f59e0b"}
                onChange={(e) => update({ customColor: e.target.value })}
                className="w-full h-10 rounded-lg cursor-pointer border border-slate-200 mt-3"
              />
            )}
          </div>

          {/* ── Text Inputs ── */}
          <div className="bg-white border border-slate-200 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <Zap className="text-slate-400" size={16} />
              <span className="text-xs font-bold text-slate-700">Texte affiché</span>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wide">
                  Français
                </span>
                <input
                  type="text"
                  value={formConfig.urgencyText?.text?.fr || ""}
                  onChange={(e) =>
                    update({
                      text: {
                        ...formConfig.urgencyText?.text,
                        fr: e.target.value,
                      },
                    })
                  }
                  className="w-full text-xs border border-slate-200 rounded-lg p-3 focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400 outline-none transition-all"
                  placeholder="⚡ Offre limitée!"
                />
              </div>
              <div className="space-y-1.5">
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wide">
                  العربية
                </span>
                <input
                  type="text"
                  dir="rtl"
                  value={formConfig.urgencyText?.text?.ar || ""}
                  onChange={(e) =>
                    update({
                      text: {
                        ...formConfig.urgencyText?.text,
                        ar: e.target.value,
                      },
                    })
                  }
                  className="w-full text-xs border border-slate-200 rounded-lg p-3 focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400 outline-none transition-all"
                  placeholder="⚡ عرض محدود!"
                />
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
