/**
 * Converts a price to letters in French or Arabic
 * Supports Dinars and Centimes modes
 */

export const priceToLetters = (
  amount: number,
  lang: "fr" | "ar",
  mode: "dinars" | "centimes" = "dinars",
): string => {
  // Convert to centimes if needed (1 DA = 100 Centimes)
  const finalAmount = mode === "centimes" ? amount * 100 : amount;

  if (lang === "fr") {
    const text = numberToFrench(finalAmount);
    return mode === "centimes" ? `${text} centimes` : `${text} dinars algérien`;
  } else {
    const text = numberToArabic(finalAmount);
    return mode === "centimes" ? `${text} سنتيم` : `${text} دينار جزائري`;
  }
};

// --- French Conversion Helpers ---
const frenchUnits = [
  "",
  "un",
  "deux",
  "trois",
  "quatre",
  "cinq",
  "six",
  "sept",
  "huit",
  "neuf",
];
const frenchTeens = [
  "dix",
  "onze",
  "douze",
  "treize",
  "quatorze",
  "quinze",
  "seize",
  "dix-sept",
  "dix-huit",
  "dix-neuf",
];
const frenchTens = [
  "",
  "dix",
  "vingt",
  "trente",
  "quarante",
  "cinquante",
  "soixante",
  "soixante-dix",
  "quatre-vingts",
  "quatre-vingt-dix",
];

function numberToFrench(n: number): string {
  n = Math.floor(n);
  if (n === 0) return "zéro";

  if (n < 10) return frenchUnits[n];
  if (n < 20) return frenchTeens[n - 10];
  if (n < 100) {
    const ten = Math.floor(n / 10);
    const remainder = n % 10;

    // Special handling for 70s and 90s
    if (ten === 7 || ten === 9) {
      return `${frenchTens[ten - 1]}${remainder === 1 ? "-et-onze" : "-" + frenchTeens[remainder]}`; // Simplified approximation
    }
    // Fix 70s/90s generally:
    if (n >= 70 && n < 80) {
      // 70 = soixante-dix, 71 = soixante-et-onze
      const rem = n - 60;
      if (rem === 11) return "soixante-et-onze";
      return `soixante-${numberToFrench(rem)}`;
    }
    if (n >= 90 && n < 100) {
      const rem = n - 80;
      return `quatre-vingt-${numberToFrench(rem)}`;
    }

    if (remainder === 0) return frenchTens[ten];
    return `${frenchTens[ten]}${remainder === 1 ? "-et-un" : "-" + frenchUnits[remainder]}`;
  }

  if (n < 1000) {
    const hundred = Math.floor(n / 100);
    const remainder = n % 100;
    const prefix = hundred === 1 ? "cent" : `${frenchUnits[hundred]} cent`;
    if (remainder === 0) return prefix;
    return `${prefix} ${numberToFrench(remainder)}`;
  }

  if (n < 1000000) {
    const thousand = Math.floor(n / 1000);
    const remainder = n % 1000;
    const prefix = thousand === 1 ? "mille" : `${numberToFrench(thousand)} mille`;
    if (remainder === 0) return prefix;
    return `${prefix} ${numberToFrench(remainder)}`;
  }

  // For million+ (simplified for typical COD prices)
  if (n >= 1000000) {
    return n.toString(); // Fallback for huge numbers
  }

  return n.toString();
}

// --- Arabic Conversion Helpers ---
// Simplified Arabic conversion for common layouts
const arUnits = [
  "",
  "واحد",
  "اثنان",
  "ثلاثة",
  "أربعة",
  "خمسة",
  "ستة",
  "سبعة",
  "ثمانية",
  "تسعة",
];
const arTeens = [
  "عشرة",
  "أحد عشر",
  "اثنا عشر",
  "ثلاثة عشر",
  "أربعة عشر",
  "خمسة عشر",
  "ستة عشر",
  "سبعة عشر",
  "ثمانية عشر",
  "تسعة عشر",
];
const arTens = [
  "",
  "عشرة",
  "عشرون",
  "ثلاثون",
  "أربعون",
  "خمسون",
  "ستون",
  "سبعون",
  "ثمانون",
  "تسعون",
];
const arHundreds = [
  "",
  "مائة",
  "مائتان",
  "ثلاثمائة",
  "أربعمائة",
  "خمسمائة",
  "ستمائة",
  "سبعمائة",
  "ثمانمائة",
  "تسعمائة",
];

function numberToArabic(n: number): string {
  n = Math.floor(n);
  if (n === 0) return "صفر";

  if (n < 10) return arUnits[n];
  if (n < 20) return arTeens[n - 10];
  if (n < 100) {
    const ten = Math.floor(n / 10);
    const rem = n % 10;
    if (rem === 0) return arTens[ten];
    return `${arUnits[rem]} و ${arTens[ten]}`;
  }
  if (n < 1000) {
    const hundred = Math.floor(n / 100);
    const rem = n % 100;
    if (rem === 0) return arHundreds[hundred];
    return `${arHundreds[hundred]} و ${numberToArabic(rem)}`;
  }
  if (n < 1000000) {
    const thousand = Math.floor(n / 1000);
    const rem = n % 1000;

    // 1000 -> alf, 2000 -> alfayn, 3-10 -> 3000 -> 3 alaf
    let prefix = "";
    if (thousand === 1) prefix = "ألف";
    else if (thousand === 2) prefix = "ألفين";
    else if (thousand >= 3 && thousand <= 10) prefix = `${arUnits[thousand]} آلاف`;
    else prefix = `${numberToArabic(thousand)} ألف`;

    if (rem === 0) return prefix;
    return `${prefix} و ${numberToArabic(rem)}`;
  }

  return n.toString();
}
