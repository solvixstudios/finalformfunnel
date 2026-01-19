/**
 * Shipping and Delivery Types
 */

// Delivery type
export type DeliveryType = "home" | "desk";

// Shipping rate structure
export interface ShippingRates {
  home: number;
  desk: number;
}

// Shipping exception (per-wilaya override)
export interface ShippingException {
  id: string;
  home: number;
  desk: number;
}

// Full shipping configuration
export interface ShippingConfig {
  standard: ShippingRates;
  exceptions: ShippingException[];
}

// Wilaya data
export interface Wilaya {
  id: string;
  name: string;
}
