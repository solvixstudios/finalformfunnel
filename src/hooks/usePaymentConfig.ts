/**
 * usePlans hook — loads plans from Firestore, falls back to hardcoded defaults.
 * usePaymentConfig hook — loads payment config from Firestore.
 */

import { useEffect, useState } from 'react';
import { getPaymentConfig, getPlans, type PaymentConfig, DEFAULT_PAYMENT_CONFIG } from '@/lib/adminSettingsService';
import { DEFAULT_PLANS } from '@/data/plans';
import type { PricingPlan } from '@/types/subscription';

export function usePaymentConfig() {
  const [config, setConfig] = useState<PaymentConfig>(DEFAULT_PAYMENT_CONFIG);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const c = await getPaymentConfig();
        if (!cancelled) setConfig(c);
      } catch (error) {
        console.error('Failed to load payment config:', error);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  return { config, isLoading };
}

export function usePlans() {
  const [plans, setPlans] = useState<PricingPlan[]>(DEFAULT_PLANS);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const firestorePlans = await getPlans();
        if (!cancelled && firestorePlans.length > 0) {
          setPlans(firestorePlans);
        }
      } catch (error) {
        console.error('Failed to load plans from Firestore:', error);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  return { plans, isLoading };
}
