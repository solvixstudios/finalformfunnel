/**
 * UI Labels Data
 * Field and section labels for the form builder
 */

export const FIELD_LABELS: Record<string, { fr: string; ar: string; icon: string }> =
  {
    name: { fr: "Nom et Prénom", ar: "الاسم واللقب", icon: "user" },
    phone: { fr: "Numéro de téléphone", ar: "رقم الهاتف", icon: "phone" },
    wilaya: { fr: "Wilaya", ar: "الولاية", icon: "map-pin" },
    commune: { fr: "Commune", ar: "البلدية", icon: "map" },
    address: { fr: "Adresse complète", ar: "العنوان الكامل", icon: "home" },
    note: { fr: "Note / Observation", ar: "ملاحظة", icon: "clipboard-list" },
    location_block: { fr: "Localisation", ar: "الموقع", icon: "map-pin" },
  };

export const SECTION_LABELS: Record<string, { fr: string; icon: string }> = {
  variants: { fr: "Variantes / Modèles", icon: "layout-grid" },
  shipping: { fr: "Formulaire Livraison", icon: "smartphone" },
  delivery: { fr: "Type de Livraison", icon: "truck" },
  offers: { fr: "Liste des Offres", icon: "tag" },
  promoCode: { fr: "Code Promo", icon: "ticket" },
  summary: { fr: "Résumé de commande", icon: "receipt" },
  cta: { fr: "Bouton d'action", icon: "mouse-pointer-click" },
  urgencyText: { fr: "Urgence - Texte", icon: "zap" },
  urgencyQuantity: { fr: "Urgence - Stock", icon: "package" },
  urgencyTimer: { fr: "Urgence - Timer", icon: "clock" },
  trustBadges: { fr: "Badges de Confiance", icon: "shield-check" },
};
