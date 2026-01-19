/**
 * Editor UI Labels
 * Translations for form builder editor components
 */

export interface EditorLabels {
  fr: string;
  ar: string;
  en?: string;
}

// Common editor labels
export const EDITOR_COMMON: Record<string, EditorLabels> = {
  enable: { fr: "Activer", ar: "تفعيل", en: "Enable" },
  showTitle: { fr: "Afficher le titre", ar: "إظهار العنوان", en: "Show title" },
  displayStyle: { fr: "Style d'affichage", ar: "نمط العرض", en: "Display style" },
  color: { fr: "Couleur", ar: "اللون", en: "Color" },
  customText: { fr: "Texte personnalisé", ar: "نص مخصص", en: "Custom text" },
  optional: { fr: "optionnel", ar: "اختياري", en: "optional" },
  leaveEmpty: {
    fr: "Laissez vide pour texte par défaut",
    ar: "اتركه فارغاً للنص الافتراضي",
    en: "Leave empty for default",
  },
  french: { fr: "Français", ar: "الفرنسية", en: "French" },
  arabic: { fr: "العربية", ar: "العربية", en: "Arabic" },
  icon: { fr: "Icône", ar: "أيقونة", en: "Icon" },
  animation: { fr: "Animation", ar: "الرسوم المتحركة", en: "Animation" },
  showLabel: { fr: "Afficher le label", ar: "إظهار التسمية", en: "Show label" },
};

// Urgency Text Editor
export const EDITOR_URGENCY_TEXT: Record<string, EditorLabels> = {
  title: { fr: "Texte d'urgence", ar: "نص الاستعجال", en: "Urgency text" },
  description: {
    fr: "Message personnalisé pour créer l'urgence",
    ar: "رسالة مخصصة لخلق الاستعجال",
    en: "Custom message to create urgency",
  },
  enableDesc: {
    fr: "Affiche un message d'urgence animé",
    ar: "يعرض رسالة استعجال متحركة",
    en: "Display animated urgency message",
  },
  displayedText: { fr: "Texte affiché", ar: "النص المعروض", en: "Displayed text" },
  placeholderFr: {
    fr: "⚡ Offre limitée!",
    ar: "⚡ Offre limitée!",
    en: "⚡ Limited offer!",
  },
  placeholderAr: { fr: "⚡ عرض محدود!", ar: "⚡ عرض محدود!", en: "⚡ عرض محدود!" },
};

// Urgency Timer Editor
export const EDITOR_URGENCY_TIMER: Record<string, EditorLabels> = {
  title: { fr: "Compte à Rebours", ar: "العد التنازلي", en: "Countdown Timer" },
  description: {
    fr: "Timer d'urgence avec heures, minutes et secondes",
    ar: "مؤقت الاستعجال مع الساعات والدقائق والثواني",
    en: "Urgency timer with hours, minutes and seconds",
  },
  enableDesc: {
    fr: "Affiche un compte à rebours",
    ar: "يعرض العد التنازلي",
    en: "Display countdown",
  },
  timeRemaining: { fr: "Temps restant", ar: "الوقت المتبقي", en: "Time remaining" },
  hours: { fr: "Heures", ar: "ساعات", en: "Hours" },
  minutes: { fr: "Minutes", ar: "دقائق", en: "Minutes" },
  seconds: { fr: "Secondes", ar: "ثواني", en: "Seconds" },
  infoFlip: {
    fr: 'Le style "Flip" offre un look premium avec un fond sombre. Le compte à rebours est affiché en temps réel dans le formulaire.',
    ar: 'يوفر نمط "Flip" مظهرًا فاخرًا بخلفية داكنة. يتم عرض العد التنازلي في الوقت الفعلي.',
    en: 'The "Flip" style offers a premium look with dark background.',
  },
};

// Urgency Quantity/Stock Editor
export const EDITOR_URGENCY_QUANTITY: Record<string, EditorLabels> = {
  title: { fr: "Urgence Stock", ar: "إلحاح المخزون", en: "Stock Urgency" },
  description: {
    fr: "Affiche la quantité restante en stock",
    ar: "يعرض الكمية المتبقية في المخزون",
    en: "Display remaining stock quantity",
  },
  enableDesc: {
    fr: "Affiche le compteur de stock",
    ar: "يعرض عداد المخزون",
    en: "Display stock counter",
  },
  stockQuantity: {
    fr: "Quantité en stock",
    ar: "الكمية في المخزون",
    en: "Stock quantity",
  },
  infoDynamic: {
    fr: 'Le mode "Dynamique" change la couleur selon le stock: vert (8+), orange (4-7), rouge (1-3).',
    ar: 'يغير الوضع "الديناميكي" اللون حسب المخزون: أخضر (8+)، برتقالي (4-7)، أحمر (1-3).',
    en: "Dynamic mode changes color based on stock level.",
  },
};

// Trust Badges Editor
export const EDITOR_TRUST_BADGES: Record<string, EditorLabels> = {
  title: { fr: "Badges de Confiance", ar: "شارات الثقة", en: "Trust Badges" },
  description: {
    fr: "Renforcez la confiance des clients",
    ar: "عزز ثقة العملاء",
    en: "Reinforce customer trust",
  },
  showTitleDesc: {
    fr: 'Titre "Garanties" au-dessus des badges',
    ar: 'عنوان "الضمانات" فوق الشارات',
    en: '"Guarantees" title above badges',
  },
  availableBadges: {
    fr: "Badges disponibles",
    ar: "الشارات المتاحة",
    en: "Available badges",
  },
  sectionTitle: {
    fr: "Titre de la section",
    ar: "عنوان القسم",
    en: "Section title",
  },
  infoText: {
    fr: "Les badges de confiance s'affichent dans une grille avec des icônes colorées. Ils rassurent les clients sur la qualité de votre service.",
    ar: "تُعرض شارات الثقة في شبكة بأيقونات ملونة. تطمئن العملاء على جودة خدمتك.",
    en: "Trust badges display in a grid with colored icons.",
  },
};

// Badge names
export const BADGE_LABELS: Record<string, EditorLabels> = {
  cod: {
    fr: "Paiement à la livraison",
    ar: "الدفع عند الاستلام",
    en: "Cash on delivery",
  },
  guarantee: { fr: "Garantie qualité", ar: "ضمان الجودة", en: "Quality guarantee" },
  return: { fr: "Retour facile", ar: "إرجاع سهل", en: "Easy return" },
  support: { fr: "Support 24/7", ar: "دعم 24/7", en: "24/7 Support" },
  fastDelivery: { fr: "Livraison rapide", ar: "توصيل سريع", en: "Fast delivery" },
};

// Style preset names (matching presets.ts with translations)
export const STYLE_NAMES: Record<string, EditorLabels> = {
  // Text styles
  banner: { fr: "Bannière", ar: "لافتة", en: "Banner" },
  pill: { fr: "Pilule", ar: "حبة", en: "Pill" },
  glow: { fr: "Lumineux", ar: "متوهج", en: "Glow" },
  minimal: { fr: "Minimal", ar: "بسيط", en: "Minimal" },
  // Quantity styles
  progress: { fr: "Barre", ar: "شريط", en: "Progress" },
  counter: { fr: "Compteur", ar: "عداد", en: "Counter" },
  badge: { fr: "Badge", ar: "شارة", en: "Badge" },
  flame: { fr: "Flamme", ar: "لهب", en: "Flame" },
  // Timer styles
  digital: { fr: "Digital", ar: "رقمي", en: "Digital" },
  flip: { fr: "Flip", ar: "قلب", en: "Flip" },
  bar: { fr: "Barre", ar: "شريط", en: "Bar" },
  compact: { fr: "Compact", ar: "مختصر", en: "Compact" },
  // Trust badge styles
  cards: { fr: "Cartes", ar: "بطاقات", en: "Cards" },
  pills: { fr: "Pilules", ar: "حبوب", en: "Pills" },
  lines: { fr: "Lignes", ar: "خطوط", en: "Lines" },
  compactLines: { fr: "Compact", ar: "مختصر", en: "Compact" },
};

// Color preset names
export const COLOR_NAMES: Record<string, EditorLabels> = {
  red: { fr: "Rouge Urgence", ar: "أحمر عاجل", en: "Urgent Red" },
  amber: { fr: "Orange Alerte", ar: "برتقالي تنبيه", en: "Alert Orange" },
  indigo: { fr: "Indigo Pro", ar: "نيلي احترافي", en: "Pro Indigo" },
  emerald: { fr: "Vert Succès", ar: "أخضر نجاح", en: "Success Green" },
  violet: { fr: "Violet", ar: "بنفسجي", en: "Violet" },
  dynamic: { fr: "Dynamique", ar: "ديناميكي", en: "Dynamic" },
  custom: { fr: "Personnalisé", ar: "مخصص", en: "Custom" },
};

// Mobile tab labels
export const MOBILE_TABS: Record<string, EditorLabels> = {
  editor: { fr: "Éditeur", ar: "المحرر", en: "Editor" },
  preview: { fr: "Aperçu", ar: "معاينة", en: "Preview" },
};

/**
 * Helper to get label for current language
 */
export const getLabel = (
  labels: EditorLabels,
  lang: "fr" | "ar" | "en" = "fr"
): string => {
  return labels[lang] || labels.fr;
};
