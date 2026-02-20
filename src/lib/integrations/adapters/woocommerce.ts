/**
 * WooCommerce Platform Adapter (Stub)
 * Will use access token only via WordPress plugin
 */

import type {
    AssignmentContext,
    ConnectResult,
    EnableLoaderResult,
    OrderData,
    PlatformAdapter,
    PlatformCredentials,
    Product,
} from './types';

export class WooCommerceAdapter implements PlatformAdapter {
  readonly platform = 'woocommerce' as const;

  async connect(_subdomain: string, _credentials: PlatformCredentials): Promise<ConnectResult> {
    throw new Error('WooCommerce integration not implemented yet');
  }

  async enableLoader(_subdomain: string, _credentials: PlatformCredentials): Promise<EnableLoaderResult> {
    throw new Error('WooCommerce integration not implemented yet');
  }

  async disableLoader(_subdomain: string, _credentials: PlatformCredentials): Promise<void> {
    throw new Error('WooCommerce integration not implemented yet');
  }

  async assignForm(
    _subdomain: string,
    _credentials: PlatformCredentials,
    _formConfig: Record<string, any>,
    _context?: AssignmentContext
  ): Promise<unknown> {
    throw new Error('WooCommerce integration not implemented yet');
  }

  async removeForm(_subdomain: string, _credentials: PlatformCredentials, _ownerId?: string): Promise<void> {
    throw new Error('WooCommerce integration not implemented yet');
  }

  async fetchProducts(_subdomain: string, _credentials: PlatformCredentials): Promise<Product[]> {
    throw new Error('WooCommerce integration not implemented yet');
  }

  async submitOrder(_orderData: OrderData): Promise<unknown> {
    throw new Error('WooCommerce integration not implemented yet');
  }
}
