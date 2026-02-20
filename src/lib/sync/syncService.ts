/**
 * Sync Service - Centralized Firebase ↔ n8n synchronization
 *
 * Handles all form publishing, unpublishing, and sync operations
 * with proper error handling and rollback support.
 */

import type { ConnectedStore, FormAssignment } from '../firebase/types';
import { getAdapter } from '../integrations';

// Types
export interface SyncResult {
  success: boolean;
  successCount: number;
  failedCount: number;
  totalCount: number;
  errors: SyncError[];
}

export interface SyncError {
  storeId: string;
  productId?: string;
  message: string;
}

export interface PublishParams {
  formId: string;
  formName: string;
  formConfig: Record<string, any>;
  store: ConnectedStore;
  assignmentType: 'store' | 'product';
  productId?: string;
  productHandle?: string;
}

export interface UnpublishParams {
  store: ConnectedStore;
  productId?: string;
}

export interface SyncFormChangesParams {
  formId: string;
  formName: string;
  formConfig: Record<string, any>;
  assignments: FormAssignment[];
  stores: ConnectedStore[];
}

/**
 * Publish form to a single store or product
 */
export async function publishToStore(params: PublishParams): Promise<{ success: boolean; error?: string }> {
  const { formId, formName, formConfig, store, assignmentType, productId, productHandle } = params;

  // Validate required fields
  if (!formId) {
    return { success: false, error: 'formId is required' };
  }
  if (!store.clientId || !store.clientSecret) {
    return { success: false, error: 'Store credentials missing' };
  }

  const subdomain = store.url.replace('.myshopify.com', '').replace(/https?:\/\//, '');

  try {
    const adapter = getAdapter(store.platform || 'shopify');

    // DEBUG: Trace payload before sending to adapter
    console.log(`[SyncDebug] publishToStore: Sending to adapter for store ${store.id}`, {
      subdomain,
      pixelDataCount: formConfig.addons?.pixelData?.length || 0,
      tiktokPixelDataCount: formConfig.addons?.tiktokPixelData?.length || 0,
      sheetsCount: formConfig.addons?.sheets?.length || 0
    });

    await adapter.assignForm(
      subdomain,
      { clientId: store.clientId, clientSecret: store.clientSecret },
      formConfig,
      {
        formId,
        formName,
        assignmentType,
        storeId: store.id,
        storeName: store.name,
        shopifyDomain: store.url,
        productId,
        productHandle,
      }
    );
    return { success: true };
  } catch (error: unknown) {
    console.error(`Sync failed for store ${store.id}:`, error);
    return { success: false, error: error.message || 'Unknown error' };
  }
}

/**
 * Unpublish form from a store or product
 */
export async function unpublishFromStore(params: UnpublishParams): Promise<{ success: boolean; error?: string }> {
  const { store, productId } = params;

  if (!store.clientId || !store.clientSecret) {
    return { success: false, error: 'Store credentials missing' };
  }

  const subdomain = store.url.replace('.myshopify.com', '').replace(/https?:\/\//, '');

  try {
    const adapter = getAdapter(store.platform || 'shopify');
    await adapter.removeForm(
      subdomain,
      { clientId: store.clientId, clientSecret: store.clientSecret },
      productId
    );
    return { success: true };
  } catch (error: unknown) {
    console.error(`Unpublish failed for store ${store.id}:`, error);
    return { success: false, error: error.message || 'Unknown error' };
  }
}

/**
 * Sync form changes to all active assignments
 * Used when saving a form that's already published
 */
export async function syncFormChanges(params: SyncFormChangesParams): Promise<SyncResult> {
  const { formId, formName, formConfig, assignments, stores } = params;

  // Filter active assignments for this form
  const activeAssignments = assignments.filter(a => a.formId === formId && a.isActive);

  if (activeAssignments.length === 0) {
    return {
      success: true,
      successCount: 0,
      failedCount: 0,
      totalCount: 0,
      errors: [],
    };
  }

  const errors: SyncError[] = [];
  let successCount = 0;

  // Process in batches of 5 to avoid Shopify API rate limits (429)
  const BATCH_SIZE = 5;
  const DELAY_BETWEEN_BATCHES_MS = 1000;

  for (let i = 0; i < activeAssignments.length; i += BATCH_SIZE) {
    const batch = activeAssignments.slice(i, i + BATCH_SIZE);

    const batchPromises = batch.map(async (assignment) => {
      const store = stores.find(s => s.id === assignment.storeId);

      if (!store) {
        errors.push({
          storeId: assignment.storeId,
          productId: assignment.productId,
          message: 'Store not found',
        });
        return;
      }

      const result = await publishToStore({
        formId,
        formName,
        formConfig,
        store,
        assignmentType: assignment.assignmentType === 'product' ? 'product' : 'store',
        productId: assignment.productId,
        productHandle: assignment.productHandle,
      });

      if (result.success) {
        successCount++;
      } else {
        errors.push({
          storeId: assignment.storeId,
          productId: assignment.productId,
          message: result.error || 'Unknown error',
        });
      }
    });

    await Promise.allSettled(batchPromises);

    // Add delay between batches if not the last batch
    if (i + BATCH_SIZE < activeAssignments.length) {
      await new Promise(resolve => setTimeout(resolve, DELAY_BETWEEN_BATCHES_MS));
    }
  }

  return {
    success: errors.length === 0,
    successCount,
    failedCount: errors.length,
    totalCount: activeAssignments.length,
    errors,
  };
}

/**
 * Retry a failed sync operation with exponential backoff
 */
export async function retrySync<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  baseDelayMs: number = 1000
): Promise<T> {
  let lastError: Error | undefined;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error: unknown) {
      lastError = error;
      if (attempt < maxRetries - 1) {
        const delay = baseDelayMs * Math.pow(2, attempt);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  throw lastError || new Error('Retry failed');
}
