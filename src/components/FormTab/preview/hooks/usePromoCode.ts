import { useCallback, useState } from "react";

export interface PromoCode {
  code: string;
  applyTo: "subtotal" | "shipping" | "total";
  discountMode: "free" | "percentage" | "fixed";
  discountValue: number;
  limitType?: "unlimited" | "date_range" | "use_count";
  startDate?: string;
  endDate?: string;
  maxUses?: number;
  currentUses?: number;
  isActive: boolean;
}

export interface AppliedPromoCode {
  code: string;
  applyTo: "subtotal" | "shipping" | "total";
  discountMode: "free" | "percentage" | "fixed";
  discountValue: number;
}

interface UsePromoCodeReturn {
  promoCodeInput: string;
  setPromoCodeInput: (value: string) => void;
  appliedPromoCode: AppliedPromoCode | null;
  promoCodeError: boolean;
  promoCodeSuccess: boolean;
  handleApplyPromoCode: () => void;
  handleRemovePromoCode: () => void;
}

/**
 * Hook for managing promo code state and validation
 */
export function usePromoCode(availableCodes: PromoCode[] = []): UsePromoCodeReturn {
  const [promoCodeInput, setPromoCodeInput] = useState("");
  const [appliedPromoCode, setAppliedPromoCode] = useState<AppliedPromoCode | null>(
    null
  );
  const [promoCodeError, setPromoCodeError] = useState(false);
  const [promoCodeSuccess, setPromoCodeSuccess] = useState(false);

  const handleApplyPromoCode = useCallback(() => {
    setPromoCodeError(false);
    setPromoCodeSuccess(false);

    if (!promoCodeInput.trim()) return;

    const foundCode = availableCodes.find(
      (c) => c.code.toUpperCase() === promoCodeInput.toUpperCase() && c.isActive
    );

    if (foundCode) {
      // Check date range if applicable
      if (foundCode.limitType === "date_range") {
        const now = new Date();
        const start = foundCode.startDate ? new Date(foundCode.startDate) : null;
        const end = foundCode.endDate ? new Date(foundCode.endDate) : null;
        if ((start && now < start) || (end && now > end)) {
          setPromoCodeError(true);
          return;
        }
      }
      // Check use count if applicable
      if (foundCode.limitType === "use_count" && foundCode.maxUses) {
        if ((foundCode.currentUses || 0) >= foundCode.maxUses) {
          setPromoCodeError(true);
          return;
        }
      }

      setAppliedPromoCode({
        code: foundCode.code,
        applyTo: foundCode.applyTo,
        discountMode: foundCode.discountMode,
        discountValue: foundCode.discountValue,
      });
      setPromoCodeSuccess(true);
      setPromoCodeInput("");
    } else {
      setPromoCodeError(true);
    }
  }, [promoCodeInput, availableCodes]);

  const handleRemovePromoCode = useCallback(() => {
    setAppliedPromoCode(null);
    setPromoCodeSuccess(false);
  }, []);

  return {
    promoCodeInput,
    setPromoCodeInput,
    appliedPromoCode,
    promoCodeError,
    promoCodeSuccess,
    handleApplyPromoCode,
    handleRemovePromoCode,
  };
}
