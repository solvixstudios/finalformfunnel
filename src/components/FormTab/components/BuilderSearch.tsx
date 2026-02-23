import React, { useState, useMemo, useRef, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faSearch,
    faTimes,
    faPalette,
    faTableCells,
    faTags,
    faTicket,
    faTruck,
    faCircleCheck,
    faTableColumns,
    faBolt,
    faBoxesStacked,
    faClock,
    faShieldHalved,
    faHeading,
    faHandPointer,
    faReceipt,
    faGears,
    faFont,
    faSliders,
    faBorderAll,
    faCode,
    faImage,
    faGlobe,
    faToggleOn,
    faTextHeight,
    faPencil,
    faStar,
    faWandMagicSparkles,
    faFire,
    faCrosshairs,
} from '@fortawesome/free-solid-svg-icons';
import {
    faWhatsapp,
    faTiktok,
    faFacebookF,
    faGoogle,
    faShopify,
} from '@fortawesome/free-brands-svg-icons';
import type { IconDefinition } from '@fortawesome/fontawesome-svg-core';

/* ─────────────────────────────────────────────
 *  DEEP SEARCH DATA
 *  Each item has sub-properties for fine-tuned matching.
 *  Users can search "couleur accent", "police arabe", etc.
 * ───────────────────────────────────────────── */

interface SearchableItem {
    id: string;
    label: string;
    icon: IconDefinition;
    accentClass: string;
    description: string;
    aliases: string[];
    /** Sub-properties that live inside this editor */
    subProperties: string[];
}

const SEARCHABLE_ITEMS: SearchableItem[] = [
    {
        id: 'global_design',
        label: 'Design Global',
        icon: faPalette,
        accentClass: 'from-indigo-500 to-violet-600',
        description: 'Couleurs, formes & styles',
        aliases: ['design', 'couleurs', 'colors', 'thème', 'theme', 'style', 'apparence', 'look'],
        subProperties: [
            'couleur accent', 'accent color', 'couleur cta', 'cta color',
            'fond du formulaire', 'form background', 'couleur texte', 'text color',
            'couleur titres', 'heading color', 'fond champ', 'input background',
            'bordure champ', 'input border', 'placeholder', 'fond carte', 'card background',
            'bordure carte', 'card border', 'préréglages', 'presets', 'thème',
            'marge sections', 'section spacing', 'padding', 'espacement champs', 'input spacing',
            'marge supérieure', 'marge inférieure', 'margin top', 'margin bottom',
            'police', 'font', 'typographie', 'typography', 'inter', 'cairo', 'poppins', 'roboto',
            'police française', 'police arabe', 'french font', 'arabic font',
            'style champs', 'input style', 'rempli', 'contour', 'filled', 'outlined',
            'bords', 'radius', 'border radius', 'arrondi', 'carré',
            'nettoyage thème', 'auto hide', 'intégration', 'embedding',
        ],
    },
    {
        id: 'sections_list',
        label: 'Sections',
        icon: faTableCells,
        accentClass: 'from-blue-500 to-cyan-600',
        description: 'Ordre et visibilité',
        aliases: ['sections', 'order', 'ordre', 'liste', 'formulaire', 'visibilité', 'visibility', 'drag', 'drop', 'réorganiser'],
        subProperties: ['header', 'variants', 'shipping', 'delivery', 'offers', 'promo', 'summary', 'cta', 'urgence', 'trust badges'],
    },
    {
        id: 'header',
        label: 'En-tête (Header)',
        icon: faHeading,
        accentClass: 'from-indigo-500 to-blue-600',
        description: 'Section en-tête du formulaire',
        aliases: ['header', 'en-tête', 'titre', 'logo', 'image', 'bannière', 'banner'],
        subProperties: ['style header', 'titre produit', 'product title', 'image produit', 'product image', 'langue', 'language', 'prix', 'price'],
    },
    {
        id: 'packs_manager',
        label: 'Packs & Offres',
        icon: faTags,
        accentClass: 'from-amber-500 to-orange-600',
        description: 'Gérer les offres produits',
        aliases: ['offers', 'offres', 'packs', 'produits', 'products', 'bundle', 'lot'],
        subProperties: ['titre offre', 'offer title', 'prix', 'price', 'quantité', 'quantity', 'remise', 'discount', 'badge offre', 'offer badge'],
    },
    {
        id: 'shipping_manager',
        label: 'Tarifs Livraison',
        icon: faTruck,
        accentClass: 'from-emerald-500 to-teal-600',
        description: 'Frais & règles nationales',
        aliases: ['shipping', 'livraison', 'tarifs', 'frais', 'wilaya', 'commune', 'delivery fees'],
        subProperties: ['tarif maison', 'home rate', 'tarif bureau', 'desk rate', 'exception', 'wilaya', 'commune', 'gratuit', 'free shipping'],
    },
    {
        id: 'promo_code_manager',
        label: 'Codes Promo',
        icon: faTicket,
        accentClass: 'from-violet-500 to-purple-600',
        description: 'Réductions & offres spéciales',
        aliases: ['promo', 'coupon', 'discount', 'réduction', 'code', 'remise'],
        subProperties: ['code', 'pourcentage', 'percentage', 'montant fixe', 'flat amount', 'activer', 'enable', 'obligatoire', 'required'],
    },
    {
        id: 'thank_you',
        label: 'Page Confirmation',
        icon: faCircleCheck,
        accentClass: 'from-green-500 to-emerald-600',
        description: 'Page de remerciement',
        aliases: ['confirmation', 'remerciement', 'thank you', 'success', 'merci', 'commande confirmée'],
        subProperties: ['titre', 'title', 'message', 'animation', 'confettis', 'confetti', 'bouton', 'button', 'redirect', 'redirection'],
    },
    {
        id: 'whatsapp',
        label: 'WhatsApp',
        icon: faWhatsapp,
        accentClass: 'from-emerald-400 to-green-600',
        description: 'Connecter profils WhatsApp',
        aliases: ['whatsapp', 'wa', 'message', 'chat', 'notification', 'profil'],
        subProperties: ['numéro', 'phone number', 'profil', 'profile', 'activer', 'enable', 'notification commande', 'order notification'],
    },
    {
        id: 'google_sheets',
        label: 'Google Sheets',
        icon: faGoogle,
        accentClass: 'from-green-500 to-emerald-700',
        description: 'Exporter commandes',
        aliases: ['sheets', 'google', 'excel', 'spreadsheet', 'tableau', 'export', 'données', 'data'],
        subProperties: ['url script', 'spreadsheet id', 'feuille', 'sheet name', 'activer', 'enable', 'abandonné', 'abandoned'],
    },
    {
        id: 'meta_pixel',
        label: 'Meta Pixel',
        icon: faFacebookF,
        accentClass: 'from-blue-600 to-indigo-700',
        description: 'Conversions Facebook',
        aliases: ['meta', 'facebook', 'pixel', 'fb', 'conversion', 'capi', 'tracking', 'événement', 'event'],
        subProperties: ['pixel id', 'access token', 'profil', 'profile', 'page view', 'view content', 'initiate checkout', 'purchase', 'complete payment', 'test event code'],
    },
    {
        id: 'tiktok_pixel',
        label: 'TikTok Pixel',
        icon: faTiktok,
        accentClass: 'from-slate-700 to-slate-900',
        description: 'Conversions TikTok',
        aliases: ['tiktok', 'tik tok', 'pixel', 'conversion', 'tracking', 'événement', 'event'],
        subProperties: ['pixel id', 'access token', 'profil', 'profile', 'page view', 'view content', 'initiate checkout', 'complete payment', 'test event code'],
    },
    {
        id: 'shopify',
        label: 'Shopify',
        icon: faShopify,
        accentClass: 'from-green-500 to-emerald-600',
        description: 'Connecter boutique Shopify',
        aliases: ['shopify', 'store', 'boutique', 'magasin', 'e-commerce', 'ecommerce', 'shop'],
        subProperties: ['connecter', 'connect', 'boutique', 'store', 'produits', 'products', 'assigner', 'assign', 'domaine', 'domain', 'api key', 'access token', 'synchronisation', 'sync'],
    },
    {
        id: 'urgencyText',
        label: 'Urgence — Texte',
        icon: faBolt,
        accentClass: 'from-amber-500 to-orange-600',
        description: 'Message d\'urgence personnalisé',
        aliases: ['urgence', 'urgency', 'texte', 'text', 'message', 'alerte', 'alert', 'offre limitée'],
        subProperties: ['style', 'banner', 'pill', 'glow', 'minimal', 'couleur', 'color', 'texte français', 'texte arabe', 'activer', 'enable'],
    },
    {
        id: 'urgencyQuantity',
        label: 'Urgence — Stock',
        icon: faBoxesStacked,
        accentClass: 'from-red-500 to-rose-600',
        description: 'Compteur de stock restant',
        aliases: ['urgence', 'urgency', 'stock', 'quantité', 'quantity', 'restant', 'remaining', 'inventaire'],
        subProperties: ['style', 'badge', 'banner', 'pill', 'minimal', 'progress', 'counter', 'flame', 'couleur', 'color', 'dynamique', 'dynamic', 'icône', 'icon', 'animation', 'texte personnalisé', 'custom text', 'quantité', 'stock count'],
    },
    {
        id: 'urgencyTimer',
        label: 'Urgence — Timer',
        icon: faClock,
        accentClass: 'from-purple-500 to-fuchsia-600',
        description: 'Compte à rebours',
        aliases: ['urgence', 'urgency', 'timer', 'countdown', 'minuteur', 'temps', 'horloge', 'clock'],
        subProperties: ['heures', 'hours', 'minutes', 'secondes', 'seconds', 'style', 'digital', 'flip', 'couleur', 'color', 'label', 'activer', 'enable'],
    },
    {
        id: 'trustBadges',
        label: 'Badges de Confiance',
        icon: faShieldHalved,
        accentClass: 'from-cyan-500 to-blue-600',
        description: 'Badges garantie & sécurité',
        aliases: ['trust', 'badges', 'confiance', 'garantie', 'sécurité', 'security', 'paiement', 'payment'],
        subProperties: ['livraison rapide', 'fast delivery', 'paiement sécurisé', 'secure payment', 'garantie', 'guarantee', 'retour', 'return', 'personnaliser', 'customize'],
    },
    {
        id: 'cta',
        label: 'Bouton CTA',
        icon: faHandPointer,
        accentClass: 'from-indigo-500 to-violet-600',
        description: 'Bouton commander',
        aliases: ['cta', 'bouton', 'button', 'commander', 'submit', 'envoyer', 'action'],
        subProperties: ['texte', 'text', 'couleur', 'color', 'animation', 'pulse', 'shake', 'bounce', 'sticky', 'variant', 'style'],
    },
    {
        id: 'summary',
        label: 'Récapitulatif',
        icon: faReceipt,
        accentClass: 'from-slate-500 to-slate-700',
        description: 'Résumé de commande',
        aliases: ['summary', 'récapitulatif', 'total', 'prix', 'price', 'résumé', 'commande', 'order'],
        subProperties: ['sous-total', 'subtotal', 'livraison', 'shipping', 'réduction', 'discount', 'total', 'style'],
    },
    {
        id: 'variants',
        label: 'Variantes',
        icon: faTableColumns,
        accentClass: 'from-sky-500 to-blue-600',
        description: 'Options de produit',
        aliases: ['variants', 'variantes', 'options', 'taille', 'size', 'couleur', 'color', 'choix'],
        subProperties: ['style', 'radio', 'dropdown', 'visual', 'image'],
    },
    {
        id: 'shipping',
        label: 'Champs Formulaire',
        icon: faGears,
        accentClass: 'from-teal-500 to-cyan-600',
        description: 'Champs de saisie utilisateur',
        aliases: ['champs', 'fields', 'formulaire', 'form', 'nom', 'name', 'téléphone', 'phone', 'wilaya', 'commune', 'adresse', 'address', 'note'],
        subProperties: ['nom', 'name', 'téléphone', 'phone', 'wilaya', 'commune', 'adresse', 'address', 'note', 'placeholder', 'obligatoire', 'required', 'visible'],
    },
    {
        id: 'delivery',
        label: 'Type de Livraison',
        icon: faTruck,
        accentClass: 'from-emerald-500 to-green-600',
        description: 'Maison ou bureau',
        aliases: ['delivery', 'livraison', 'type', 'maison', 'home', 'bureau', 'desk', 'bureau de poste'],
        subProperties: ['domicile', 'home', 'bureau', 'desk', 'activer', 'enable', 'style'],
    },
    {
        id: 'offers',
        label: 'Design Offres',
        icon: faStar,
        accentClass: 'from-amber-500 to-yellow-600',
        description: 'Apparence des cartes d\'offres',
        aliases: ['offers design', 'design offres', 'carte offre', 'offer card', 'apparence'],
        subProperties: ['style carte', 'card style', 'badge', 'couleur', 'color', 'sélection', 'selection'],
    },
    {
        id: 'promoCode',
        label: 'Design Code Promo',
        icon: faTicket,
        accentClass: 'from-violet-500 to-purple-600',
        description: 'Apparence du champ promo',
        aliases: ['promo design', 'design promo', 'champ promo', 'promo field'],
        subProperties: ['style', 'placeholder', 'bouton', 'button'],
    },
];

interface BuilderSearchProps {
    onNavigate: (sectionId: string) => void;
}

export const BuilderSearch = ({ onNavigate }: BuilderSearchProps) => {
    const [query, setQuery] = useState('');
    const [isFocused, setIsFocused] = useState(false);
    const [selectedIndex, setSelectedIndex] = useState(0);
    const inputRef = useRef<HTMLInputElement>(null);
    const listRef = useRef<HTMLDivElement>(null);

    /** Deep search: matches label, aliases, description, AND sub-properties */
    const results = useMemo(() => {
        if (!query.trim()) return [];
        const q = query.toLowerCase().trim();
        const words = q.split(/\s+/);

        return SEARCHABLE_ITEMS
            .map((item) => {
                let score = 0;

                // Exact label match = highest
                if (item.label.toLowerCase().includes(q)) score += 100;

                // Alias match
                if (item.aliases.some((a) => a.includes(q))) score += 80;

                // Description match
                if (item.description.toLowerCase().includes(q)) score += 60;

                // Sub-property match (the "deeper" search)
                const subMatches = item.subProperties.filter((sp) =>
                    words.every((w) => sp.toLowerCase().includes(w))
                );
                if (subMatches.length > 0) score += 40 + subMatches.length * 5;

                // Multi-word partial matching across all fields
                if (score === 0) {
                    const allText = [item.label, item.description, ...item.aliases, ...item.subProperties]
                        .join(' ')
                        .toLowerCase();
                    if (words.every((w) => allText.includes(w))) score += 30;
                }

                return { ...item, score, subMatches };
            })
            .filter((item) => item.score > 0)
            .sort((a, b) => b.score - a.score);
    }, [query]);

    const showResults = isFocused && query.trim().length > 0;

    useEffect(() => {
        setSelectedIndex(0);
    }, [results.length]);

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (!showResults || results.length === 0) return;

        if (e.key === 'ArrowDown') {
            e.preventDefault();
            setSelectedIndex((prev) => Math.min(prev + 1, results.length - 1));
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setSelectedIndex((prev) => Math.max(prev - 1, 0));
        } else if (e.key === 'Enter') {
            e.preventDefault();
            onNavigate(results[selectedIndex].id);
            setQuery('');
            inputRef.current?.blur();
        } else if (e.key === 'Escape') {
            setQuery('');
            inputRef.current?.blur();
        }
    };

    return (
        <div className="relative mb-4">
            {/* Search Input */}
            <div className="relative">
                <FontAwesomeIcon
                    icon={faSearch}
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
                    style={{ fontSize: 13 }}
                />
                <input
                    ref={inputRef}
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onFocus={() => setIsFocused(true)}
                    onBlur={() => setTimeout(() => setIsFocused(false), 200)}
                    onKeyDown={handleKeyDown}
                    placeholder="Rechercher un paramètre..."
                    className="w-full pl-10 pr-9 py-2.5 text-xs font-medium text-slate-700 bg-slate-50 border border-slate-200 rounded-xl
                     outline-none transition-all duration-200
                     focus:bg-white focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100 focus:shadow-sm
                     placeholder:text-slate-400"
                />
                {query && (
                    <button
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => { setQuery(''); inputRef.current?.focus(); }}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                    >
                        <FontAwesomeIcon icon={faTimes} style={{ fontSize: 13 }} />
                    </button>
                )}
            </div>

            {/* Results Dropdown */}
            {showResults && (
                <div
                    ref={listRef}
                    className="absolute z-50 top-full mt-1.5 left-0 right-0 bg-white border border-slate-200 rounded-xl shadow-xl max-h-[320px] overflow-y-auto custom-scroll animate-in fade-in slide-in-from-top-2 duration-150"
                >
                    {results.length === 0 ? (
                        <div className="p-4 text-center text-xs text-slate-400 font-medium">
                            Aucun résultat pour "{query}"
                        </div>
                    ) : (
                        <div className="p-1.5">
                            {results.map((item, idx) => (
                                <button
                                    key={item.id}
                                    onMouseDown={(e) => e.preventDefault()}
                                    onClick={() => {
                                        onNavigate(item.id);
                                        setQuery('');
                                    }}
                                    className={`w-full flex items-center gap-3 p-2.5 rounded-lg transition-all text-left ${idx === selectedIndex
                                        ? 'bg-indigo-50 text-indigo-700'
                                        : 'hover:bg-slate-50 text-slate-700'
                                        }`}
                                >
                                    <div
                                        className={`w-7 h-7 rounded-lg bg-gradient-to-br ${item.accentClass} flex items-center justify-center text-white shrink-0`}
                                    >
                                        <FontAwesomeIcon icon={item.icon} style={{ fontSize: 12 }} />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <span className="block text-[12px] font-bold leading-tight truncate">
                                            {item.label}
                                        </span>
                                        <span className="block text-[10px] text-slate-400 font-medium leading-tight truncate">
                                            {item.description}
                                        </span>
                                        {/* Show matching sub-properties for context */}
                                        {item.subMatches && item.subMatches.length > 0 && (
                                            <span className="block text-[9px] text-indigo-400 font-medium mt-0.5 truncate">
                                                → {item.subMatches.slice(0, 3).join(', ')}
                                            </span>
                                        )}
                                    </div>
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};
