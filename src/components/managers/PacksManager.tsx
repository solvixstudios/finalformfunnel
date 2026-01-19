// PacksManager.tsx - Unified Packs & Offers Management Component
// Extracted for separation of concerns and reusability

import {
    GripVertical,
    Hash,
    Package,
    Plus,
    Sparkles,
    Tag,
    Trash2,
    Zap
} from 'lucide-react';
import React, { useCallback, useMemo, useRef, useState } from 'react';

// Utility function to generate URL-friendly slugs from text
const slugify = (text: string): string => {
    return text
        .toString()
        .toLowerCase()
        .trim()
        .replace(/\s+/g, '-')        // Replace spaces with -
        .replace(/[^\w-]+/g, '')     // Remove all non-word chars
        .replace(/--+/g, '-')        // Replace multiple - with single -
        .replace(/^-+/, '')          // Trim - from start of text
        .replace(/-+$/, '');         // Trim - from end of text
};

// Types
export interface OfferSticker {
    enabled: boolean;
    text: { fr: string; ar: string };
    color: string;
}

export interface Offer {
    id: string;
    qty: number;
    discount: number;
    _type: 'perc' | 'fixed';
    _idManuallyEdited?: boolean;
    _internalId?: string;
    title: { fr: string; ar: string };
    desc: { fr: string; ar: string };
    sticker?: OfferSticker;
}

interface PacksManagerProps {
    offers: Offer[];
    onOffersChange: (offers: Offer[]) => void;
}

interface OfferCardProps {
    offer: Offer;
    index: number;
    isDragging: boolean;
    isSlugDuplicate: boolean;
    onUpdate: (index: number, updates: Partial<Offer>) => void;
    onTitleChange: (index: number, val: string, lang: 'fr' | 'ar') => void;
    onUpdateNested: (index: number, field: 'title' | 'desc', lang: 'fr' | 'ar', value: string) => void;
    onRemove: (index: number) => void;
    onDragStart: (e: React.DragEvent, index: number) => void;
    onDragEnd: () => void;
    onDragOver: (e: React.DragEvent) => void;
    onDrop: (e: React.DragEvent, index: number) => void;
}

// Single Offer Card Component
const OfferCard: React.FC<OfferCardProps> = React.memo(({
    offer,
    index,
    isDragging,
    isSlugDuplicate,
    onUpdate,
    onTitleChange, // New prop
    onUpdateNested,
    onRemove,
    onDragStart,
    onDragEnd,
    onDragOver,
    onDrop
}) => {
    const isPerc = offer._type === 'perc';
    const [showSticker, setShowSticker] = useState(offer.sticker?.enabled || false);

    // Simplified handleTitleChange just calls the parent
    const handleTitleChange = useCallback((val: string, lang: 'fr' | 'ar') => {
        onTitleChange(index, val, lang);
    }, [index, onTitleChange]);

    const handleIdChange = useCallback((val: string) => {
        onUpdate(index, { id: val, _idManuallyEdited: true });
    }, [index, onUpdate]);

    const handleQtyChange = useCallback((val: string) => {
        onUpdate(index, { qty: parseInt(val) || 1 });
    }, [index, onUpdate]);

    const handleDiscountChange = useCallback((val: string) => {
        onUpdate(index, { discount: parseFloat(val) || 0 });
    }, [index, onUpdate]);

    const handleTypeToggle = useCallback(() => {
        onUpdate(index, { _type: isPerc ? 'fixed' : 'perc' });
    }, [index, isPerc, onUpdate]);

    const handleStickerToggle = useCallback(() => {
        const newEnabled = !offer.sticker?.enabled;
        setShowSticker(newEnabled);
        onUpdate(index, {
            sticker: {
                enabled: newEnabled,
                text: offer.sticker?.text || { fr: '', ar: '' },
                color: offer.sticker?.color || '#ef4444'
            }
        });
    }, [index, offer.sticker, onUpdate]);

    const handleStickerTextChange = useCallback((val: string, lang: 'fr' | 'ar') => {
        onUpdate(index, {
            sticker: {
                ...offer.sticker,
                enabled: true,
                text: {
                    ...offer.sticker?.text,
                    [lang]: val
                },
                color: offer.sticker?.color || '#ef4444'
            }
        });
    }, [index, offer.sticker, onUpdate]);

    const handleStickerColorChange = useCallback((val: string) => {
        onUpdate(index, {
            sticker: {
                ...offer.sticker,
                enabled: true,
                text: offer.sticker?.text || { fr: '', ar: '' },
                color: val
            }
        });
    }, [index, offer.sticker, onUpdate]);

    return (
        <div
            draggable
            onDragStart={(e) => onDragStart(e, index)}
            onDragEnd={onDragEnd}
            onDragOver={onDragOver}
            onDrop={(e) => onDrop(e, index)}
            className={`group bg-white border border-slate-200 rounded-2xl shadow-sm hover:shadow-md hover:border-indigo-200 transition-all duration-200 overflow-hidden ${isDragging ? 'opacity-50' : ''}`}
        >
            {/* Card Header with Drag Handle */}
            <div className="bg-gradient-to-r from-slate-50 to-white px-4 py-3 border-b border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="cursor-grab active:cursor-grabbing text-slate-300 hover:text-slate-500 transition-colors">
                        <GripVertical size={18} />
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="h-7 w-7 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-lg flex items-center justify-center text-[11px] font-black text-white shadow-sm">
                            {index + 1}
                        </div>
                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Pack</div>
                    </div>
                </div>
                <button
                    onClick={() => onRemove(index)}
                    className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                    aria-label="Supprimer"
                >
                    <Trash2 size={16} />
                </button>
            </div>

            {/* Card Body */}
            <div className="p-4 space-y-4">
                {/* Titles Row */}
                <div className="grid grid-cols-2 gap-4">
                    {/* French Title */}
                    <div className="space-y-2">
                        <div className="flex items-center gap-2">
                            <span className="text-[9px] font-black bg-slate-100 text-slate-500 px-2 py-1 rounded-md">FR</span>
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">Français</span>
                        </div>
                        <input
                            type="text"
                            placeholder="Titre de l'offre..."
                            className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm font-bold text-slate-800 outline-none focus:border-indigo-400 focus:bg-white transition-all"
                            value={offer.title.fr}
                            onChange={(e) => handleTitleChange(e.target.value, 'fr')}
                        />
                        <input
                            type="text"
                            placeholder="Description..."
                            className="w-full bg-transparent border-b border-slate-100 px-1 py-1.5 text-xs font-medium text-slate-500 outline-none focus:border-indigo-400 transition-all"
                            value={offer.desc.fr}
                            onChange={(e) => onUpdateNested(index, 'desc', 'fr', e.target.value)}
                        />
                    </div>

                    {/* Arabic Title */}
                    <div className="space-y-2" dir="rtl">
                        <div className="flex items-center gap-2">
                            <span className="text-[9px] font-black bg-emerald-50 text-emerald-600 px-2 py-1 rounded-md">AR</span>
                            <span className="text-[10px] font-bold text-slate-400 tracking-tight">العربية</span>
                        </div>
                        <input
                            type="text"
                            placeholder="عنوان العرض..."
                            className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm font-bold text-slate-800 outline-none focus:border-indigo-400 focus:bg-white transition-all"
                            value={offer.title.ar}
                            onChange={(e) => onUpdateNested(index, 'title', 'ar', e.target.value)}
                        />
                        <input
                            type="text"
                            placeholder="وصف بسيط..."
                            className="w-full bg-transparent border-b border-slate-100 px-1 py-1.5 text-xs font-medium text-slate-500 outline-none focus:border-indigo-400 transition-all"
                            value={offer.desc.ar}
                            onChange={(e) => onUpdateNested(index, 'desc', 'ar', e.target.value)}
                        />
                    </div>
                </div>

                {/* Technical Config Row */}
                <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                    <div className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-3">Configuration Technique</div>

                    <div className="grid grid-cols-3 gap-3">
                        {/* Slug/ID */}
                        <div className="col-span-3 space-y-1.5">
                            <div className="flex items-center justify-between">
                                <label className="text-[9px] font-bold text-slate-500 uppercase">Identifiant (Slug)</label>
                                {isSlugDuplicate && (
                                    <span className="text-[8px] font-bold text-red-500 bg-red-50 px-2 py-0.5 rounded-md border border-red-200">
                                        Doublon détecté
                                    </span>
                                )}
                            </div>
                            <div className="relative">
                                <div className={`absolute left-3 top-1/2 -translate-y-1/2 ${isSlugDuplicate ? 'text-red-400' : 'text-slate-400'}`}>
                                    <Tag size={12} />
                                </div>
                                <input
                                    type="text"
                                    className={`w-full bg-white border rounded-lg pl-8 pr-16 py-2.5 text-[11px] font-mono font-bold outline-none shadow-sm transition-all ${isSlugDuplicate ? 'border-red-300 text-red-600 focus:border-red-400' : 'border-slate-200 text-indigo-600 focus:border-indigo-400'}`}
                                    value={offer.id}
                                    onChange={(e) => handleIdChange(e.target.value)}
                                    placeholder="slug-identifiant"
                                />
                                {!offer._idManuallyEdited && (
                                    <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1 text-[8px] bg-gradient-to-r from-amber-50 to-yellow-50 text-amber-600 px-2 py-1 rounded-md font-black tracking-tight border border-amber-100">
                                        <Zap size={8} fill="currentColor" /> AUTO
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Quantity */}
                        <div className="space-y-1.5">
                            <label className="text-[9px] font-bold text-slate-500 uppercase">Quantité</label>
                            <div className="relative">
                                <Hash size={10} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                                <input
                                    type="number"
                                    min="1"
                                    className="w-full bg-white border border-slate-200 rounded-lg pl-7 pr-2 py-2.5 text-xs font-black text-slate-700 outline-none focus:border-indigo-400 shadow-sm transition-all"
                                    value={offer.qty}
                                    onChange={(e) => handleQtyChange(e.target.value)}
                                />
                            </div>
                        </div>

                        {/* Discount */}
                        <div className="space-y-1.5">
                            <label className="text-[9px] font-bold text-slate-500 uppercase">Remise</label>
                            <div className="relative flex">
                                <input
                                    type="number"
                                    min="0"
                                    className={`w-full bg-white border border-slate-200 rounded-lg pl-3 pr-3 py-2.5 text-xs font-black outline-none focus:border-indigo-400 shadow-sm transition-all ${isPerc ? 'text-violet-600' : 'text-emerald-600'}`}
                                    value={offer.discount}
                                    onChange={(e) => handleDiscountChange(e.target.value)}
                                />
                            </div>
                        </div>

                        {/* Type Toggle - Enhanced */}
                        <div className="space-y-1.5">
                            <label className="text-[9px] font-bold text-slate-500 uppercase">Type de remise</label>
                            <button
                                onClick={handleTypeToggle}
                                className="w-full h-[42px] relative bg-slate-100 rounded-lg p-1 flex items-center transition-all"
                            >
                                <div
                                    className={`absolute top-1 bottom-1 w-[calc(50%-4px)] rounded-md shadow-sm transition-all duration-200 ${isPerc ? 'left-1 bg-violet-500' : 'left-[calc(50%+2px)] bg-emerald-500'}`}
                                />
                                <span className={`flex-1 text-[9px] font-bold uppercase tracking-wide z-10 transition-colors ${isPerc ? 'text-white' : 'text-slate-500'}`}>
                                    %
                                </span>
                                <span className={`flex-1 text-[9px] font-bold uppercase tracking-wide z-10 transition-colors ${!isPerc ? 'text-white' : 'text-slate-500'}`}>
                                    DZD
                                </span>
                            </button>
                        </div>
                    </div>
                </div>

                {/* Sticker Configuration */}
                <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl p-4 border border-amber-200">
                    <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                            <Sparkles size={14} className="text-amber-600" />
                            <span className="text-[10px] font-bold text-amber-700 uppercase tracking-wide">Sticker / Badge</span>
                        </div>
                        <button
                            onClick={handleStickerToggle}
                            className={`w-10 h-5 rounded-full relative transition-colors ${offer.sticker?.enabled ? 'bg-amber-500' : 'bg-slate-200'}`}
                        >
                            <div className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full transition-transform shadow ${offer.sticker?.enabled ? 'translate-x-5' : ''}`} />
                        </button>
                    </div>

                    {offer.sticker?.enabled && (
                        <div className="grid grid-cols-3 gap-3 animate-in slide-in-from-top-2 duration-200">
                            <div className="col-span-1 space-y-1.5">
                                <label className="text-[9px] font-bold text-amber-700 uppercase">Texte FR</label>
                                <input
                                    type="text"
                                    value={offer.sticker?.text?.fr || ''}
                                    onChange={(e) => handleStickerTextChange(e.target.value, 'fr')}
                                    className="w-full bg-white border border-amber-200 rounded-lg px-2 py-2 text-[11px] font-bold outline-none focus:border-amber-400 transition-all"
                                    placeholder="Meilleure Valeur"
                                />
                            </div>
                            <div className="col-span-1 space-y-1.5">
                                <label className="text-[9px] font-bold text-amber-700 uppercase">Texte AR</label>
                                <input
                                    type="text"
                                    dir="rtl"
                                    value={offer.sticker?.text?.ar || ''}
                                    onChange={(e) => handleStickerTextChange(e.target.value, 'ar')}
                                    className="w-full bg-white border border-amber-200 rounded-lg px-2 py-2 text-[11px] font-bold outline-none focus:border-amber-400 transition-all"
                                    placeholder="أفضل قيمة"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[9px] font-bold text-amber-700 uppercase">Couleur</label>
                                <div className="flex gap-2">
                                    <input
                                        type="color"
                                        value={offer.sticker?.color || '#ef4444'}
                                        onChange={(e) => handleStickerColorChange(e.target.value)}
                                        className="h-[34px] w-full rounded-lg cursor-pointer border border-amber-200"
                                    />
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
});

OfferCard.displayName = 'OfferCard';

// Main PacksManager Component
const PacksManager: React.FC<PacksManagerProps> = ({ offers, onOffersChange }) => {
    const dragItemRef = useRef<number | null>(null);

    // Check for duplicate slugs
    const getDuplicateSlugs = useMemo(() => {
        const slugCounts: Record<string, number> = {};
        offers.forEach(o => {
            slugCounts[o.id] = (slugCounts[o.id] || 0) + 1;
        });
        return new Set(Object.keys(slugCounts).filter(slug => slugCounts[slug] > 1));
    }, [offers]);

    // Add new offer
    const addOffer = useCallback(() => {
        const newOffer: Offer = {
            id: `pack-${Date.now()}`,
            qty: 1,
            discount: 0,
            _type: 'perc',
            _idManuallyEdited: false,
            _internalId: `internal-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            title: { fr: '', ar: '' },
            desc: { fr: '', ar: '' },
            sticker: { enabled: false, text: { fr: '', ar: '' }, color: '#ef4444' }
        };
        onOffersChange([...offers, newOffer]);
    }, [offers, onOffersChange]);

    // Update offer
    const updateOffer = useCallback((index: number, updates: Partial<Offer>) => {
        const newOffers = [...offers];
        newOffers[index] = { ...newOffers[index], ...updates };
        onOffersChange(newOffers);
    }, [offers, onOffersChange]);

    // Update nested field (title or desc)
    const updateNestedField = useCallback((
        index: number,
        field: 'title' | 'desc',
        lang: 'fr' | 'ar',
        value: string
    ) => {
        const newOffers = [...offers];
        newOffers[index] = {
            ...newOffers[index],
            [field]: { ...newOffers[index][field], [lang]: value }
        };
        onOffersChange(newOffers);
    }, [offers, onOffersChange]);

    // Remove offer
    const removeOffer = useCallback((index: number) => {
        onOffersChange(offers.filter((_, i) => i !== index));
    }, [offers, onOffersChange]);

    // Unified handleTitleChange to prevent state race conditions
    const handleTitleChange = useCallback((index: number, val: string, lang: 'fr' | 'ar') => {
        // Create a shallow copy of the array
        const newOffers = [...offers];

        // Use spread to create a NEW object for the offer being updated
        // This is crucial for React to detect the change and for immutability
        newOffers[index] = {
            ...newOffers[index],
            title: {
                ...newOffers[index].title,
                [lang]: val
            }
        };

        const currentOffer = newOffers[index];

        // Auto-generate slug from French title if not manually edited
        // Done in the SAME state update to preserve data consistency
        if (lang === 'fr') {
            // If manual edit flag is false properly update
            if (!currentOffer._idManuallyEdited) {
                const newSlug = slugify(val) || `pack-${Date.now()}`;
                newOffers[index] = {
                    ...currentOffer,
                    id: newSlug,
                    title: newOffers[index].title // Ensure title is latest
                };
            }
        }

        onOffersChange(newOffers);
    }, [offers, onOffersChange]);

    // Drag handlers
    const handleDragStart = useCallback((e: React.DragEvent, index: number) => {
        dragItemRef.current = index;
        e.dataTransfer.effectAllowed = 'move';
    }, []);

    const handleDragEnd = useCallback(() => {
        dragItemRef.current = null;
    }, []);

    const handleDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
    }, []);

    const handleDrop = useCallback((e: React.DragEvent, dropIndex: number) => {
        e.preventDefault();
        const dragIndex = dragItemRef.current;
        if (dragIndex === null || dragIndex === dropIndex) return;

        const newOffers = [...offers];
        const [dragged] = newOffers.splice(dragIndex, 1);
        newOffers.splice(dropIndex, 0, dragged);
        onOffersChange(newOffers);
        dragItemRef.current = null;
    }, [offers, onOffersChange]);

    // Memoize offers list - use stable key (_internalId or index) to prevent focus loss
    const offerCards = useMemo(() => (
        offers.map((offer, idx) => (
            <OfferCard
                key={offer._internalId || `offer-${idx}`}
                offer={offer}
                index={idx}
                isDragging={dragItemRef.current === idx}
                isSlugDuplicate={getDuplicateSlugs.has(offer.id)}
                onUpdate={updateOffer}
                onTitleChange={handleTitleChange} // Pass new handler
                onUpdateNested={updateNestedField}
                onRemove={removeOffer}
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
            />
        ))
    ), [offers, getDuplicateSlugs, updateOffer, updateNestedField, removeOffer, handleTitleChange, handleDragStart, handleDragEnd, handleDragOver, handleDrop]);

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between px-1">
                <h3 className="text-[10px] font-black uppercase text-slate-400 tracking-widest flex items-center gap-2">
                    <Tag size={14} /> Gestion des Packs & Offres
                </h3>
                <button
                    onClick={addOffer}
                    className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-indigo-600 to-violet-600 text-white rounded-xl text-[10px] font-bold uppercase tracking-wide hover:from-indigo-700 hover:to-violet-700 transition-all shadow-md hover:shadow-lg active:scale-95"
                >
                    <Plus size={14} strokeWidth={3} /> Nouveau Pack
                </button>
            </div>

            {/* Offers List */}
            <div className="space-y-4">
                {offerCards}

                {/* Empty State */}
                {offers.length === 0 && (
                    <div className="h-48 border-2 border-dashed border-slate-200 rounded-2xl flex flex-col items-center justify-center text-slate-400 bg-gradient-to-b from-white to-slate-50">
                        <Package size={40} className="mb-3 opacity-30" />
                        <p className="text-sm font-bold mb-1">Aucun pack configuré</p>
                        <p className="text-xs text-slate-400">Cliquez sur "Nouveau Pack" pour commencer</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default PacksManager;
