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
import { useCallback, useEffect, useState } from "react";
import { db } from "../firebase";
import {
  checkStoreOwnership,
  claimStoreOwnership,
  normalizeShopifyDomain,
  releaseStoreOwnership,
} from "./storeOwnership";
import { ConnectedStore, FormAssignment, SavedForm } from "./types";

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
    async (name: string, description: string, config: Record<string, any>) => {
      if (!userId) throw new Error("User not authenticated");
      try {
        const newForm = {
          userId,
          name,
          description,
          config,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        const docRef = await addDoc(collection(db, "forms"), newForm);
        // No manual state update - listener handles it
        return { id: docRef.id, ...newForm };
      } catch (err: any) {
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
        // No manual state update - listener handles it
      } catch (err: any) {
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
      } catch (err: any) {
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
      } catch (err: any) {
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
      } catch (err: any) {
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

        // 0. Disable the loader script on Shopify (remove ScriptTag)
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
        if (storeToDelete?.clientId && storeToDelete?.clientSecret) {
          try {
            const configAssignmentsQuery = query(
              collection(db, "assignments"),
              where("storeId", "==", storeId)
            );
            const configSnap = await getDocs(configAssignmentsQuery);
            const { getAdapter } = await import("../integrations");
            const adapter = getAdapter(storeToDelete.platform || 'shopify');
            const subdomain = storeToDelete.url?.replace('.myshopify.com', '').replace(/https?:\/\//, '') || '';

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
      } catch (err: any) {
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

export const useFormAssignments = (userId: string) => {
  const [assignments, setAssignments] = useState<FormAssignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Real-time subscription for assignments
  useEffect(() => {
    if (!userId) return;
    setLoading(true);

    const q = query(collection(db, "assignments"), where("userId", "==", userId));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const fetchedAssignments: FormAssignment[] = [];
        snapshot.forEach((doc) => {
          fetchedAssignments.push({ id: doc.id, ...doc.data() } as FormAssignment);
        });
        setAssignments(fetchedAssignments);
        setLoading(false);
        setError(null);
      },
      (err) => {
        console.error("Error fetching assignments:", err);
        setError(err.message);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [userId]);

  const assignForm = useCallback(
    async (assignmentData: {
      formId: string;
      storeId: string;
      type: "store" | "product";
      productId?: string;
      productHandle?: string;
      shopifyDomain?: string; // New field
    }) => {
      if (!userId) throw new Error("User not authenticated");
      try {
        const { formId, storeId, type, productId, productHandle } = assignmentData;

        // Ensure shopifyDomain is present
        let shopifyDomain = assignmentData.shopifyDomain;

        // If not provided, fetch from store (fallback)
        if (!shopifyDomain) {
          try {
            const storeDoc = await getDoc(doc(db, "stores", storeId));
            if (storeDoc.exists()) {
              const storeData = storeDoc.data();
              shopifyDomain = storeData.url;
            }
          } catch (e) {
            console.error("Failed to fetch store for domain:", e);
          }
        }

        const newAssignment: Omit<FormAssignment, "id"> = {
          userId,
          formId,
          storeId,
          shopifyDomain: shopifyDomain || "",
          assignmentType: type,
          productId: type === "store" ? null : (productId ?? null),
          productHandle: type === "store" ? null : (productHandle ?? null),
          priority: type === "product" ? 10 : 1,
          isActive: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        const docRef = await addDoc(collection(db, "assignments"), newAssignment);
        const savedAssignment: FormAssignment = { id: docRef.id, ...newAssignment };

        // No manual state update - listener handles it
        return savedAssignment;
      } catch (err: any) {
        setError(err.message);
        throw err;
      }
    },
    [userId],
  );

  const deleteAssignment = useCallback(
    async (assignmentId: string) => {
      if (!userId) throw new Error("User not authenticated");
      try {
        await deleteDoc(doc(db, "assignments", assignmentId));
        // No manual state update - listener handles it
      } catch (err: any) {
        setError(err.message);
        throw err;
      }
    },
    [userId],
  );

  return {
    assignments,
    loading,
    error,
    assignForm,
    deleteAssignment,
    refetch: () => { }, // No-op
  };
};
