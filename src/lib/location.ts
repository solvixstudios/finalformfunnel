/**
 * Location Data Utility
 * Uses bundled data to prevent 404 errors and ensure fast loading.
 */

import { RAW_COMMUNES } from "../data/communes";
import { WILAYAS } from "../data/wilayas";

export interface Wilaya {
  id: string; // "1"
  code: string; // "1"
  name: string; // "Adrar"
  ar_name: string; // "أدرار"
}

export interface Commune {
  pk: number;
  model: string;
  fields: {
    postcode: number;
    wilaya: number; // Foreign Key to Wilaya ID (integer)
    name: string;
  };
}

/**
 * Fetch all Wilayas
 * Returns bundled data instantly
 */
export async function fetchWilayas(): Promise<Wilaya[]> {
  // Map existing WILAYAS to the interface expected by components
  return WILAYAS.map((w: any) => ({
    id: w.id,
    code: w.id,
    name: w.name,
    ar_name: w.name, // Fallback: real Arabic names would require a richer data source, but this prevents crashes
  }));
}

/**
 * Fetch all Communes
 * Returns filtered list by Wilaya ID instantly from bundle
 */
export async function fetchCommunes(wilayaId: string | number): Promise<Commune[]> {
  const wId = typeof wilayaId === "string" ? parseInt(wilayaId, 10) : wilayaId;
  return (RAW_COMMUNES as Commune[]).filter((c) => c.fields.wilaya === wId);
}
