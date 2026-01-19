import {
  collection,
  doc,
  getDocs,
  onSnapshot,
  query,
  Unsubscribe,
  where,
} from "firebase/firestore";
import { useCallback, useEffect, useRef, useState } from "react";
import { db } from "../firebase";
import { SavedForm } from "./types";

interface UseRealtimeSavedFormsOptions {
  enabled?: boolean; // Allow disabling real-time updates
  onlyInitialLoad?: boolean; // Use getDocs instead of onSnapshot for one-time fetch
}

/**
 * Real-time hook for saved forms using Firebase onSnapshot
 * Subscribes to form updates and maintains live synchronization
 * @param userId - The user's unique identifier
 * @param options - Configuration options
 * @returns Forms list and metadata
 */
export const useRealtimeSavedForms = (
  userId: string,
  options: UseRealtimeSavedFormsOptions = {}
) => {
  const { enabled = true, onlyInitialLoad = false } = options;
  const [forms, setForms] = useState<SavedForm[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const unsubscribeRef = useRef<Unsubscribe | null>(null);

  // Manual refetch using getDocs (useful for immediate refreshes)
  const refetch = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    setError(null);
    try {
      const q = query(collection(db, "forms"), where("userId", "==", userId));
      const querySnapshot = await getDocs(q);
      const fetchedForms: SavedForm[] = [];
      querySnapshot.forEach((doc) => {
        fetchedForms.push({ id: doc.id, ...doc.data() } as SavedForm);
      });
      setForms(fetchedForms);
    } catch (err: any) {
      setError(err.message || "Failed to fetch forms");
      console.error("Failed to fetch forms:", err);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  // Setup real-time listener or initial load
  useEffect(() => {
    if (!userId || !enabled) return;

    setLoading(true);
    setError(null);

    try {
      const q = query(collection(db, "forms"), where("userId", "==", userId));

      if (onlyInitialLoad) {
        // One-time fetch using getDocs
        getDocs(q)
          .then((querySnapshot) => {
            const fetchedForms: SavedForm[] = [];
            querySnapshot.forEach((doc) => {
              fetchedForms.push({ id: doc.id, ...doc.data() } as SavedForm);
            });
            setForms(fetchedForms);
            setLoading(false);
          })
          .catch((err: any) => {
            setError(err.message || "Failed to fetch forms");
            console.error("Failed to fetch forms:", err);
            setLoading(false);
          });
      } else {
        // Real-time listener using onSnapshot
        const unsubscribe = onSnapshot(
          q,
          (querySnapshot) => {
            const fetchedForms: SavedForm[] = [];
            querySnapshot.forEach((doc) => {
              fetchedForms.push({ id: doc.id, ...doc.data() } as SavedForm);
            });
            setForms(fetchedForms);
            setLoading(false);
            setError(null);
          },
          (err: any) => {
            setError(err.message || "Failed to listen to forms");
            console.error("Failed to listen to forms:", err);
            setLoading(false);
          }
        );

        unsubscribeRef.current = unsubscribe;

        return () => {
          if (unsubscribeRef.current) {
            unsubscribeRef.current();
          }
        };
      }
    } catch (err: any) {
      setError(err.message || "Failed to setup forms listener");
      console.error("Failed to setup forms listener:", err);
      setLoading(false);
    }
  }, [userId, enabled, onlyInitialLoad]);

  // Cleanup subscription on unmount
  useEffect(() => {
    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
      }
    };
  }, []);

  return {
    forms,
    loading,
    error,
    refetch,
  };
};

/**
 * Hook for real-time form updates
 * Subscribes to a single form and listens for changes
 * @param formId - The form's unique identifier
 * @returns Form data and metadata
 */
export const useRealtimeForm = (formId: string) => {
  const [form, setForm] = useState<SavedForm | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const unsubscribeRef = useRef<Unsubscribe | null>(null);

  useEffect(() => {
    if (!formId) return;

    setLoading(true);
    setError(null);

    try {
      const docRef = doc(db, "forms", formId);
      const unsubscribe = onSnapshot(
        docRef,
        (docSnapshot) => {
          if (docSnapshot.exists()) {
            setForm({
              id: docSnapshot.id,
              ...docSnapshot.data(),
            } as SavedForm);
            setError(null);
          } else {
            setForm(null);
            setError("Form not found");
          }
          setLoading(false);
        },
        (err: any) => {
          setError(err.message || "Failed to listen to form");
          console.error("Failed to listen to form:", err);
          setLoading(false);
        }
      );

      unsubscribeRef.current = unsubscribe;

      return () => {
        if (unsubscribeRef.current) {
          unsubscribeRef.current();
        }
      };
    } catch (err: any) {
      setError(err.message || "Failed to setup form listener");
      console.error("Failed to setup form listener:", err);
      setLoading(false);
    }
  }, [formId]);

  // Cleanup subscription on unmount
  useEffect(() => {
    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
      }
    };
  }, []);

  return {
    form,
    loading,
    error,
  };
};
