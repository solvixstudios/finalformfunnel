import { Clock, Info } from "lucide-react";
import {
  URGENCY_COLOR_PRESETS,
  URGENCY_STYLE_PRESETS,
} from "../../../lib/constants";
import { useFormStore } from "../../../stores";

export const UrgencyTimerEditor = () => {
  const formConfig = useFormStore((state) => state.formConfig);
  const setFormConfig = useFormStore((state) => state.setFormConfig);
  return (
    <div className="space-y-4">
      {" "}
      <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4 shadow-sm">
        {" "}
        <div className="flex items-center gap-3 mb-4">
          {" "}
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-lg">
            {" "}
            <Clock size={20} />{" "}
          </div>{" "}
          <div>
            {" "}
            <h4 className="text-sm font-bold text-slate-800">
              Compte à Rebours
            </h4>{" "}
            <p className="text-[10px] text-slate-400">
              Timer d'urgence avec heures, minutes et secondes
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
              Affiche un compte à rebours
            </span>{" "}
          </div>{" "}
          <button
            onClick={() =>
              setFormConfig({
                ...formConfig,
                urgencyTimer: {
                  ...formConfig.urgencyTimer,
                  enabled: !formConfig.urgencyTimer?.enabled,
                },
              })
            }
            className={`w-12 h-6 rounded-full relative transition-colors ${formConfig.urgencyTimer?.enabled ? "bg-indigo-600" : "bg-slate-200"}`}
          >
            {" "}
            <div
              className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform shadow ${formConfig.urgencyTimer?.enabled ? "translate-x-6" : ""}`}
            />{" "}
          </button>{" "}
        </div>{" "}
        {formConfig.urgencyTimer?.enabled && (
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
                {URGENCY_STYLE_PRESETS.timer.map((style) => (
                  <button
                    key={style.id}
                    onClick={() =>
                      setFormConfig({
                        ...formConfig,
                        urgencyTimer: {
                          ...formConfig.urgencyTimer,
                          style: style.id,
                        },
                      })
                    }
                    className={`p-2.5 rounded-xl border-2 flex flex-col items-center gap-1 transition-all ${(formConfig.urgencyTimer?.style || "digital") === style.id ? "border-indigo-500 bg-indigo-50 text-indigo-600" : "border-slate-200 bg-white text-slate-500 hover:border-slate-300"}`}
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
                          urgencyTimer: {
                            ...formConfig.urgencyTimer,
                            colorPreset: preset.id,
                          },
                        })
                      }
                      className={`p-2 rounded-lg border-2 flex items-center gap-2 transition-all ${(formConfig.urgencyTimer?.colorPreset || "default") === preset.id ? "border-indigo-500 bg-indigo-50" : "border-slate-200 bg-white hover:border-slate-300"}`}
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
              {formConfig.urgencyTimer?.colorPreset === "custom" && (
                <input
                  type="color"
                  value={formConfig.urgencyTimer?.customColor || "#ef4444"}
                  onChange={(e) =>
                    setFormConfig({
                      ...formConfig,
                      urgencyTimer: {
                        ...formConfig.urgencyTimer,
                        customColor: e.target.value,
                      },
                    })
                  }
                  className="w-full h-10 rounded-lg cursor-pointer border border-slate-200"
                />
              )}{" "}
            </div>{" "}
            {/* Time Settings */}{" "}
            <div className="space-y-3">
              {" "}
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">
                Temps restant
              </label>{" "}
              <div className="grid grid-cols-3 gap-3">
                {" "}
                <div className="space-y-1">
                  {" "}
                  <span className="text-[9px] font-bold text-slate-400">
                    Heures
                  </span>{" "}
                  <input
                    type="number"
                    min="0"
                    max="72"
                    value={formConfig.urgencyTimer?.hours ?? 2}
                    onChange={(e) =>
                      setFormConfig({
                        ...formConfig,
                        urgencyTimer: {
                          ...formConfig.urgencyTimer,
                          hours: parseInt(e.target.value) || 0,
                        },
                      })
                    }
                    className="w-full text-xs border border-slate-200 rounded-lg p-3 font-bold text-center"
                  />{" "}
                </div>{" "}
                <div className="space-y-1">
                  {" "}
                  <span className="text-[9px] font-bold text-slate-400">
                    Minutes
                  </span>{" "}
                  <input
                    type="number"
                    min="0"
                    max="59"
                    value={formConfig.urgencyTimer?.minutes || 30}
                    onChange={(e) =>
                      setFormConfig({
                        ...formConfig,
                        urgencyTimer: {
                          ...formConfig.urgencyTimer,
                          minutes: parseInt(e.target.value),
                        },
                      })
                    }
                    className="w-full text-xs border border-slate-200 rounded-lg p-3 font-bold text-center"
                  />{" "}
                </div>{" "}
                <div className="space-y-1">
                  {" "}
                  <span className="text-[9px] font-bold text-slate-400">
                    Secondes
                  </span>{" "}
                  <input
                    type="number"
                    min="0"
                    max="59"
                    value={formConfig.urgencyTimer?.seconds || 0}
                    onChange={(e) =>
                      setFormConfig({
                        ...formConfig,
                        urgencyTimer: {
                          ...formConfig.urgencyTimer,
                          seconds: parseInt(e.target.value),
                        },
                      })
                    }
                    className="w-full text-xs border border-slate-200 rounded-lg p-3 font-bold text-center"
                  />{" "}
                </div>{" "}
              </div>{" "}
            </div>{" "}
            {/* Show Label Toggle */}{" "}
            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
              {" "}
              <span className="text-[11px] font-bold text-slate-600">
                Afficher le label
              </span>{" "}
              <button
                onClick={() =>
                  setFormConfig({
                    ...formConfig,
                    urgencyTimer: {
                      ...formConfig.urgencyTimer,
                      showLabel: !formConfig.urgencyTimer?.showLabel,
                    },
                  })
                }
                className={`w-10 h-5 rounded-full relative transition-colors ${formConfig.urgencyTimer?.showLabel !== false ? "bg-indigo-600" : "bg-slate-200"}`}
              >
                {" "}
                <div
                  className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full transition-transform shadow ${formConfig.urgencyTimer?.showLabel !== false ? "translate-x-5" : ""}`}
                />{" "}
              </button>{" "}
            </div>{" "}
            {/* Custom Text */}
            <div className="space-y-3">
              {" "}
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">
                Texte personnalisé (optionnel)
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
                    value={formConfig.urgencyTimer?.customText?.fr || ""}
                    onChange={(e) =>
                      setFormConfig({
                        ...formConfig,
                        urgencyTimer: {
                          ...formConfig.urgencyTimer,
                          customText: {
                            ...formConfig.urgencyTimer?.customText,
                            fr: e.target.value,
                          },
                        },
                      })
                    }
                    className="w-full text-xs border border-slate-200 rounded-lg p-3 focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400 outline-none transition-all"
                    placeholder="Laissez vide pour texte par défaut"
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
                    value={formConfig.urgencyTimer?.customText?.ar || ""}
                    onChange={(e) =>
                      setFormConfig({
                        ...formConfig,
                        urgencyTimer: {
                          ...formConfig.urgencyTimer,
                          customText: {
                            ...formConfig.urgencyTimer?.customText,
                            ar: e.target.value,
                          },
                        },
                      })
                    }
                    className="w-full text-xs border border-slate-200 rounded-lg p-3 focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400 outline-none transition-all"
                    placeholder="اتركه فارغاً للنص الافتراضي"
                  />{" "}
                </div>{" "}
              </div>{" "}
            </div>{" "}
          </div>
        )}{" "}
      </div>{" "}
      <div className="p-4 bg-indigo-50 border border-indigo-200 rounded-xl">
        {" "}
        <p className="text-[11px] font-medium text-indigo-700 flex gap-2 items-start">
          {" "}
          <Info size={14} className="mt-0.5 flex-shrink-0" /> Le style "Flip"
          offre un look premium avec un fond sombre. Le compte à rebours est
          affiché en temps réel dans le formulaire.{" "}
        </p>{" "}
      </div>{" "}
    </div>
  );
};
