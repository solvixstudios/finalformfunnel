/**
 * Summary Editor Component
 * Configure order summary display settings
 */

import { Eye, EyeOff, Receipt } from 'lucide-react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faInfoCircle } from '@fortawesome/free-solid-svg-icons';
import { useFormStore } from '../../../stores';

export const SummaryEditor = () => {
    const formConfig = useFormStore((state) => state.formConfig);
    const setFormConfig = useFormStore((state) => state.setFormConfig);

    const hideShippingInSummary = formConfig.hideShippingInSummary || false;
    const enableSummarySection = formConfig.enableSummarySection !== false;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-slate-600 to-slate-800 flex items-center justify-center text-white shadow-lg">
                    <Receipt size={20} />
                </div>
                <div>
                    <h3 className="text-sm font-bold text-slate-800">Order Summary Settings</h3>
                    <p className="text-xs text-slate-500">Configure summary display and visibility</p>
                </div>
            </div>

            {/* Main Toggle */}
            <div className="bg-gradient-to-br from-indigo-50 to-indigo-100/50 border-2 border-indigo-200 rounded-xl p-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        {formConfig.enableSummarySection ? (
                            <Eye size={18} className="text-indigo-600" />
                        ) : (
                            <EyeOff size={18} className="text-slate-400" />
                        )}
                        <div>
                            <span className="block text-sm font-bold text-slate-800">Show Summary Section</span>
                            <span className="block text-xs text-slate-500 mt-0.5">
                                Display order total breakdown
                            </span>
                        </div>
                    </div>
                    <button
                        onClick={() =>
                            setFormConfig({
                                ...formConfig,
                                enableSummarySection: !formConfig.enableSummarySection,
                            })
                        }
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${formConfig.enableSummarySection ? 'bg-indigo-600' : 'bg-slate-300'
                            }`}
                    >
                        <span
                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${formConfig.enableSummarySection ? 'translate-x-6' : 'translate-x-1'
                                }`}
                        />
                    </button>
                </div>
            </div>

            {formConfig.enableSummarySection && (
                <>
                    {/* Hide Shipping in Summary */}
                    <div className="bg-white border border-slate-200 rounded-xl p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <span className="block text-sm font-semibold text-slate-800">
                                    Hide Shipping in Summary (UI Only)
                                </span>
                                <span className="block text-xs text-slate-500 mt-1">
                                    Shipping will still be calculated in total, just not shown as a line item
                                </span>
                            </div>
                            <button
                                onClick={() =>
                                    setFormConfig({
                                        ...formConfig,
                                        hideShippingInSummary: !hideShippingInSummary,
                                    })
                                }
                                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${hideShippingInSummary ? 'bg-indigo-600' : 'bg-slate-300'
                                    }`}
                            >
                                <span
                                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${hideShippingInSummary ? 'translate-x-6' : 'translate-x-1'
                                        }`}
                                />
                            </button>
                        </div>
                    </div>
                </>
            )}

            {/* Price in Letters Control */}
            <div className="bg-white border border-slate-200 rounded-xl p-4">
                <div className="space-y-3">
                    <div className="flex items-center justify-between">
                        <div>
                            <span className="text-[11px] font-bold text-slate-600 block">
                                Prix en toutes lettres
                            </span>
                            <span className="text-[9px] text-slate-400">
                                Afficher sous le total
                            </span>
                        </div>
                        <button
                            onClick={() =>
                                setFormConfig({
                                    ...formConfig,
                                    sectionSettings: {
                                        ...formConfig.sectionSettings,
                                        summary: {
                                            ...formConfig.sectionSettings?.summary,
                                            priceInLetters: {
                                                ...formConfig.sectionSettings?.summary?.priceInLetters,
                                                enabled: !formConfig.sectionSettings?.summary?.priceInLetters?.enabled,
                                                mode: formConfig.sectionSettings?.summary?.priceInLetters?.mode || 'dinars'
                                            }
                                        }
                                    }
                                })
                            }
                            className={`w-10 h-5 rounded-full relative transition-colors ${formConfig.sectionSettings?.summary?.priceInLetters?.enabled ? "bg-indigo-600" : "bg-slate-200"}`}
                        >
                            <div
                                className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full transition-transform shadow ${formConfig.sectionSettings?.summary?.priceInLetters?.enabled ? "translate-x-5" : ""}`}
                            />
                        </button>
                    </div>

                    {formConfig.sectionSettings?.summary?.priceInLetters?.enabled && (
                        <div className="grid grid-cols-2 gap-2 animate-in slide-in-from-top-1 duration-200">
                            <button
                                onClick={() =>
                                    setFormConfig({
                                        ...formConfig,
                                        sectionSettings: {
                                            ...formConfig.sectionSettings,
                                            summary: {
                                                ...formConfig.sectionSettings?.summary,
                                                priceInLetters: {
                                                    ...formConfig.sectionSettings?.summary?.priceInLetters,
                                                    enabled: true,
                                                    mode: 'dinars'
                                                }
                                            }
                                        }
                                    })
                                }
                                className={`p-2 rounded-lg border text-[10px] font-bold transition-all ${formConfig.sectionSettings?.summary?.priceInLetters?.mode === 'dinars'
                                    ? "border-indigo-500 bg-indigo-50 text-indigo-600"
                                    : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
                                    }`}
                            >
                                Dinars (DA)
                            </button>
                            <button
                                onClick={() =>
                                    setFormConfig({
                                        ...formConfig,
                                        sectionSettings: {
                                            ...formConfig.sectionSettings,
                                            summary: {
                                                ...formConfig.sectionSettings?.summary,
                                                priceInLetters: {
                                                    ...formConfig.sectionSettings?.summary?.priceInLetters,
                                                    enabled: true,
                                                    mode: 'centimes'
                                                }
                                            }
                                        }
                                    })
                                }
                                className={`p-2 rounded-lg border text-[10px] font-bold transition-all ${formConfig.sectionSettings?.summary?.priceInLetters?.mode === 'centimes'
                                    ? "border-indigo-500 bg-indigo-50 text-indigo-600"
                                    : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
                                    }`}
                            >
                                Centimes
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Info Box */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 flex gap-2">
                <div className="text-blue-600 flex-shrink-0">
                    <FontAwesomeIcon icon={faInfoCircle} className="w-4 h-4 mt-0.5" />
                </div>
                <p className="text-xs text-blue-700 leading-relaxed">
                    The summary section displays the order breakdown. Hiding shipping in the summary will
                    only affect the UI display - the actual calculation will still include shipping costs.
                </p>
            </div>
        </div>
    );
};
