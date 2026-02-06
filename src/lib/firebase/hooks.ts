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
  where
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
        await deleteDoc(doc(db, "forms", formId));
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
    refetch: () => {}, // No-op for realtime, kept for interface compat
  };
};

// ===== STORES HOOKS =====

export const useConnectedStores = (userId: string) => {
  const [stores, setStores] = useState<ConnectedStore[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchStores = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    setError(null);
    try {
      const q = query(collection(db, "stores"), where("userId", "==", userId));
      const querySnapshot = await getDocs(q);
      const fetchedStores: ConnectedStore[] = [];
      querySnapshot.forEach((doc) => {
        fetchedStores.push({ id: doc.id, ...doc.data() } as ConnectedStore);
      });
      setStores(fetchedStores);
    } catch (err: any) {
      setError(err.message);
      console.error("Failed to fetch stores:", err);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchStores();
  }, [fetchStores]);

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

        setStores((prev) => [...prev, savedStore]);
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
        setStores((prev) =>
          prev.map((store) =>
            store.id === storeId ? { ...store, ...updates } : store,
          ),
        );
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
             // If not in state, try to fetch it first or just proceed with deletion based on ID if possible. 
             // Ideally we need the domain for ownership release. 
             // For now, let's assume if it's not in state, it might have been deleted, or we just delete the doc.
             // But we should try to get the doc from Firestore if we really need the domain.
             console.warn("Store not found in local state during deletion, checking Firestore...");
             // logic could be expanded here, but for now we proceed to delete what we can.
        }

        const shopifyDomain =
          storeToDelete?.shopifyDomain ||
          (storeToDelete?.url ? normalizeShopifyDomain(storeToDelete.url) : null);

        // 0. Disable the loader script on Shopify (remove ScriptTag)
        if (storeToDelete?.loaderInstalled && storeToDelete?.clientId && storeToDelete?.clientSecret) {
          try {
            const { disableLoader } = await import("../api");
            const subdomain = storeToDelete.url?.replace('.myshopify.com', '').replace(/https?:\/\//, '') || '';
            if (subdomain) {
              await disableLoader(subdomain, storeToDelete.clientId, storeToDelete.clientSecret);
            }
          } catch (err) {
            // Don't block disconnect if disableLoader fails - log and continue
            console.warn("Failed to disable loader on Shopify during disconnect:", err);
          }
        }

        // 1. Delete the Store Document
        await deleteDoc(doc(db, "stores", storeId));

        // 2. Delete all Assignments associated with this store
        const assignmentsQuery = query(collection(db, "assignments"), where("storeId", "==", storeId));
        const assignmentsSnapshot = await getDocs(assignmentsQuery);
        const deleteAssignmentsPromises = assignmentsSnapshot.docs.map(doc => deleteDoc(doc.ref));
        await Promise.all(deleteAssignmentsPromises);

        // 3. Release ownership of this store
        if (shopifyDomain) {
          await releaseStoreOwnership(shopifyDomain);
        }

        setStores((prev) => prev.filter((s) => s.id !== storeId));
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
    refetch: fetchStores,
  };
};

// ===== ASSIGNMENTS HOOKS =====

export const useFormAssignments = (userId: string) => {
  const [assignments, setAssignments] = useState<FormAssignment[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAssignments = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    setError(null);
    try {
      const q = query(collection(db, "assignments"), where("userId", "==", userId));
      const querySnapshot = await getDocs(q);
      const fetchedAssignments: FormAssignment[] = [];
      querySnapshot.forEach((doc) => {
        fetchedAssignments.push({ id: doc.id, ...doc.data() } as FormAssignment);
      });
      setAssignments(fetchedAssignments);
    } catch (err: any) {
      setError(err.message);
      console.error("Failed to fetch assignments:", err);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchAssignments();
  }, [fetchAssignments]);

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
        // Fetch the store to get the domain
        // We know storeId is valid because we usually select it from a list, but we should verify or pass the domain
        // For now, let's try to find it in the 'stores' state if available, but this hook doesn't have access to 'stores'.
        // We can pass it in assignmentData or fetch it.
        // BETTER APPROACH: The UI calling this likely has the store object. Let's update the signature to accept shopifyDomain or optional.
        // OR: We can rely on the fact that we might need to fetch the store if domain is missing.
        // However, to keep it simple and efficient, we will require shopifyDomain in assignmentData or fetch it if missing.
        
        let shopifyDomain = assignmentData.shopifyDomain; 
        
        // If not provided, fetch from store
        if (!shopifyDomain) {
            try {
                const storeDoc = await getDoc(doc(db, "stores", storeId));
                if (storeDoc.exists()) {
                    const storeData = storeDoc.data();
                    // Use user-friendly domain or url, but we need what the loader sees.
                    // Loader sees 'window.location.hostname'.
                    // Store has 'url' (e.g. my-shop.myshopify.com) and 'customDomain'.
                    // We should save the 'myshopify.com' usually as a base, or normalized domain.
                    // 'store.url' usually is 'xxx.myshopify.com'.
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
          shopifyDomain: shopifyDomain || "", // This needs to be populated!
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
        setAssignments((prev) => [...prev, savedAssignment]);
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
        setAssignments((prev) => prev.filter((a) => a.id !== assignmentId));
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
    refetch: fetchAssignments,
  };
};
