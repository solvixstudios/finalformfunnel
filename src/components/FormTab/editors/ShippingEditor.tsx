import { Asterisk, Eye, EyeOff, Lock } from "lucide-react";
import { FIELD_LABELS } from "../../../lib/constants";
import { useFormStore } from "../../../stores";
import {
  getFieldsForCurrentMode,
  getLocationFieldsForPlaceholders,
} from "../utils/fieldHelpers";

interface ShippingEditorProps {
  handleLocationModeChangeWrapper: (mode: string) => void;
  handleUpdateField: (key: string, fieldProps: any) => void;
}

export const ShippingEditor = ({
  handleLocationModeChangeWrapper,
  handleUpdateField,
}: ShippingEditorProps) => {
  const formConfig = useFormStore((state) => state.formConfig);
  const setFormConfig = useFormStore((state) => state.setFormConfig);
  return (
    <div className="space-y-6">
      {/* Location Mode */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-6 shadow-sm">
        <div className="space-y-3">
          <label className="text-[10px] font-bold text-slate-500 uppercase">
            Mode de localisation
          </label>
          <div className="grid grid-cols-1 gap-2">
            {[
              {
                id: "double_dropdown",
                label: "Double Dropdowns (Wilaya + Commune)",
              },
              {
                id: "single_dropdown",
                label: "Single Dropdown (Wilaya Uniquement)",
              },
              { id: "free_text", label: "Adresse Libre (Texte)" },
            ].map((mode) => (
              <button
                key={mode.id}
                onClick={() => handleLocationModeChangeWrapper(mode.id)}
                className={`p-3 rounded-xl border text-left text-xs font-bold transition-all ${formConfig.locationInputMode === mode.id ? "border-indigo-600 bg-indigo-50 text-indigo-700" : "border-slate-200 hover:border-slate-300 text-slate-600"}`}
              >
                {mode.label}
              </button>
            ))}
          </div>
        </div>

        {formConfig.locationInputMode === "double_dropdown" && (
          <div className="space-y-3">
            <label className="text-[10px] font-bold text-slate-500 uppercase">
              Disposition Wilaya/Commune
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() =>
                  setFormConfig({ ...formConfig, locationLayout: "stacked" })
                }
                className={`p-3 rounded-xl border text-xs font-bold transition-all ${formConfig.locationLayout === "stacked" ? "border-indigo-600 bg-indigo-50 text-indigo-700" : "border-slate-200 hover:border-slate-300 text-slate-600"}`}
              >
                Empilé
              </button>
              <button
                onClick={() =>
                  setFormConfig({ ...formConfig, locationLayout: "sideBySide" })
                }
                className={`p-3 rounded-xl border text-xs font-bold transition-all ${formConfig.locationLayout === "sideBySide" ? "border-indigo-600 bg-indigo-50 text-indigo-700" : "border-slate-200 hover:border-slate-300 text-slate-600"}`}
              >
                Côte à côte
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Fields & Visibility */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-6 shadow-sm">
        <div className="space-y-3">
          <label className="text-[10px] font-bold text-slate-500 uppercase">
            Champs & Visibilité
          </label>
          <div className="space-y-2">
            {getFieldsForCurrentMode(formConfig).map(
              ([key, f]: any, idx: number) => {
                if (key === 'commune' && formConfig.locationInputMode === 'single_dropdown') return null;

                if (key === "location_block") {
                  const wilayaField = formConfig.fields.wilaya;
                  const communeField = formConfig.fields.commune;
                  const disableWilayaRequiredToggle = communeField?.required;
                  const disableCommuneVisible = !wilayaField.visible;
                  const disableCommuneRequired = !wilayaField.required;

                  return (
                    <div
                      key="location_block"
                      className="bg-slate-50 border border-slate-200 p-3 rounded-xl flex flex-col gap-3"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex-1">
                          <div className="text-[11px] font-bold text-slate-700 flex items-center gap-2">
                            Localisation
                            <span className="text-[9px] font-normal text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">
                              Groupe
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center justify-between pl-2 pr-1">
                        <span className="text-[10px] font-bold text-slate-500">
                          Wilaya
                        </span>
                        <div className="flex gap-1">
                          <button
                            disabled={disableWilayaRequiredToggle}
                            onClick={() =>
                              handleUpdateField("wilaya", {
                                required: !wilayaField.required,
                              })
                            }
                            className={`p-1.5 rounded border transition-all ${wilayaField.required ? "bg-amber-50 text-amber-600 border-amber-100" : "bg-white text-slate-300"} ${disableWilayaRequiredToggle ? "cursor-not-allowed opacity-50" : ""}`}
                            title="Requis"
                          >
                            <Asterisk size={12} strokeWidth={3} />
                          </button>
                          <button
                            onClick={() =>
                              handleUpdateField("wilaya", {
                                visible: !wilayaField.visible,
                              })
                            }
                            className={`p-1.5 rounded border transition-all ${wilayaField.visible ? "bg-indigo-50 text-indigo-600 border-indigo-100" : "bg-white text-slate-300"}`}
                          >
                            {wilayaField.visible ? (
                              <Eye size={12} />
                            ) : (
                              <EyeOff size={12} />
                            )}
                          </button>
                        </div>
                      </div>
                      <div
                        className={`flex items-center justify-between pl-2 pr-1 ${disableCommuneVisible ? "opacity-50" : ""}`}
                      >
                        <span className="text-[10px] font-bold text-slate-500">
                          Commune
                        </span>
                        <div className="flex gap-1">
                          <button
                            disabled={disableCommuneRequired}
                            onClick={() =>
                              handleUpdateField("commune", {
                                required: !communeField.required,
                              })
                            }
                            className={`p-1.5 rounded border transition-all ${communeField.required ? "bg-amber-50 text-amber-600 border-amber-100" : "bg-white text-slate-300"} ${disableCommuneRequired ? "cursor-not-allowed opacity-50" : ""}`}
                            title="Requis"
                          >
                            <Asterisk size={12} strokeWidth={3} />
                          </button>
                          <button
                            disabled={disableCommuneVisible}
                            onClick={() =>
                              handleUpdateField("commune", {
                                visible: !communeField.visible,
                              })
                            }
                            className={`p-1.5 rounded border transition-all ${communeField.visible ? "bg-indigo-50 text-indigo-600 border-indigo-100" : "bg-white text-slate-300"} ${disableCommuneVisible ? "cursor-not-allowed opacity-50" : ""}`}
                          >
                            {communeField.visible ? (
                              <Eye size={12} />
                            ) : (
                              <EyeOff size={12} />
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                }
                const isPhone = key === "phone";
                const isCommune = key === "commune";
                const isWilaya = key === "wilaya";
                const disableCommuneVisible =
                  !formConfig.fields.wilaya.visible ||
                  formConfig.locationInputMode !== "double_dropdown";
                const disableCommuneRequired =
                  !formConfig.fields.wilaya.required;
                const disableWilayaRequiredToggle =
                  formConfig.fields.commune?.required;

                return (
                  <div
                    key={key}
                    className={`bg-slate-50 border border-slate-200 p-3 rounded-xl flex items-center gap-3 ${isCommune && disableCommuneVisible ? "opacity-50" : ""}`}
                  >
                    <div className="flex-1">
                      <div className="text-[11px] font-bold text-slate-700">
                        {FIELD_LABELS[key]?.fr || key}
                      </div>
                    </div>
                    {isPhone ? (
                      <div className="flex items-center gap-1 bg-white text-slate-400 px-2 py-1 rounded text-[9px] font-bold uppercase tracking-wider border border-slate-100 shadow-sm">
                        <Lock size={10} /> Requis
                      </div>
                    ) : (
                      <>
                        <button
                          disabled={
                            isCommune
                              ? disableCommuneRequired
                              : isWilaya && disableWilayaRequiredToggle
                          }
                          onClick={() =>
                            handleUpdateField(key, { required: !f.required })
                          }
                          className={`p-1.5 rounded border transition-all ${f.required ? "bg-amber-50 text-amber-600 border-amber-100" : "bg-white text-slate-300"} ${(isCommune && disableCommuneRequired) || (isWilaya && disableWilayaRequiredToggle) ? "cursor-not-allowed opacity-50" : ""}`}
                          title="Requis"
                        >
                          <Asterisk size={12} strokeWidth={3} />
                        </button>
                        <button
                          disabled={isCommune && disableCommuneVisible}
                          onClick={() =>
                            handleUpdateField(key, { visible: !f.visible })
                          }
                          className={`p-1.5 rounded border transition-all ${f.visible ? "bg-indigo-50 text-indigo-600 border-indigo-100" : "bg-white text-slate-300"} ${isCommune && disableCommuneVisible ? "cursor-not-allowed opacity-50" : ""}`}
                        >
                          {f.visible ? <Eye size={12} /> : <EyeOff size={12} />}
                        </button>
                      </>
                    )}
                  </div>
                );
              },
            )}
          </div>
        </div>
        <div className="pt-4 border-t border-slate-100 space-y-4">
          <label className="text-[10px] font-bold text-slate-500 uppercase">
            Placeholders
          </label>
          {getLocationFieldsForPlaceholders(formConfig).map(([key, f]: any) => {
            if (key === 'commune' && formConfig.locationInputMode === 'single_dropdown') return null;
            return (
              <div key={key} className="space-y-2">
                <span className="text-[10px] font-bold text-slate-400">
                  {FIELD_LABELS[key]?.fr || key}
                </span>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    value={f.placeholder?.fr || ""}
                    onChange={(e) =>
                      setFormConfig({
                        ...formConfig,
                        fields: {
                          ...formConfig.fields,
                          [key]: {
                            ...f,
                            placeholder: { ...f.placeholder, fr: e.target.value },
                          },
                        },
                      })
                    }
                    className="text-[11px] border border-slate-200 rounded p-1.5"
                  />
                  <input
                    type="text"
                    value={f.placeholder?.ar || ""}
                    dir="rtl"
                    onChange={(e) =>
                      setFormConfig({
                        ...formConfig,
                        fields: {
                          ...formConfig.fields,
                          [key]: {
                            ...f,
                            placeholder: { ...f.placeholder, ar: e.target.value },
                          },
                        },
                      })
                    }
                    className="text-[11px] border border-slate-200 rounded p-1.5"
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
