import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  onSnapshot,
  query,
  updateDoc,
  where,
} from "firebase/firestore";
import { useCallback, useEffect, useState } from "react";
import { db } from "../firebase";
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
          (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
        );
        setForms(fetchedForms);
        setLoading(false);
        setError(null);
      },
      (err) => {
        console.error("Error fetching forms:", err);
        setError(err.message);
        setLoading(false);
      }
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
    [userId]
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
    [userId]
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
    [userId]
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
      clientId?: string;
      clientSecret?: string;
      initialSync?: boolean;
      loaderInstalled?: boolean;
      loaderInstalledAt?: string;
    }) => {
      if (!userId) throw new Error("User not authenticated");
      try {
        const newStore: Omit<ConnectedStore, "id"> = {
          userId,
          name: storeData.name,
          platform: storeData.platform,
          url: storeData.url,
          status: "connected" as const,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          ...(storeData.clientId && { clientId: storeData.clientId }),
          ...(storeData.clientSecret && { clientSecret: storeData.clientSecret }),
          ...(storeData.initialSync && { initialSync: storeData.initialSync }),
          ...(storeData.loaderInstalled && {
            loaderInstalled: storeData.loaderInstalled,
          }),
          ...(storeData.loaderInstalledAt && {
            loaderInstalledAt: storeData.loaderInstalledAt,
          }),
        };
        const docRef = await addDoc(collection(db, "stores"), newStore);
        const savedStore: ConnectedStore = { id: docRef.id, ...newStore };
        setStores((prev) => [...prev, savedStore]);
        return savedStore;
      } catch (err: any) {
        setError(err.message);
        throw err;
      }
    },
    [userId]
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
            store.id === storeId ? { ...store, ...updates } : store
          )
        );
      } catch (err: any) {
        setError(err.message);
        throw err;
      }
    },
    [userId]
  );

  const deleteStore = useCallback(
    async (storeId: string) => {
      if (!userId) throw new Error("User not authenticated");
      try {
        await deleteDoc(doc(db, "stores", storeId));
        setStores((prev) => prev.filter((s) => s.id !== storeId));
      } catch (err: any) {
        setError(err.message);
        throw err;
      }
    },
    [userId]
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
    }) => {
      if (!userId) throw new Error("User not authenticated");
      try {
        const { formId, storeId, type, productId, productHandle } = assignmentData;
        const newAssignment: Omit<FormAssignment, "id"> = {
          userId,
          formId,
          storeId,
          shopifyDomain: "", // TODO: Get from store details if needed, or leave empty
          assignmentType: type,
          productId,
          productHandle,
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
    [userId]
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
    [userId]
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
