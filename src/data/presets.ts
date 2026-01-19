/**
 * Style Presets Data
 * Header, urgency, and color presets for the form builder
 */

// Header style presets
export const HEADER_STYLE_PRESETS = [
  { id: "classic", name: "Classique", desc: "Produit à gauche, langue à droite" },
  { id: "centered", name: "Centré", desc: "Produit au centre" },
  { id: "minimal", name: "Minimal", desc: "Texte uniquement, sans image" },
  { id: "banner", name: "Bannière", desc: "Fond coloré accentué" },
  { id: "compact", name: "Compact", desc: "Version réduite" },
  { id: "hidden", name: "Masqué", desc: "Masque l'en-tête (sauf langue)" },
] as const;

// Urgency style presets
export const URGENCY_STYLE_PRESETS = {
  text: [
    { id: "banner", name: "Bannière", desc: "Bande colorée" },
    { id: "pill", name: "Pilule", desc: "Badge arrondi" },
    { id: "glow", name: "Lumineux", desc: "Effet néon" },
    { id: "minimal", name: "Minimal", desc: "Texte simple" },
  ],
  quantity: [
    { id: "progress", name: "Barre", desc: "Barre de progression" },
    { id: "counter", name: "Compteur", desc: "Grands chiffres" },
    { id: "badge", name: "Badge", desc: "Badge d'alerte" },
    { id: "flame", name: "Flamme", desc: "Style en feu" },
  ],
  timer: [
    { id: "digital", name: "Digital", desc: "Horloge numérique" },
    { id: "flip", name: "Flip", desc: "Cartes qui tournent" },
    { id: "minimal", name: "Minimal", desc: "Texte simple" },
    { id: "bar", name: "Barre", desc: "Barre de temps" },
  ],
} as const;

// Urgency color presets
export const URGENCY_COLOR_PRESETS = [
  {
    id: "default",
    name: "Thème",
    color: "theme",
    gradient: "theme",
    desc: "Couleur du thème",
  },
  {
    id: "red",
    name: "Rouge Urgence",
    color: "#ef4444",
    gradient: "from-red-500 to-rose-600",
  },
  {
    id: "amber",
    name: "Orange Alerte",
    color: "#f59e0b",
    gradient: "from-amber-500 to-orange-600",
  },
  {
    id: "indigo",
    name: "Indigo Pro",
    color: "#6366f1",
    gradient: "from-indigo-500 to-purple-600",
  },
  {
    id: "emerald",
    name: "Vert Succès",
    color: "#10b981",
    gradient: "from-emerald-500 to-teal-600",
  },
  {
    id: "violet",
    name: "Violet",
    color: "#8b5cf6",
    gradient: "from-violet-500 to-purple-600",
  },
  {
    id: "dynamic",
    name: "Dynamique",
    color: "auto",
    gradient: "auto",
    desc: "Couleur selon le niveau",
  },
  { id: "custom", name: "Personnalisé", color: "custom", gradient: null },
] as const;
