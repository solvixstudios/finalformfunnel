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

// ===== FORMS HOOKS =====

export const useSavedForms = (userId: string) => {
  const [forms, setForms] = useState<SavedForm[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Real-time subscription
  useEffect(() => {
    if (!userId) return;
    setLoading(true);

    const q = query(collection(db, "users", userId, "forms"), where("userId", "==", userId));

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
        const docRef = await addDoc(collection(db, "users", userId, "forms"), newForm);
        // No manual state update - listener handles it
        return { id: docRef.id, ...newForm };
      } catch (err: unknown) {
        setError((err as Error).message);
        throw err;
      }
    },
    [userId],
  );

  const updateForm = useCallback(
    async (formId: string, updates: Partial<SavedForm>) => {
      if (!userId) throw new Error("User not authenticated");
      try {
        const formRef = doc(db, "users", userId, "forms", formId);

        await updateDoc(formRef, {
          ...updates,
          updatedAt: new Date().toISOString(),
        });
      } catch (err: unknown) {
        setError((err as Error).message);
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
        const formRef = doc(db, "users", userId, "forms", formId);
        batch.delete(formRef);

        // 2. Find and delete all assignments for this form
        const assignmentsQuery = query(collection(db, "users", userId, "assignments"), where("formId", "==", formId));
        const assignmentsSnapshot = await getDocs(assignmentsQuery);



        assignmentsSnapshot.forEach((doc) => {
          batch.delete(doc.ref);
        });

        await batch.commit();
        // No manual state update - listener handles it
      } catch (err: unknown) {
        setError((err as Error).message);
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

    const q = query(collection(db, "users", userId, "stores"), where("userId", "==", userId));

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
        (s) => normalizeShopifyDomain(s.url || s.shopifyDomain || "") === shopifyDomain,
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
        const docRef = await addDoc(collection(db, "users", userId, "stores"), newStore);
        const savedStore: ConnectedStore = { id: docRef.id, ...newStore };

        // Claim ownership of this store
        await claimStoreOwnership(shopifyDomain, userId, docRef.id);

        // No need to manually update state, onSnapshot will handle it
        return savedStore;
      } catch (err: unknown) {
        setError((err as Error).message);
        throw err;
      }
    },
    [userId, stores],
  );

  const updateStore = useCallback(
    async (storeId: string, updates: Partial<ConnectedStore>) => {
      if (!userId) throw new Error("User not authenticated");
      try {
        const storeRef = doc(db, "users", userId, "stores", storeId);
        await updateDoc(storeRef, {
          ...updates,
          updatedAt: new Date().toISOString(),
        });
        // No manual state update - listener handles it
      } catch (err: unknown) {
        setError((err as Error).message);
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
              }, userId);
            }
          } catch (err) {
            // Don't block disconnect if disableLoader fails - log and continue
            console.warn("Failed to disable loader during disconnect:", err);
          }
        }

        const subdomain = storeToDelete?.url?.replace('.myshopify.com', '').replace(/https?:\/\//, '') || '';

        // 0.9 NOW disconnect store from backend (removes the stores row)
        // This is AFTER config cleanup so removeForm can still find the store.
        if (subdomain) {
          try {
            const { getAdapter } = await import("../integrations");
            const adapter = getAdapter(storeToDelete?.platform || 'shopify');
            await adapter.disconnectStore(subdomain);
          } catch (err) {
            console.warn("Failed to disconnect store from backend:", err);
          }
        }

        // Use batch for atomic deletion of store and assignments
        const batch = writeBatch(db);

        // 1. Delete the Store Document
        const storeRef = doc(db, "users", userId, "stores", storeId);
        batch.delete(storeRef);

        // 2. Delete all Assignments associated with this store
        const assignmentsQuery = query(collection(db, "users", userId, "assignments"), where("storeId", "==", storeId));
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
        setError((err as Error).message);
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
  // Bridge: data from backend via AssignmentsContext (global state), mutations via adapter
  const { stores, assignments: backendAssignments, loading, error, refetch } = useAssignmentsContext();

  // Map backend assignments to FormAssignment shape for consumer compatibility
  const assignments: FormAssignment[] = useMemo(() =>
    backendAssignments.map((a, idx) => ({
      id: `backend-${a.storeId}-${a.type}-${a.productId || 'global'}-${idx}`,
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
    [backendAssignments, userId]
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
          const formDoc = await getDoc(doc(db, "users", userId, "forms", formId));
          if (formDoc.exists()) {
            formConfig = { formId, name: formDoc.data().name, ...formDoc.data().config };
          }
        } catch (e) {
          console.warn("Could not fetch form data for assignment:", e);
        }
      }

      // No adapter call needed — backend reads config fresh from Firestore on each request

      // 2. Persist to Firestore (restore persistence for sync logic and legacy support)
      // Check for existing assignment to avoid duplicates
      try {
        // Query 1: Remove existing assignments for this specific target
        // (same storeId + same type + same productId if product-level)
        const targetQuery = query(
          collection(db, "users", userId, "assignments"),
          where("storeId", "==", storeId),
          where("assignmentType", "==", type),
          ...(type === 'product' && productId ? [where("productId", "==", productId)] : [])
        );

        // Query 2: Remove any existing assignments for this formId+storeId
        // regardless of type — handles switching from store→product or product→store
        const formStoreQuery = query(
          collection(db, "users", userId, "assignments"),
          where("storeId", "==", storeId),
          where("formId", "==", formId)
        );

        const [targetSnap, formStoreSnap] = await Promise.all([
          getDocs(targetQuery),
          getDocs(formStoreQuery),
        ]);

        const batch = writeBatch(db);
        const deletedIds = new Set<string>();

        // Remove conflicting assignments from both queries (deduplicated)
        targetSnap.forEach(doc => {
          if (!deletedIds.has(doc.id)) {
            batch.delete(doc.ref);
            deletedIds.add(doc.id);
          }
        });
        formStoreSnap.forEach(doc => {
          if (!deletedIds.has(doc.id)) {
            batch.delete(doc.ref);
            deletedIds.add(doc.id);
          }
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

        const newDocRef = doc(collection(db, "users", userId, "assignments"));
        batch.set(newDocRef, newAssignmentDoc);

        // Also ensure form is published since it's now assigned!
        const formRef = doc(db, "users", userId, "forms", formId);
        batch.update(formRef, {
          status: 'published',
          updatedAt: new Date().toISOString()
        });

        await batch.commit();
      } catch (e) {
        console.error("[assignForm] Failed to persist to Firestore:", e);
        // Don't throw - backend sync succeeded, that's what matters most
      }

      // No longer need to refetch since AssignmentsContext uses a real-time onSnapshot listener

      // Return a FormAssignment shape for compatibility
      const newAssignment: FormAssignment = {
        id: `backend-${storeId}-${type}-${productId || 'global'}-new`,
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
        // Format: backend-{storeId}-{type}-{productId|global}-{idx|new}
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

        // No adapter call needed — backend reads config fresh from Firestore on each request

        // 2. Remove from Firestore assignments collection (to keep sync logic working)
        // Since we identify by synthetic ID, we must query by properties
        const q = query(
          collection(db, "users", userId, "assignments"),
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

        // 3. Refetch to get updated data from backend
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
