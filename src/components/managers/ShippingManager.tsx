// ShippingManager.tsx - Unified Shipping Rates Management Component
// Extracted for separation of concerns and reusability

import {
    Globe,
    Home,
    Package,
    Plus,
    Sparkles,
    Trash2,
    Truck
} from 'lucide-react';
import React, { useCallback, useMemo } from 'react';
import { WILAYAS } from '../../lib/constants';

// Types
export interface ShippingException {
    id: string;
    home: number;
    desk: number;
}

export interface ShippingConfig {
    standard: {
        home: number;
        desk: number;
    };
    exceptions: ShippingException[];
}

interface ShippingManagerProps {
    shipping: ShippingConfig;
    onShippingChange: (shipping: ShippingConfig) => void;
    // Delivery type options
    enableHomeDelivery?: boolean;
    enableDeskDelivery?: boolean;
    onDeliveryTypeChange?: (type: 'home' | 'desk', enabled: boolean) => void;
}

interface ExceptionRowProps {
    exception: ShippingException;
    index: number;
    onUpdate: (index: number, field: keyof ShippingException, value: string | number) => void;
    onRemove: (index: number) => void;
}

// Exception Row Component
const ExceptionRow: React.FC<ExceptionRowProps> = React.memo(({
    exception,
    index,
    onUpdate,
    onRemove
}) => {
    const homeEnabled = exception.homeEnabled !== false;
    const deskEnabled = exception.deskEnabled !== false;

    return (
        <div className="group bg-white border border-slate-200 rounded-xl p-3 hover:border-indigo-200 hover:shadow-sm transition-all">
            <div className="flex items-center gap-3 mb-3">
                {/* Wilaya Selector */}
                <div className="flex-1 relative">
                    <select
                        value={exception.id}
                        onChange={(e) => onUpdate(index, 'id', e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2.5 text-xs font-bold text-slate-700 outline-none focus:border-indigo-400 focus:bg-white transition-all appearance-none cursor-pointer uppercase"
                    >
                        {WILAYAS.map(w => (
                            <option key={w.id} value={w.id}>{w.name}</option>
                        ))}
                    </select>
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                        <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                    </div>
                </div>

                {/* Delete Button */}
                <button
                    onClick={() => onRemove(index)}
                    className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                    aria-label="Supprimer"
                >
                    <Trash2 size={16} />
                </button>
            </div>

            {/* Rates Inputs with enable toggles and clear free buttons */}
            <div className="grid grid-cols-2 gap-2">
                {/* Home Rate */}
                <div className={`bg-slate-50 border border-slate-100 rounded-lg p-2 space-y-2 transition-all ${!homeEnabled ? 'opacity-50' : ''}`}>
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                            <div className="w-5 h-5 rounded bg-indigo-50 text-indigo-500 flex items-center justify-center">
                                <Home size={10} />
                            </div>
                            <span className="text-[9px] font-bold text-slate-500">Domicile</span>
                        </div>
                        <button
                            onClick={() => onUpdate(index, 'homeEnabled', !homeEnabled)}
                            className={`w-7 h-4 rounded-full relative transition-colors ${homeEnabled ? "bg-indigo-600" : "bg-slate-200"}`}
                        >
                            <div className={`absolute top-0.5 left-0.5 w-3 h-3 bg-white rounded-full transition-transform ${homeEnabled ? "translate-x-3" : ""}`} />
                        </button>
                    </div>
                    <div className="flex items-center gap-1">
                        <input
                            type="number"
                            min="0"
                            disabled={!homeEnabled}
                            className="w-full bg-white border border-slate-200 rounded px-2 py-1 text-xs font-black text-indigo-600 outline-none disabled:opacity-50"
                            value={exception.home}
                            onChange={(e) => onUpdate(index, 'home', parseInt(e.target.value) || 0)}
                        />
                        <span className="text-[8px] font-bold text-slate-300">DZD</span>
                    </div>
                    <button
                        onClick={() => onUpdate(index, 'home', 0)}
                        disabled={!homeEnabled}
                        className="w-full flex items-center justify-center gap-1 bg-emerald-50 text-emerald-600 px-2 py-1 rounded text-[8px] font-bold hover:bg-emerald-100 transition-all disabled:opacity-50"
                    >
                        <Sparkles size={8} /> Gratuit
                    </button>
                </div>

                {/* Desk Rate */}
                <div className={`bg-slate-50 border border-slate-100 rounded-lg p-2 space-y-2 transition-all ${!deskEnabled ? 'opacity-50' : ''}`}>
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                            <div className="w-5 h-5 rounded bg-violet-50 text-violet-500 flex items-center justify-center">
                                <Package size={10} />
                            </div>
                            <span className="text-[9px] font-bold text-slate-500">Bureau</span>
                        </div>
                        <button
                            onClick={() => onUpdate(index, 'deskEnabled', !deskEnabled)}
                            className={`w-7 h-4 rounded-full relative transition-colors ${deskEnabled ? "bg-indigo-600" : "bg-slate-200"}`}
                        >
                            <div className={`absolute top-0.5 left-0.5 w-3 h-3 bg-white rounded-full transition-transform ${deskEnabled ? "translate-x-3" : ""}`} />
                        </button>
                    </div>
                    <div className="flex items-center gap-1">
                        <input
                            type="number"
                            min="0"
                            disabled={!deskEnabled}
                            className="w-full bg-white border border-slate-200 rounded px-2 py-1 text-xs font-black text-violet-600 outline-none disabled:opacity-50"
                            value={exception.desk}
                            onChange={(e) => onUpdate(index, 'desk', parseInt(e.target.value) || 0)}
                        />
                        <span className="text-[8px] font-bold text-slate-300">DZD</span>
                    </div>
                    <button
                        onClick={() => onUpdate(index, 'desk', 0)}
                        disabled={!deskEnabled}
                        className="w-full flex items-center justify-center gap-1 bg-emerald-50 text-emerald-600 px-2 py-1 rounded text-[8px] font-bold hover:bg-emerald-100 transition-all disabled:opacity-50"
                    >
                        <Sparkles size={8} /> Gratuit
                    </button>
                </div>
            </div>
        </div>
    );
});

ExceptionRow.displayName = 'ExceptionRow';

// Main ShippingManager Component
const ShippingManager: React.FC<ShippingManagerProps> = ({
    shipping,
    onShippingChange,
    enableHomeDelivery = true,
    enableDeskDelivery = true,
    onDeliveryTypeChange
}) => {

    // Update standard rates
    const updateStandard = useCallback((field: 'home' | 'desk', value: number) => {
        onShippingChange({
            ...shipping,
            standard: { ...shipping.standard, [field]: value }
        });
    }, [shipping, onShippingChange]);

    // Add exception
    const addException = useCallback(() => {
        const usedIds = new Set(shipping.exceptions.map(e => e.id));
        const nextWilaya = WILAYAS.find(w => !usedIds.has(w.id)) || WILAYAS[0];

        onShippingChange({
            ...shipping,
            exceptions: [...shipping.exceptions, { id: nextWilaya.id, home: 0, desk: 0 }]
        });
    }, [shipping, onShippingChange]);

    // Update exception
    const updateException = useCallback((
        index: number,
        field: keyof ShippingException,
        value: string | number
    ) => {
        const newExceptions = [...shipping.exceptions];
        newExceptions[index] = { ...newExceptions[index], [field]: value };
        onShippingChange({ ...shipping, exceptions: newExceptions });
    }, [shipping, onShippingChange]);

    // Remove exception
    const removeException = useCallback((index: number) => {
        onShippingChange({
            ...shipping,
            exceptions: shipping.exceptions.filter((_, i) => i !== index)
        });
    }, [shipping, onShippingChange]);

    // Memoize exception rows
    const exceptionRows = useMemo(() => (
        shipping.exceptions.map((exc, idx) => (
            <ExceptionRow
                key={`${exc.id}-${idx}`}
                exception={exc}
                index={idx}
                onUpdate={updateException}
                onRemove={removeException}
            />
        ))
    ), [shipping.exceptions, updateException, removeException]);

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between px-1">
                <h3 className="text-[10px] font-black uppercase text-slate-400 tracking-widest flex items-center gap-2">
                    <Truck size={14} /> Tarifs de Livraison
                </h3>
            </div>

            {/* Standard Rates Card - Now includes delivery type toggles */}
            <div className="bg-gradient-to-br from-white to-slate-50 border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                <div className="p-5">
                    <div className="flex items-center justify-between mb-5">
                        <div className="flex items-center gap-3">
                            <div className="p-3 bg-gradient-to-br from-indigo-500 to-violet-600 text-white rounded-xl shadow-lg shadow-indigo-100">
                                <Globe size={22} />
                            </div>
                            <div>
                                <h4 className="font-black text-sm text-slate-900 tracking-tight">Frais Nationaux</h4>
                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Tarifs par défaut</p>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        {/* Home Delivery */}
                        <div className={`bg-white border rounded-xl p-4 space-y-3 transition-all ${enableHomeDelivery ? 'border-slate-200 hover:border-indigo-200' : 'border-slate-100 opacity-50'}`}>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-500 flex items-center justify-center">
                                        <Home size={16} />
                                    </div>
                                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">À Domicile</span>
                                </div>
                                {onDeliveryTypeChange && (
                                    <button
                                        onClick={() => onDeliveryTypeChange('home', !enableHomeDelivery)}
                                        className={`w-9 h-5 rounded-full relative transition-colors ${enableHomeDelivery ? "bg-indigo-600" : "bg-slate-200"}`}
                                    >
                                        <div className={`absolute top-1 left-1 w-3 h-3 bg-white rounded-full transition-transform ${enableHomeDelivery ? "translate-x-4" : ""}`} />
                                    </button>
                                )}
                            </div>
                            <div className="flex items-baseline gap-2">
                                <input
                                    type="number"
                                    min="0"
                                    disabled={!enableHomeDelivery}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-3 text-2xl font-black text-indigo-600 outline-none focus:border-indigo-400 focus:bg-white text-right transition-all disabled:opacity-50"
                                    value={shipping.standard.home}
                                    onChange={(e) => updateStandard('home', parseInt(e.target.value) || 0)}
                                />
                                <span className="text-xs font-black text-slate-400">DZD</span>
                            </div>
                            <button
                                onClick={() => updateStandard('home', 0)}
                                disabled={!enableHomeDelivery}
                                className="w-full flex items-center justify-center gap-1.5 bg-emerald-50 text-emerald-600 px-3 py-1.5 rounded-lg text-[9px] font-bold uppercase tracking-wide hover:bg-emerald-100 transition-all disabled:opacity-50"
                            >
                                <Sparkles size={10} /> Gratuit
                            </button>
                        </div>

                        {/* Desk/Office Pickup */}
                        <div className={`bg-white border rounded-xl p-4 space-y-3 transition-all ${enableDeskDelivery ? 'border-slate-200 hover:border-violet-200' : 'border-slate-100 opacity-50'}`}>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <div className="w-8 h-8 rounded-lg bg-violet-50 text-violet-500 flex items-center justify-center">
                                        <Package size={16} />
                                    </div>
                                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">En Bureau</span>
                                </div>
                                {onDeliveryTypeChange && (
                                    <button
                                        onClick={() => onDeliveryTypeChange('desk', !enableDeskDelivery)}
                                        className={`w-9 h-5 rounded-full relative transition-colors ${enableDeskDelivery ? "bg-indigo-600" : "bg-slate-200"}`}
                                    >
                                        <div className={`absolute top-1 left-1 w-3 h-3 bg-white rounded-full transition-transform ${enableDeskDelivery ? "translate-x-4" : ""}`} />
                                    </button>
                                )}
                            </div>
                            <div className="flex items-baseline gap-2">
                                <input
                                    type="number"
                                    min="0"
                                    disabled={!enableDeskDelivery}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-3 text-2xl font-black text-violet-600 outline-none focus:border-violet-400 focus:bg-white text-right transition-all disabled:opacity-50"
                                    value={shipping.standard.desk}
                                    onChange={(e) => updateStandard('desk', parseInt(e.target.value) || 0)}
                                />
                                <span className="text-xs font-black text-slate-400">DZD</span>
                            </div>
                            <button
                                onClick={() => updateStandard('desk', 0)}
                                disabled={!enableDeskDelivery}
                                className="w-full flex items-center justify-center gap-1.5 bg-emerald-50 text-emerald-600 px-3 py-1.5 rounded-lg text-[9px] font-bold uppercase tracking-wide hover:bg-emerald-100 transition-all disabled:opacity-50"
                            >
                                <Sparkles size={10} /> Gratuit
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Exceptions Section */}
            <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                <div className="p-4 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white flex justify-between items-center">
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></div>
                        <h4 className="font-bold text-xs text-slate-600 uppercase tracking-widest">
                            Exceptions par Wilaya
                        </h4>
                        {shipping.exceptions.length > 0 && (
                            <span className="text-[9px] font-black text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
                                {shipping.exceptions.length}
                            </span>
                        )}
                    </div>
                    <button
                        onClick={addException}
                        className="flex items-center gap-1.5 text-[10px] font-bold text-indigo-600 bg-indigo-50 px-4 py-2 rounded-xl hover:bg-indigo-100 transition-colors border border-indigo-100 shadow-sm"
                    >
                        <Plus size={14} /> Ajouter Exception
                    </button>
                </div>

                <div className="max-h-[320px] overflow-y-auto custom-scroll">
                    {exceptionRows.length > 0 ? (
                        <div className="p-4 space-y-2">
                            {exceptionRows}
                        </div>
                    ) : (
                        <div className="p-10 flex flex-col items-center justify-center">
                            <div className="w-16 h-16 rounded-2xl bg-slate-50 flex items-center justify-center mb-3">
                                <Truck size={28} className="text-slate-200" />
                            </div>
                            <p className="text-[11px] font-bold text-slate-400 text-center uppercase tracking-wide">
                                Toutes les wilayas utilisent
                            </p>
                            <p className="text-[10px] font-bold text-slate-400 text-center uppercase tracking-wide">
                                le tarif national par défaut
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ShippingManager;
