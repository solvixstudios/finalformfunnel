import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  query,
  updateDoc,
  where,
  writeBatch
} from "firebase/firestore";
import { useCallback, useEffect, useMemo, useState } from "react";
import { db } from "../firebase";
// import { useStoreAssignments as useStoreAssignmentsHook } from "../hooks/useStoreAssignments"; // Removed
import {
  checkStoreOwnership,
  claimStoreOwnership,
  normalizeShopifyDomain,
  releaseStoreOwnership,
} from "./storeOwnership";
import { ConnectedStore, FormAssignment, SavedForm } from "./types";
import { propagateFormUpdate } from "./n8nSync";

// ===== FORMS HOOKS =====

export const useSavedForms = (userId: string) => {
  const [forms, setForms] = useState<SavedForm[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Real-time subscription
  useEffect(() => {
    if (!userId) return;
    setLoading(true);

    const q = query(collection(db, "forms"), where("userId", "==", userId));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const fetchedForms: SavedForm[] = [];
        snapshot.forEach((doc) => {
          fetchedForms.push({ id: doc.id, ...doc.data() } as SavedForm);
        });
        // Client-side sort if needed, or rely on query order (requires index)
        fetchedForms.sort(
          (a, b) =>
            new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
        );
        setForms(fetchedForms);
        setLoading(false);
        setError(null);
      },
      (err) => {
        console.error("Error fetching forms:", err);
        setError(err.message);
        setLoading(false);
      },
    );

    return () => unsubscribe();
  }, [userId]);

  const saveForm = useCallback(
    async (name: string, description: string, config: Record<string, any>, type: 'store' | 'product' = 'product') => {
      if (!userId) throw new Error("User not authenticated");
      try {
        const newForm = {
          userId,
          name,
          description,
          config,
          type,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        const docRef = await addDoc(collection(db, "forms"), newForm);
        // No manual state update - listener handles it
        return { id: docRef.id, ...newForm };
      } catch (err: unknown) {
        setError(err.message);
        throw err;
      }
    },
    [userId],
  );

  const updateForm = useCallback(
    async (formId: string, updates: Partial<SavedForm>) => {
      if (!userId) throw new Error("User not authenticated");
      try {
        const formRef = doc(db, "forms", formId);

        await updateDoc(formRef, {
          ...updates,
          updatedAt: new Date().toISOString(),
        });

        // Trigger background sync to n8n if config or name changed
        // Trigger background sync to n8n if config or name changed
        if (updates.config || updates.name) {
          const snap = await getDoc(formRef);
          if (snap.exists()) {
            const data = snap.data();
            await propagateFormUpdate(formId, data.name, data.config);
          }
        }
      } catch (err: unknown) {
        setError(err.message);
        throw err;
      }
    },
    [userId],
  );

  const deleteForm = useCallback(
    async (formId: string) => {
      if (!userId) throw new Error("User not authenticated");
      try {
        // CASCADE DELETE: Requests to delete a form should also delete all its assignments
        const batch = writeBatch(db);

        // 1. Delete the form
        const formRef = doc(db, "forms", formId);
        batch.delete(formRef);

        // 2. Find and delete all assignments for this form
        const assignmentsQuery = query(collection(db, "assignments"), where("formId", "==", formId));
        const assignmentsSnapshot = await getDocs(assignmentsQuery);

        // 2.5 Clean up n8n store_configs for each assignment (fire-and-forget)
        for (const assignDoc of assignmentsSnapshot.docs) {
          const assignment = assignDoc.data();
          if (assignment.storeId) {
            try {
              const storeSnap = await getDoc(doc(db, "stores", assignment.storeId));
              if (storeSnap.exists()) {
                const storeData = storeSnap.data();
                if (storeData.clientId && storeData.clientSecret) {
                  const { getAdapter } = await import("../integrations");
                  const adapter = getAdapter(storeData.platform || 'shopify');
                  const subdomain = storeData.url?.replace('.myshopify.com', '').replace(/https?:\/\//, '') || '';
                  await adapter.removeForm(subdomain, {
                    clientId: storeData.clientId,
                    clientSecret: storeData.clientSecret
                  }, assignment.productId || undefined).catch(() => { });
                }
              }
            } catch (e) {
              console.warn("Failed to clean n8n config for assignment:", e);
            }
          }
        }

        assignmentsSnapshot.forEach((doc) => {
          batch.delete(doc.ref);
        });

        await batch.commit();
        // No manual state update - listener handles it
      } catch (err: unknown) {
        setError(err.message);
        throw err;
      }
    },
    [userId],
  );

  return {
    forms,
    loading,
    error,
    saveForm,
    updateForm,
    deleteForm,
    refetch: () => { }, // No-op for realtime, kept for interface compat
  };
};

// ===== STORES HOOKS =====

export const useConnectedStores = (userId: string) => {
  const [stores, setStores] = useState<ConnectedStore[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Real-time subscription for stores
  useEffect(() => {
    if (!userId) return;
    setLoading(true);

    const q = query(collection(db, "stores"), where("userId", "==", userId));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const fetchedStores: ConnectedStore[] = [];
        snapshot.forEach((doc) => {
          fetchedStores.push({ id: doc.id, ...doc.data() } as ConnectedStore);
        });
        setStores(fetchedStores);
        setLoading(false);
        setError(null);
      },
      (err) => {
        console.error("Error fetching stores:", err);
        setError(err.message);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [userId]);

  const addStore = useCallback(
    async (storeData: {
      name: string;
      platform: "shopify" | "woocommerce";
      url: string;
      shopifyDomain?: string;
      clientId?: string;
      clientSecret?: string;
      initialSync?: boolean;
      loaderInstalled?: boolean;
      loaderVersion?: string;
      loaderScriptTagId?: string;
      loaderInstalledAt?: string;
    }) => {
      if (!userId) throw new Error("User not authenticated");

      // Normalize the Shopify domain for ownership tracking
      const shopifyDomain = storeData.shopifyDomain
        ? normalizeShopifyDomain(storeData.shopifyDomain)
        : normalizeShopifyDomain(storeData.url);

      // Check if this store is already owned by another user
      const ownership = await checkStoreOwnership(shopifyDomain);
      if (ownership.isOwned && ownership.ownerId !== userId) {
        throw new Error("STORE_ALREADY_OWNED");
      }

      // Check if this user already has this store connected
      const existingStore = stores.find(
        (s) => normalizeShopifyDomain(s.url) === shopifyDomain,
      );
      if (existingStore) {
        throw new Error("STORE_ALREADY_CONNECTED");
      }

      try {
        const newStore: Omit<ConnectedStore, "id"> = {
          userId,
          name: storeData.name,
          platform: storeData.platform,
          url: storeData.url,
          shopifyDomain,
          status: "connected" as const,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          ...(storeData.clientId && { clientId: storeData.clientId }),
          ...(storeData.clientSecret && { clientSecret: storeData.clientSecret }),
          ...(storeData.loaderInstalled !== undefined && {
            loaderInstalled: storeData.loaderInstalled,
          }),
          ...(storeData.loaderVersion && { loaderVersion: storeData.loaderVersion }),
          ...(storeData.loaderScriptTagId && {
            loaderScriptTagId: storeData.loaderScriptTagId,
          }),
          ...(storeData.loaderInstalledAt && {
            loaderInstalledAt: storeData.loaderInstalledAt,
          }),
        };
        const docRef = await addDoc(collection(db, "stores"), newStore);
        const savedStore: ConnectedStore = { id: docRef.id, ...newStore };

        // Claim ownership of this store
        await claimStoreOwnership(shopifyDomain, userId, docRef.id);

        // No need to manually update state, onSnapshot will handle it
        return savedStore;
      } catch (err: unknown) {
        setError(err.message);
        throw err;
      }
    },
    [userId, stores],
  );

  const updateStore = useCallback(
    async (storeId: string, updates: Partial<ConnectedStore>) => {
      if (!userId) throw new Error("User not authenticated");
      try {
        const storeRef = doc(db, "stores", storeId);
        await updateDoc(storeRef, {
          ...updates,
          updatedAt: new Date().toISOString(),
        });
        // No manual state update - listener handles it
      } catch (err: unknown) {
        setError(err.message);
        throw err;
      }
    },
    [userId],
  );

  const deleteStore = useCallback(
    async (storeId: string) => {
      if (!userId) throw new Error("User not authenticated");
      try {
        // Find the store to get its domain for ownership release
        const storeToDelete = stores.find((s) => s.id === storeId);

        // Handle "undefined store" error gracefully if store not found in state
        if (!storeToDelete) {
          console.warn("Store not found in local state during deletion, checking Firestore...");
        }

        const shopifyDomain =
          storeToDelete?.shopifyDomain ||
          (storeToDelete?.url ? normalizeShopifyDomain(storeToDelete.url) : null);

        // 0. Disable the loader script on Shopify (remove ScriptTag ONLY, don't disconnect yet)
        if (storeToDelete?.loaderInstalled && storeToDelete?.clientId && storeToDelete?.clientSecret) {
          try {
            const { getAdapter } = await import("../integrations");
            const adapter = getAdapter(storeToDelete.platform || 'shopify');
            const subdomain = storeToDelete.url?.replace('.myshopify.com', '').replace(/https?:\/\//, '') || '';
            if (subdomain) {
              await adapter.disableLoader(subdomain, {
                clientId: storeToDelete.clientId,
                clientSecret: storeToDelete.clientSecret
              });
            }
          } catch (err) {
            // Don't block disconnect if disableLoader fails - log and continue
            console.warn("Failed to disable loader during disconnect:", err);
          }
        }

        // 0.5 Clean up n8n store_configs for all assignments of this store
        // IMPORTANT: This must happen BEFORE disconnectStore, because removeForm
        // needs the store row to still exist in n8n's stores table.
        const subdomain = storeToDelete?.url?.replace('.myshopify.com', '').replace(/https?:\/\//, '') || '';
        if (storeToDelete?.clientId && storeToDelete?.clientSecret) {
          try {
            const configAssignmentsQuery = query(
              collection(db, "assignments"),
              where("storeId", "==", storeId)
            );
            const configSnap = await getDocs(configAssignmentsQuery);
            const { getAdapter } = await import("../integrations");
            const adapter = getAdapter(storeToDelete.platform || 'shopify');

            // Delete each config from n8n (don't block disconnect)
            const cleanupPromises = configSnap.docs.map(d => {
              const data = d.data();
              return adapter.removeForm(subdomain, {
                clientId: storeToDelete.clientId!,
                clientSecret: storeToDelete.clientSecret!
              }, data.productId || undefined).catch(() => { });
            });
            // Also delete the store-level config (ownerId = null)
            cleanupPromises.push(
              adapter.removeForm(subdomain, {
                clientId: storeToDelete.clientId!,
                clientSecret: storeToDelete.clientSecret!
              }).catch(() => { })
            );
            await Promise.allSettled(cleanupPromises);
          } catch (err) {
            console.warn("Failed to clean up n8n configs during disconnect:", err);
          }
        }

        // 0.9 NOW disconnect store from n8n (removes the stores row)
        // This is AFTER config cleanup so removeForm can still find the store.
        if (subdomain) {
          try {
            const { getAdapter } = await import("../integrations");
            const adapter = getAdapter(storeToDelete?.platform || 'shopify');
            await adapter.disconnectStore(subdomain);
          } catch (err) {
            console.warn("Failed to disconnect store from n8n:", err);
          }
        }

        // Use batch for atomic deletion of store and assignments
        const batch = writeBatch(db);

        // 1. Delete the Store Document
        const storeRef = doc(db, "stores", storeId);
        batch.delete(storeRef);

        // 2. Delete all Assignments associated with this store
        const assignmentsQuery = query(collection(db, "assignments"), where("storeId", "==", storeId));
        const assignmentsSnapshot = await getDocs(assignmentsQuery);
        assignmentsSnapshot.forEach(doc => {
          batch.delete(doc.ref);
        });

        await batch.commit();

        // 3. Release ownership of this store
        if (shopifyDomain) {
          await releaseStoreOwnership(shopifyDomain);
        }

        // No manual state update - listener handles it
      } catch (err: unknown) {
        setError(err.message);
        throw err;
      }
    },
    [userId, stores],
  );

  return {
    stores,
    loading,
    error,
    addStore,
    updateStore,
    deleteStore,
    refetch: () => { }, // No-op
  };
};

// ===== ASSIGNMENTS HOOKS =====

import { useAssignmentsContext } from "../../contexts/AssignmentsContext";

export const useFormAssignments = (userId: string) => {
  // Bridge: data from n8n via AssignmentsContext (global state), mutations via adapter
  const { stores, assignments: n8nAssignments, loading, error, refetch } = useAssignmentsContext();

  // Map n8n assignments to FormAssignment shape for consumer compatibility
  const assignments: FormAssignment[] = useMemo(() =>
    n8nAssignments.map((a, idx) => ({
      id: `n8n-${a.storeId}-${a.type}-${a.productId || 'global'}-${idx}`,
      userId,
      formId: a.formId,
      storeId: a.storeId,
      productId: a.productId || null,
      productHandle: null,
      assignmentType: a.type,
      priority: a.type === 'product' ? 10 : 1,
      isActive: true,
      shopifyDomain: '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    })),
    [n8nAssignments, userId]
  );

  const assignForm = useCallback(
    async (assignmentData: {
      formId: string;
      storeId: string;
      type: "store" | "product";
      productId?: string;
      productHandle?: string;
      shopifyDomain?: string;
      formName?: string;
      formConfig?: Record<string, any>;
      skipRefetch?: boolean;
    }) => {
      if (!userId) throw new Error("User not authenticated");

      const { formId, storeId, type, productId, productHandle } = assignmentData;

      // Find the store to get credentials
      const store = stores.find(s => s.id === storeId);
      if (!store || !store.clientId || !store.clientSecret) {
        throw new Error("Store not found or missing credentials");
      }

      const subdomain = (store.shopifyDomain || store.url || '').replace(/https?:\/\//, '').replace('.myshopify.com', '');

      // Build form config — use provided or fetch from Firebase
      let formConfig: Record<string, any> = assignmentData.formConfig || { formId };
      if (!assignmentData.formConfig) {
        try {
          const formDoc = await getDoc(doc(db, "forms", formId));
          if (formDoc.exists()) {
            formConfig = { formId, name: formDoc.data().name, ...formDoc.data().config };
          }
        } catch (e) {
          console.warn("Could not fetch form data for assignment:", e);
        }
      }

      // Push to n8n via adapter (single source of truth)
      const { getAdapter } = await import("../integrations");
      const adapter = getAdapter(store.platform || 'shopify');
      await adapter.assignForm(subdomain, {
        clientId: store.clientId,
        clientSecret: store.clientSecret,
      }, formConfig, {
        formId,
        formName: assignmentData.formName || formConfig.name || 'Untitled Form',
        storeId,
        assignmentType: type,
        productId: type === 'product' ? (productId || undefined) : undefined,
        productHandle: type === 'product' ? (productHandle || undefined) : undefined,
      });

      // 2. Persist to Firestore (restore persistence for sync logic and legacy support)
      // Check for existing assignment to avoid duplicates
      try {
        const q = query(
          collection(db, "assignments"),
          where("storeId", "==", storeId),
          where("assignmentType", "==", type),
          ...(type === 'product' && productId ? [where("productId", "==", productId)] : [])
        );

        const snapshot = await getDocs(q);
        const batch = writeBatch(db);

        // Remove ANY existing assignments for this target (even if different formId)
        // This ensures one-form-per-target consistency in Firestore
        snapshot.forEach(doc => {
          batch.delete(doc.ref);
        });

        const newAssignmentDoc = {
          userId,
          formId,
          storeId,
          assignmentType: type,
          productId: type === 'product' ? (productId || null) : null,
          productHandle: type === 'product' ? (productHandle || null) : null,
          isActive: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          shopifyDomain: subdomain,
        };

        const newDocRef = doc(collection(db, "assignments"));
        batch.set(newDocRef, newAssignmentDoc);

        await batch.commit();
      } catch (e) {
        console.error("[assignForm] Failed to persist to Firestore:", e);
        // Don't throw - n8n sync succeeded, that's what matters most
      }

      // Refetch from n8n to sync UI state (unless skipped for batch ops)
      if (!assignmentData.skipRefetch) {
        await refetch();
      }

      // Return a FormAssignment shape for compatibility
      const newAssignment: FormAssignment = {
        id: `n8n-${storeId}-${type}-${productId || 'global'}-new`,
        userId,
        formId,
        storeId,
        productId: type === "store" ? null : (productId ?? null),
        productHandle: type === "store" ? null : (productHandle ?? null),
        assignmentType: type,
        priority: type === "product" ? 10 : 1,
        isActive: true,
        shopifyDomain: '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      return newAssignment;
    },
    [userId, stores, refetch],
  );

  const deleteAssignment = useCallback(
    async (assignmentId: string) => {
      if (!userId) throw new Error("User not authenticated");
      try {
        // Parse the synthetic assignment ID to find the assignment
        // Format: n8n-{storeId}-{type}-{productId|global}-{idx|new}
        const assignment = assignments.find(a => a.id === assignmentId);
        if (!assignment) {
          console.warn("Assignment not found for deletion:", assignmentId);
          return;
        }

        const store = stores.find(s => s.id === assignment.storeId);
        if (!store || !store.clientId || !store.clientSecret) {
          throw new Error("Store not found or missing credentials");
        }

        const subdomain = (store.shopifyDomain || store.url || '').replace(/https?:\/\//, '').replace('.myshopify.com', '');

        // 1. Call adapter to remove from n8n
        const { getAdapter } = await import("../integrations");
        const adapter = getAdapter(store.platform || 'shopify');
        await adapter.removeForm(subdomain, {
          clientId: store.clientId,
          clientSecret: store.clientSecret,
        }, assignment.productId || undefined);

        // 2. Remove from Firestore assignments collection (to keep sync logic working)
        // Since we identify by synthetic ID, we must query by properties
        const q = query(
          collection(db, "assignments"),
          where("storeId", "==", assignment.storeId),
          where("formId", "==", assignment.formId),
          where("assignmentType", "==", assignment.assignmentType)
        );

        const snapshot = await getDocs(q);
        const batch = writeBatch(db);

        snapshot.forEach(doc => {
          // Double check product ID match (handling nulls)
          const data = doc.data();
          const targetProdId = assignment.productId || null;
          const docProdId = data.productId || null;

          if (targetProdId === docProdId) {
            batch.delete(doc.ref);
          }
        });

        await batch.commit();

        // 3. Refetch to get updated data from n8n
        await refetch();
      } catch (err: unknown) {
        console.error("[useFormAssignments] deleteAssignment error:", err);
        throw err;
      }
    },
    [userId, stores, assignments, refetch],
  );

  return {
    assignments,
    loading,
    error,
    assignForm,
    deleteAssignment,
    refetch,
  };
};
