import {
    Calendar,
    ChevronDown,
    ChevronUp,
    Hash,
    Percent,
    Plus,
    Receipt,
    Tag,
    Ticket,
    Trash2,
    Truck,
    Zap
} from 'lucide-react';
import React, { useState } from 'react';

interface PromoCode {
    id: string;
    code: string;
    applyTo: 'subtotal' | 'shipping' | 'total';
    discountMode: 'free' | 'percentage' | 'fixed';
    discountValue: number;
    limitType: 'unlimited' | 'date_range' | 'use_count';
    startDate?: string;
    endDate?: string;
    maxUses?: number;
    currentUses?: number;
    isActive: boolean;
}

interface PromoCodeManagerProps {
    codes: PromoCode[];
    onCodesChange: (codes: PromoCode[]) => void;
    enabled: boolean;
    required: boolean;
    onEnabledChange: (enabled: boolean) => void;
    onRequiredChange: (required: boolean) => void;
}

const APPLY_TO_OPTIONS = [
    { id: 'subtotal', label: 'Sous-total', icon: Receipt },
    { id: 'shipping', label: 'Livraison', icon: Truck },
    { id: 'total', label: 'Total', icon: Tag },
];

const DISCOUNT_MODE_OPTIONS = [
    { id: 'free', label: 'Gratuit', icon: Zap },
    { id: 'percentage', label: '%', icon: Percent },
    { id: 'fixed', label: 'DZD', icon: Tag },
];

const PromoCodeManager: React.FC<PromoCodeManagerProps> = ({
    codes = [],
    onCodesChange,
    enabled,
    required,
    onEnabledChange,
    onRequiredChange,
}) => {
    const [expandedId, setExpandedId] = useState<string | null>(null);

    const generateId = () => `promo-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    const handleAddCode = () => {
        const newCode: PromoCode = {
            id: generateId(),
            code: '',
            applyTo: 'total',
            discountMode: 'percentage',
            discountValue: 10,
            limitType: 'unlimited',
            isActive: true,
        };
        onCodesChange([...codes, newCode]);
        setExpandedId(newCode.id);
    };

    const handleUpdateCode = (id: string, updates: Partial<PromoCode>) => {
        onCodesChange(codes.map(c => c.id === id ? { ...c, ...updates } : c));
    };

    const handleDeleteCode = (id: string) => {
        onCodesChange(codes.filter(c => c.id !== id));
        if (expandedId === id) setExpandedId(null);
    };

    const getApplyToInfo = (applyTo: string) => {
        return APPLY_TO_OPTIONS.find(o => o.id === applyTo) || APPLY_TO_OPTIONS[0];
    };

    const formatDiscountDisplay = (code: PromoCode) => {
        const applyToLabel = getApplyToInfo(code.applyTo).label;
        if (code.discountMode === 'free') {
            return `${applyToLabel} gratuit`;
        } else if (code.discountMode === 'percentage') {
            return `-${code.discountValue}% ${applyToLabel.toLowerCase()}`;
        } else {
            return `-${code.discountValue} DZD ${applyToLabel.toLowerCase()}`;
        }
    };

    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-white shadow-lg">
                        <Ticket size={20} />
                    </div>
                    <div>
                        <h3 className="text-sm font-bold text-slate-800">Codes Promo</h3>
                        <p className="text-[10px] text-slate-400">{codes.length} code{codes.length !== 1 ? 's' : ''}</p>
                    </div>
                </div>
                <button
                    onClick={handleAddCode}
                    className="flex items-center gap-2 px-3 py-2 bg-violet-600 text-white rounded-lg text-xs font-bold hover:bg-violet-700 transition-colors shadow-lg shadow-violet-200"
                >
                    <Plus size={14} />
                    Ajouter
                </button>
            </div>

            {/* Enable/Required Toggles */}
            <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                    <div>
                        <span className="text-xs font-bold text-slate-700 block">Activer le champ code promo</span>
                        <span className="text-[10px] text-slate-400">Affiche le champ dans le formulaire</span>
                    </div>
                    <button
                        onClick={() => onEnabledChange(!enabled)}
                        className={`w-12 h-6 rounded-full relative transition-colors ${enabled ? 'bg-violet-600' : 'bg-slate-200'}`}
                    >
                        <div className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform shadow ${enabled ? 'translate-x-6' : ''}`} />
                    </button>
                </div>
                {enabled && (
                    <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                        <div>
                            <span className="text-xs font-bold text-slate-700 block">Champ obligatoire</span>
                            <span className="text-[10px] text-slate-400">Le client doit entrer un code</span>
                        </div>
                        <button
                            onClick={() => onRequiredChange(!required)}
                            className={`w-12 h-6 rounded-full relative transition-colors ${required ? 'bg-amber-500' : 'bg-slate-200'}`}
                        >
                            <div className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform shadow ${required ? 'translate-x-6' : ''}`} />
                        </button>
                    </div>
                )}
            </div>

            {/* Codes List */}
            {codes.length === 0 && (
                <div className="p-8 bg-slate-50 rounded-xl border-2 border-dashed border-slate-200 text-center">
                    <Ticket className="mx-auto text-slate-300 mb-3" size={32} />
                    <p className="text-sm font-bold text-slate-400">Aucun code promo</p>
                    <p className="text-xs text-slate-300 mt-1">Cliquez sur "Ajouter" pour créer un code</p>
                </div>
            )}

            <div className="space-y-3">
                {codes.map((code) => {
                    const isExpanded = expandedId === code.id;
                    const applyToInfo = getApplyToInfo(code.applyTo);

                    return (
                        <div
                            key={code.id}
                            className={`bg-white border rounded-xl overflow-hidden transition-all ${code.isActive ? 'border-slate-200' : 'border-slate-100'}`}
                        >
                            {/* Code Header - Always visible */}
                            <div
                                className={`p-4 cursor-pointer hover:bg-slate-50/50 transition-colors ${!code.isActive ? 'opacity-60' : ''}`}
                                onClick={() => setExpandedId(isExpanded ? null : code.id)}
                            >
                                <div className="flex items-center gap-3">
                                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${code.applyTo === 'subtotal' ? 'bg-indigo-50 text-indigo-500' :
                                            code.applyTo === 'shipping' ? 'bg-emerald-50 text-emerald-500' :
                                                'bg-violet-50 text-violet-500'
                                        }`}>
                                        {React.createElement(applyToInfo.icon, { size: 18 })}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2">
                                            <span className="font-mono text-sm font-bold text-slate-800 uppercase tracking-wider">
                                                {code.code || 'NOUVEAU CODE'}
                                            </span>
                                            {!code.isActive && (
                                                <span className="px-1.5 py-0.5 bg-slate-100 text-slate-400 text-[9px] font-bold rounded">INACTIF</span>
                                            )}
                                        </div>
                                        <span className="text-xs text-slate-500">{formatDiscountDisplay(code)}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={(e) => { e.stopPropagation(); handleDeleteCode(code.id); }}
                                            className="p-2 rounded-lg text-slate-300 hover:bg-red-50 hover:text-red-500 transition-colors"
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                        {isExpanded ? <ChevronUp size={16} className="text-slate-400" /> : <ChevronDown size={16} className="text-slate-400" />}
                                    </div>
                                </div>
                            </div>

                            {/* Expanded Content - Inline editing */}
                            {isExpanded && (
                                <div className="border-t border-slate-100 p-4 space-y-4 bg-slate-50/30">
                                    {/* Code Input */}
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Code</label>
                                        <input
                                            type="text"
                                            value={code.code}
                                            onChange={(e) => handleUpdateCode(code.id, { code: e.target.value.toUpperCase() })}
                                            placeholder="EX: RAMADANOFF"
                                            className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm font-mono font-bold uppercase tracking-wider focus:border-violet-400 focus:ring-2 focus:ring-violet-50 outline-none bg-white"
                                        />
                                    </div>

                                    {/* Apply To */}
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Appliquer sur</label>
                                        <div className="flex gap-2">
                                            {APPLY_TO_OPTIONS.map((option) => (
                                                <button
                                                    key={option.id}
                                                    onClick={() => handleUpdateCode(code.id, { applyTo: option.id as any })}
                                                    className={`flex-1 py-2 px-3 rounded-lg border text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${code.applyTo === option.id
                                                            ? 'border-violet-400 bg-violet-50 text-violet-700'
                                                            : 'border-slate-200 bg-white text-slate-500 hover:border-slate-300'
                                                        }`}
                                                >
                                                    <option.icon size={12} />
                                                    {option.label}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Discount Mode & Value */}
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Réduction</label>
                                        <div className="flex gap-2">
                                            <div className="flex bg-slate-100 rounded-lg p-1">
                                                {DISCOUNT_MODE_OPTIONS.map((option) => (
                                                    <button
                                                        key={option.id}
                                                        onClick={() => handleUpdateCode(code.id, {
                                                            discountMode: option.id as any,
                                                            discountValue: option.id === 'free' ? 100 : (code.discountValue || 10)
                                                        })}
                                                        className={`py-1.5 px-3 rounded-md text-xs font-bold transition-all ${code.discountMode === option.id
                                                                ? 'bg-white text-slate-800 shadow-sm'
                                                                : 'text-slate-500 hover:text-slate-700'
                                                            }`}
                                                    >
                                                        {option.label}
                                                    </button>
                                                ))}
                                            </div>
                                            {code.discountMode !== 'free' && (
                                                <div className="relative flex-1">
                                                    <input
                                                        type="number"
                                                        min="0"
                                                        max={code.discountMode === 'percentage' ? 100 : undefined}
                                                        value={code.discountValue}
                                                        onChange={(e) => handleUpdateCode(code.id, { discountValue: parseInt(e.target.value) || 0 })}
                                                        className="w-full px-3 py-2 pr-10 border border-slate-200 rounded-lg text-sm font-bold focus:border-violet-400 focus:ring-2 focus:ring-violet-50 outline-none bg-white"
                                                    />
                                                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-bold">
                                                        {code.discountMode === 'percentage' ? '%' : 'DZD'}
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Limit Type */}
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Limite</label>
                                        <div className="flex bg-slate-100 rounded-lg p-1">
                                            <button
                                                onClick={() => handleUpdateCode(code.id, { limitType: 'unlimited' })}
                                                className={`flex-1 py-1.5 px-3 rounded-md text-xs font-bold transition-all ${code.limitType === 'unlimited' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500'}`}
                                            >
                                                Illimité
                                            </button>
                                            <button
                                                onClick={() => handleUpdateCode(code.id, { limitType: 'date_range' })}
                                                className={`flex-1 py-1.5 px-3 rounded-md text-xs font-bold transition-all flex items-center justify-center gap-1 ${code.limitType === 'date_range' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500'}`}
                                            >
                                                <Calendar size={10} /> Période
                                            </button>
                                            <button
                                                onClick={() => handleUpdateCode(code.id, { limitType: 'use_count' })}
                                                className={`flex-1 py-1.5 px-3 rounded-md text-xs font-bold transition-all flex items-center justify-center gap-1 ${code.limitType === 'use_count' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500'}`}
                                            >
                                                <Hash size={10} /> Nombre
                                            </button>
                                        </div>
                                    </div>

                                    {/* Date Range */}
                                    {code.limitType === 'date_range' && (
                                        <div className="grid grid-cols-2 gap-2">
                                            <div className="space-y-1">
                                                <label className="text-[9px] font-bold text-slate-400">Début</label>
                                                <input
                                                    type="datetime-local"
                                                    value={code.startDate || ''}
                                                    onChange={(e) => handleUpdateCode(code.id, { startDate: e.target.value })}
                                                    className="w-full px-2 py-2 border border-slate-200 rounded-lg text-xs focus:border-violet-400 outline-none bg-white"
                                                />
                                            </div>
                                            <div className="space-y-1">
                                                <label className="text-[9px] font-bold text-slate-400">Fin</label>
                                                <input
                                                    type="datetime-local"
                                                    value={code.endDate || ''}
                                                    onChange={(e) => handleUpdateCode(code.id, { endDate: e.target.value })}
                                                    className="w-full px-2 py-2 border border-slate-200 rounded-lg text-xs focus:border-violet-400 outline-none bg-white"
                                                />
                                            </div>
                                        </div>
                                    )}

                                    {/* Use Count */}
                                    {code.limitType === 'use_count' && (
                                        <div className="space-y-1">
                                            <label className="text-[9px] font-bold text-slate-400">Max utilisations</label>
                                            <input
                                                type="number"
                                                min="1"
                                                value={code.maxUses || 100}
                                                onChange={(e) => handleUpdateCode(code.id, { maxUses: parseInt(e.target.value) || 1 })}
                                                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm font-bold focus:border-violet-400 outline-none bg-white"
                                            />
                                        </div>
                                    )}

                                    {/* Active Toggle */}
                                    <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-slate-200">
                                        <span className="text-xs font-bold text-slate-600">Code actif</span>
                                        <button
                                            onClick={() => handleUpdateCode(code.id, { isActive: !code.isActive })}
                                            className={`w-10 h-5 rounded-full relative transition-colors ${code.isActive ? 'bg-emerald-500' : 'bg-slate-200'}`}
                                        >
                                            <div className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full transition-transform shadow ${code.isActive ? 'translate-x-5' : ''}`} />
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default PromoCodeManager;
