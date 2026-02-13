import { Check, Code, Layers, Palette, Sparkles, Square, Type } from "lucide-react";
import { useState } from "react";
import { PRESET_CATEGORIES, THEME_PRESETS } from "../../../lib/themePresets";
import { useFormStore } from "../../../stores";
import { CollapsibleSection } from "../components/CollapsibleSection";

// Helper function to calculate if background is dark
const isDarkBackground = (hex: string): boolean => {
  if (!hex || hex.length < 7) return false;
  try {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    const brightness = (r * 299 + g * 587 + b * 114) / 1000;
    return brightness < 128;
  } catch {
    return false;
  }
};

// Helper to get appropriate text color based on background
const getTextColorForBackground = (bgHex: string): string => {
  return isDarkBackground(bgHex) ? '#f1f5f9' : '#1e293b';
};

// Helper to get appropriate heading color based on background
const getHeadingColorForBackground = (bgHex: string): string => {
  return isDarkBackground(bgHex) ? '#ffffff' : '#0f172a';
};



// Color Picker Component
const ColorPicker = ({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) => (
  <div className="space-y-2">
    <label className="text-[10px] font-bold text-slate-500 uppercase">
      {label}
    </label>
    <div className="flex gap-2">
      <input
        type="color"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-10 h-10 rounded-lg border-0 cursor-pointer"
      />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="flex-1 text-[11px] font-mono border border-slate-200 rounded-lg px-3"
      />
    </div>
  </div>
);

// Slider Component
const SliderControl = ({
  label,
  value,
  onChange,
  min = 0,
  max = 40,
  unit = "px",
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  unit?: string;
}) => (
  <div className="space-y-2">
    <div className="flex justify-between">
      <label className="text-[10px] font-bold text-slate-500 uppercase">
        {label}
      </label>
      <span className="text-[10px] font-bold text-slate-700">
        {value}{unit}
      </span>
    </div>
    <div className="flex gap-2 items-center">
      <input
        type="range"
        min={min}
        max={max}
        step="1"
        value={value}
        onChange={(e) => onChange(parseInt(e.target.value))}
        className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-indigo-600"
      />
      <input
        type="number"
        min={min}
        max={100}
        value={value}
        onChange={(e) => onChange(parseInt(e.target.value))}
        className="w-12 text-xs border border-slate-200 rounded p-1 text-center font-bold"
      />
    </div>
  </div>
);

export const GlobalDesignEditor = () => {
  const formConfig = useFormStore((state) => state.formConfig);
  const setFormConfig = useFormStore((state) => state.setFormConfig);
  const [presetCategory, setPresetCategory] = useState<string | null>(null);

  // Get presets for selected category or all if none selected
  const filteredPresets = presetCategory
    ? THEME_PRESETS.filter(p => p.category === presetCategory)
    : THEME_PRESETS;

  return (
    <div className="space-y-4">
      <h3 className="text-[10px] font-black uppercase text-slate-400 tracking-widest flex items-center gap-2 px-1">
        <Palette size={14} /> Personnalisation Visuelle
      </h3>

      {/* ===== PRESETS SECTION ===== */}
      <CollapsibleSection title="Préréglages de Thème" icon={Sparkles}>
        {/* Category Filter */}
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => setPresetCategory(null)}
            className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all ${presetCategory === null
              ? 'bg-indigo-600 text-white'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
          >
            Tous
          </button>
          {Object.entries(PRESET_CATEGORIES).map(([key, cat]) => (
            <button
              key={key}
              onClick={() => setPresetCategory(key)}
              className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all ${presetCategory === key
                ? 'bg-indigo-600 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Presets Grid */}
        <div className="grid grid-cols-3 gap-2 max-h-[280px] overflow-y-auto custom-scroll pr-1">
          {filteredPresets.map((preset) => {
            const isActive =
              formConfig.accentColor === preset.accentColor &&
              formConfig.ctaColor === preset.ctaColor &&
              formConfig.formBackground === preset.formBackground;

            return (
              <button
                key={preset.id}
                onClick={() =>
                  setFormConfig({
                    ...formConfig,
                    accentColor: preset.accentColor,
                    ctaColor: preset.ctaColor,
                    formBackground: preset.formBackground,
                    textColor: preset.textColor,
                    headingColor: preset.headingColor,
                    borderRadius: preset.borderRadius,
                    inputBackground: preset.inputBackground || '#f8fafc',
                    inputBorderColor: preset.inputBorderColor || '#e2e8f0',
                    inputTextColor: preset.inputTextColor || '#1e293b',
                    inputPlaceholderColor: preset.inputPlaceholderColor || '#94a3b8',
                    cardBackground: preset.cardBackground || '#f8fafc',
                    cardBorderColor: preset.cardBorderColor || '#e2e8f0',
                  })
                }
                className={`p-2.5 rounded-xl border-2 transition-all flex flex-col items-center gap-2 ${isActive
                  ? "border-indigo-500 bg-indigo-50 ring-2 ring-indigo-200"
                  : "border-slate-100 hover:border-slate-300"
                  }`}
              >
                {/* Preview Card */}
                <div
                  className="w-full h-14 rounded-lg border shadow-sm flex items-center justify-center gap-1.5 p-2"
                  style={{
                    backgroundColor: preset.formBackground,
                    borderColor: preset.cardBorderColor || '#e2e8f0'
                  }}
                >
                  <div
                    className="w-5 h-5 rounded-full shadow-sm"
                    style={{ backgroundColor: preset.accentColor }}
                  />
                  <div
                    className="w-8 h-4 rounded shadow-sm"
                    style={{ backgroundColor: preset.ctaColor }}
                  />
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-[9px] font-bold text-slate-600 truncate">
                    {preset.name}
                  </span>
                  {isActive && <Check size={10} className="text-indigo-600 flex-shrink-0" />}
                </div>
              </button>
            );
          })}
        </div>
      </CollapsibleSection>

      {/* ===== COLORS SECTION (All colors consolidated here) ===== */}
      <CollapsibleSection title="Couleurs" icon={Palette}>
        {/* Main Colors */}
        <div className="space-y-1">
          <h5 className="text-[9px] font-bold text-slate-400 uppercase tracking-wide">Couleurs Principales</h5>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <ColorPicker
            label="Couleur Accent"
            value={formConfig.accentColor}
            onChange={(val) => setFormConfig({ ...formConfig, accentColor: val })}
          />
          <ColorPicker
            label="Couleur CTA"
            value={formConfig.ctaColor}
            onChange={(val) => setFormConfig({ ...formConfig, ctaColor: val })}
          />
        </div>

        {/* Form Background with auto-adjust */}
        <div className="space-y-2">
          <label className="text-[10px] font-bold text-slate-500 uppercase">
            Fond du formulaire
          </label>
          <div className="flex gap-2">
            <input
              type="color"
              value={formConfig.formBackground || "#ffffff"}
              onChange={(e) => {
                const newBg = e.target.value;
                const isDark = isDarkBackground(newBg);
                setFormConfig({
                  ...formConfig,
                  formBackground: newBg,
                  textColor: isDark ? getTextColorForBackground(newBg) : (formConfig.textColor || '#1e293b'),
                  headingColor: isDark ? getHeadingColorForBackground(newBg) : (formConfig.headingColor || '#0f172a'),
                });
              }}
              className="w-10 h-10 rounded-lg border-0 cursor-pointer"
            />
            <input
              type="text"
              value={formConfig.formBackground || "#ffffff"}
              onChange={(e) => {
                const newBg = e.target.value;
                if (/^#[0-9A-Fa-f]{6}$/.test(newBg)) {
                  const isDark = isDarkBackground(newBg);
                  setFormConfig({
                    ...formConfig,
                    formBackground: newBg,
                    textColor: isDark ? getTextColorForBackground(newBg) : (formConfig.textColor || '#1e293b'),
                    headingColor: isDark ? getHeadingColorForBackground(newBg) : (formConfig.headingColor || '#0f172a'),
                  });
                } else {
                  setFormConfig({ ...formConfig, formBackground: newBg });
                }
              }}
              className="flex-1 text-[11px] font-mono border border-slate-200 rounded-lg px-3"
            />
          </div>
          <p className="text-[9px] text-slate-400">
            Les couleurs de texte s'ajustent automatiquement pour la lisibilité
          </p>
        </div>

        {/* Text Colors */}
        <div className="grid grid-cols-2 gap-4">
          <ColorPicker
            label="Couleur Texte"
            value={formConfig.textColor || "#1e293b"}
            onChange={(val) => setFormConfig({ ...formConfig, textColor: val })}
          />
          <ColorPicker
            label="Couleur Titres"
            value={formConfig.headingColor || "#0f172a"}
            onChange={(val) => setFormConfig({ ...formConfig, headingColor: val })}
          />
        </div>

        {/* Input Colors */}
        <div className="pt-3 border-t border-slate-100 space-y-3">
          <h5 className="text-[9px] font-bold text-slate-400 uppercase tracking-wide">Couleurs des Champs</h5>
          <div className="grid grid-cols-2 gap-4">
            <ColorPicker
              label="Fond Champ"
              value={formConfig.inputBackground || "#f8fafc"}
              onChange={(val) => setFormConfig({ ...formConfig, inputBackground: val })}
            />
            <ColorPicker
              label="Bordure Champ"
              value={formConfig.inputBorderColor || "#e2e8f0"}
              onChange={(val) => setFormConfig({ ...formConfig, inputBorderColor: val })}
            />
            <ColorPicker
              label="Texte Champ"
              value={formConfig.inputTextColor || "#1e293b"}
              onChange={(val) => setFormConfig({ ...formConfig, inputTextColor: val })}
            />
            <ColorPicker
              label="Placeholder"
              value={formConfig.inputPlaceholderColor || "#94a3b8"}
              onChange={(val) => setFormConfig({ ...formConfig, inputPlaceholderColor: val })}
            />
          </div>
        </div>

        {/* Card Colors */}
        <div className="pt-3 border-t border-slate-100 space-y-3">
          <h5 className="text-[9px] font-bold text-slate-400 uppercase tracking-wide">Couleurs des Cartes</h5>
          <div className="grid grid-cols-2 gap-4">
            <ColorPicker
              label="Fond Carte"
              value={formConfig.cardBackground || "#f8fafc"}
              onChange={(val) => setFormConfig({ ...formConfig, cardBackground: val })}
            />
            <ColorPicker
              label="Bordure Carte"
              value={formConfig.cardBorderColor || "#e2e8f0"}
              onChange={(val) => setFormConfig({ ...formConfig, cardBorderColor: val })}
            />
          </div>
        </div>
      </CollapsibleSection>

      {/* ===== SPACING SECTION ===== */}
      <CollapsibleSection title="Espacement" icon={Layers}>
        <SliderControl
          label="Marge entre sections"
          value={formConfig.sectionSpacing || 16}
          onChange={(val) => setFormConfig({ ...formConfig, sectionSpacing: val })}
        />
        <SliderControl
          label="Padding interne"
          value={formConfig.sectionPadding || 16}
          onChange={(val) => setFormConfig({ ...formConfig, sectionPadding: val })}
        />
        <SliderControl
          label="Espacement entre champs"
          value={formConfig.inputSpacing || 12}
          onChange={(val) => setFormConfig({ ...formConfig, inputSpacing: val })}
          max={30}
        />
        <div className="grid grid-cols-2 gap-4">
          <SliderControl
            label="Marge supérieure"
            value={formConfig.sectionMarginTop || 0}
            onChange={(val) => setFormConfig({ ...formConfig, sectionMarginTop: val })}
          />
          <SliderControl
            label="Marge inférieure"
            value={formConfig.sectionMarginBottom || 0}
            onChange={(val) => setFormConfig({ ...formConfig, sectionMarginBottom: val })}
          />
        </div>
      </CollapsibleSection>

      {/* ===== FONTS SECTION ===== */}
      <CollapsibleSection title="Typographie" icon={Type}>
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-slate-500 uppercase">
              Police Français (Google Fonts)
            </label>
            <select
              value={formConfig.fontFamily?.fr || "Inter"}
              onChange={(e) =>
                setFormConfig({
                  ...formConfig,
                  fontFamily: {
                    ...(formConfig.fontFamily as any || { fr: "Inter", ar: "Cairo" }),
                    fr: e.target.value
                  }
                })
              }
              className="w-full text-xs border border-slate-200 rounded-lg p-2.5 font-bold"
            >
              <option value="Inter">Inter</option>
              <option value="Roboto">Roboto</option>
              <option value="Open Sans">Open Sans</option>
              <option value="Poppins">Poppins</option>
              <option value="Montserrat">Montserrat</option>
              <option value="Outfit">Outfit</option>
              <option value="DM Sans">DM Sans</option>
              <option value="Plus Jakarta Sans">Plus Jakarta Sans</option>
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-slate-500 uppercase">
              Police العربية (Google Fonts)
            </label>
            <select
              value={formConfig.fontFamily?.ar || "Cairo"}
              onChange={(e) =>
                setFormConfig({
                  ...formConfig,
                  fontFamily: {
                    ...(formConfig.fontFamily as any || { fr: "Inter", ar: "Cairo" }),
                    ar: e.target.value
                  }
                })
              }
              className="w-full text-xs border border-slate-200 rounded-lg p-2.5 font-bold"
            >
              <option value="Cairo">Cairo</option>
              <option value="Tajawal">Tajawal</option>
              <option value="Almarai">Almarai</option>
              <option value="Amiri">Amiri</option>
              <option value="Noto Sans Arabic">Noto Sans Arabic</option>
              <option value="IBM Plex Sans Arabic">IBM Plex Sans Arabic</option>
            </select>
          </div>
        </div>
      </CollapsibleSection>

      {/* ===== INPUTS SECTION (Style only, no colors) ===== */}
      <CollapsibleSection title="Style des Champs" icon={Square}>
        <div className="space-y-2">
          <label className="text-[10px] font-bold text-slate-500 uppercase">
            Style Champs
          </label>
          <select
            value={formConfig.inputVariant}
            onChange={(e) =>
              setFormConfig({ ...formConfig, inputVariant: e.target.value as any })
            }
            className="w-full text-xs border border-slate-200 rounded-lg p-2.5 font-bold"
          >
            <option value="filled">Rempli (Fond Gris)</option>
            <option value="outlined">Contour (Fond Blanc)</option>
          </select>
        </div>

        <div className="space-y-2">
          <label className="text-[10px] font-bold text-slate-500 uppercase">
            Bords (Radius)
          </label>
          <select
            value={formConfig.borderRadius}
            onChange={(e) =>
              setFormConfig({ ...formConfig, borderRadius: e.target.value })
            }
            className="w-full text-xs border border-slate-200 rounded-lg p-2.5 font-bold"
          >
            <option value="0px">Carré (0px)</option>
            <option value="8px">Doux (8px)</option>
            <option value="14px">Arrondi (14px)</option>
            <option value="20px">Très Arrondi (20px)</option>
            <option value="24px">Extra Arrondi (24px)</option>
          </select>
        </div>
      </CollapsibleSection>

      {/* ===== EMBEDDING SETTINGS SECTION ===== */}
      <CollapsibleSection title="Réglages d'Intégration" icon={Code}>
        <div className="space-y-4">
          <div className="flex items-start justify-between gap-4 p-1">
            <div className="space-y-1 flex-1">
              <label className="text-[10px] font-bold text-slate-500 uppercase flex items-center gap-2">
                Nettoyage Automatique du Thème
                <span className="bg-indigo-100 text-indigo-600 px-1.5 py-0.5 rounded text-[9px] font-black tracking-wide">
                  RECOMMANDÉ
                </span>
              </label>
              <p className="text-[10px] text-slate-400 leading-relaxed">
                Masque automatiquement les éléments natifs du thème Shopify (Titre, Prix, Variantes, Boutons, etc.) pour éviter les doublons avec le formulaire.
              </p>
            </div>
            <div className="flex items-center">
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  className="sr-only peer"
                  checked={formConfig.autoHideThemeElements ?? true}
                  onChange={(e) => setFormConfig({ ...formConfig, autoHideThemeElements: e.target.checked })}
                />
                <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600"></div>
              </label>
            </div>
          </div>
        </div>
      </CollapsibleSection>

    </div>
  );
};
