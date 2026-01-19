import { useMemo } from "react";

interface Offer {
  id: string;
  qty: number;
  discount: number;
  _type: "perc" | "fixed";
}

interface ShippingConfig {
  standard: { home: number; desk: number };
  exceptions: Array<{ id: string; home: number; desk: number }>;
}

interface AppliedPromoCode {
  code: string;
  applyTo: "subtotal" | "shipping" | "total";
  discountMode: "free" | "percentage" | "fixed";
  discountValue: number;
}

interface CalculationResult {
  basePrice: number;
  offerPrice: number;
  shippingCost: number;
  promoDiscount: {
    subtotalDiscount: number;
    shippingDiscount: number;
    totalDiscount: number;
  };
  totalPromoDiscount: number;
  displayedTotal: number;
  selectedOffer: Offer | undefined;
}

interface UsePreviewCalculationsProps {
  offers: Offer[];
  selectedOfferId: string;
  shipping: ShippingConfig | null;
  selectedWilaya: string;
  shippingType: "home" | "desk";
  appliedPromoCode: AppliedPromoCode | null;
  hideShippingInSummary: boolean;
  basePricePerUnit?: number;
}

/**
 * Hook for all price and discount calculations in the form preview
 */
export function usePreviewCalculations({
  offers,
  selectedOfferId,
  shipping,
  selectedWilaya,
  shippingType,
  appliedPromoCode,
  hideShippingInSummary,
  basePricePerUnit = 2500,
}: UsePreviewCalculationsProps): CalculationResult {
  return useMemo(() => {
    // Find selected offer
    const selectedOffer = offers.find((o) => o.id === selectedOfferId) || offers[0];

    // Calculate offer price
    const offerPrice = selectedOffer
      ? selectedOffer._type === "perc"
        ? basePricePerUnit * selectedOffer.qty * (1 - selectedOffer.discount / 100)
        : basePricePerUnit * selectedOffer.qty - selectedOffer.discount
      : basePricePerUnit;

    // Calculate shipping cost
    let shippingCost = 0;
    if (shipping) {
      shippingCost =
        shippingType === "home" ? shipping.standard.home : shipping.standard.desk;
      if (selectedWilaya) {
        const exception = shipping.exceptions.find((e) => e.id === selectedWilaya);
        if (exception) {
          shippingCost = shippingType === "home" ? exception.home : exception.desk;
        }
      }
    }

    // Calculate promo discount
    let subtotalDiscount = 0;
    let shippingDiscount = 0;
    let totalDiscount = 0;

    if (appliedPromoCode) {
      const { applyTo, discountMode, discountValue } = appliedPromoCode;

      if (applyTo === "subtotal") {
        if (discountMode === "free") {
          subtotalDiscount = offerPrice;
        } else if (discountMode === "percentage") {
          subtotalDiscount = offerPrice * (discountValue / 100);
        } else {
          subtotalDiscount = Math.min(discountValue, offerPrice);
        }
      } else if (applyTo === "shipping") {
        if (discountMode === "free") {
          shippingDiscount = shippingCost;
        } else if (discountMode === "percentage") {
          shippingDiscount = shippingCost * (discountValue / 100);
        } else {
          shippingDiscount = Math.min(discountValue, shippingCost);
        }
      } else if (applyTo === "total") {
        const total = offerPrice + shippingCost;
        if (discountMode === "free") {
          totalDiscount = total;
        } else if (discountMode === "percentage") {
          totalDiscount = total * (discountValue / 100);
        } else {
          totalDiscount = Math.min(discountValue, total);
        }
      }
    }

    const promoDiscount = { subtotalDiscount, shippingDiscount, totalDiscount };
    const totalPromoDiscount = subtotalDiscount + shippingDiscount + totalDiscount;

    // Calculate displayed total
    const displayedTotal = hideShippingInSummary
      ? offerPrice - subtotalDiscount - totalDiscount
      : offerPrice + shippingCost - totalPromoDiscount;

    return {
      basePrice: basePricePerUnit,
      offerPrice,
      shippingCost,
      promoDiscount,
      totalPromoDiscount,
      displayedTotal,
      selectedOffer,
    };
  }, [
    offers,
    selectedOfferId,
    shipping,
    selectedWilaya,
    shippingType,
    appliedPromoCode,
    hideShippingInSummary,
    basePricePerUnit,
  ]);
}
