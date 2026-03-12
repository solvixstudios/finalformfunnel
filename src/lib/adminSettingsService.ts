/**
 * Admin Settings Service
 * Firestore CRUD for platform-level admin settings (payment config, plans).
 * Stored in: appConfig/settings (payment), appConfig/plans (pricing plans)
 */

import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from './firebase';
import type { PricingPlan } from '@/types/subscription';

// ── Types ───────────────────────────────────────────────────────

export interface PaymentConfig {
  whatsappNumber: string;
  ccp: {
    enabled: boolean;
    accountName: string;
    accountNumber: string;
    instructions: string;
  };
  baridiPay: {
    enabled: boolean;
    rip: string;
    instructions: string;
  };
  redotpay: {
    enabled: boolean;
    link: string;
    instructions: string;
  };
  usdt: {
    enabled: boolean;
    network: string;
    walletAddress: string;
    instructions: string;
  };
}

export interface AdminSettings {
  paymentConfig: PaymentConfig;
  updatedAt: string;
  updatedBy: string;
}

// ── Default values ──────────────────────────────────────────────

export const DEFAULT_PAYMENT_CONFIG: PaymentConfig = {
  whatsappNumber: '213550000000',
  ccp: {
    enabled: true,
    accountName: 'SOLVIX ALGERIE',
    accountNumber: '0023456789 / Clé 42',
    instructions: 'Transfer the exact amount to the CCP account above, then come back and submit your proof.',
  },
  baridiPay: {
    enabled: true,
    rip: '00799999 0023456789 42',
    instructions: 'Send via BaridiMob to the RIP above, then come back and submit your proof.',
  },
  redotpay: {
    enabled: true,
    link: 'https://url.hk/i/en/dwkj1',
    instructions: 'Pay using your RedotPay card or app via the link above. Screenshot the confirmation.',
  },
  usdt: {
    enabled: true,
    network: 'BEP-20 (BSC)',
    walletAddress: '0x0000000000000000000000000000000000000000',
    instructions: 'Send USDT to the wallet address above on the BEP-20 network. Copy the TX hash as proof.',
  },
};

const SETTINGS_DOC = 'appConfig/settings';
const PLANS_DOC = 'appConfig/plans';

// ── Settings CRUD ───────────────────────────────────────────────

export async function getAdminSettings(): Promise<AdminSettings> {
  const ref = doc(db, SETTINGS_DOC);
  const snap = await getDoc(ref);
  if (snap.exists()) {
    const data = snap.data() as AdminSettings;
    // Merge with defaults to pick up any new fields
    return {
      ...data,
      paymentConfig: { ...DEFAULT_PAYMENT_CONFIG, ...data.paymentConfig },
    };
  }
  return {
    paymentConfig: DEFAULT_PAYMENT_CONFIG,
    updatedAt: new Date().toISOString(),
    updatedBy: 'system',
  };
}

export async function saveAdminSettings(
  settings: Partial<AdminSettings>,
  adminEmail: string
): Promise<void> {
  const ref = doc(db, SETTINGS_DOC);
  const existing = await getAdminSettings();
  await setDoc(ref, {
    ...existing,
    ...settings,
    updatedAt: new Date().toISOString(),
    updatedBy: adminEmail,
  });
}

export async function getPaymentConfig(): Promise<PaymentConfig> {
  const settings = await getAdminSettings();
  return settings.paymentConfig;
}

export async function savePaymentConfig(
  config: PaymentConfig,
  adminEmail: string
): Promise<void> {
  await saveAdminSettings({ paymentConfig: config }, adminEmail);
}

// ── Plans CRUD ──────────────────────────────────────────────────

/**
 * Get plans from Firestore. Falls back to hardcoded defaults if no doc.
 */
export async function getPlans(): Promise<PricingPlan[]> {
  const ref = doc(db, PLANS_DOC);
  const snap = await getDoc(ref);
  if (snap.exists()) {
    const data = snap.data();
    if (Array.isArray(data.plans) && data.plans.length > 0) {
      return data.plans as PricingPlan[];
    }
  }
  // Return null to signal "use hardcoded defaults"
  return [];
}

/**
 * Save plans to Firestore.
 */
export async function savePlans(
  plans: PricingPlan[],
  adminEmail: string
): Promise<void> {
  const ref = doc(db, PLANS_DOC);
  await setDoc(ref, {
    plans,
    updatedAt: new Date().toISOString(),
    updatedBy: adminEmail,
  });
}
