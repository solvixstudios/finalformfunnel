import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  onSnapshot,
  query,
  where,
  writeBatch,
} from "firebase/firestore";
import { useCallback, useEffect, useState } from "react";
import { db } from "../firebase";
import { WhatsAppProfile } from "./types";

export const useWhatsAppProfiles = (userId: string) => {
  const [profiles, setProfiles] = useState<WhatsAppProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }
    setLoading(true);

    const q = query(
      collection(db, "whatsapp_profiles"),
      where("userId", "==", userId),
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const fetchedProfiles: WhatsAppProfile[] = [];
        snapshot.forEach((doc) => {
          fetchedProfiles.push({ id: doc.id, ...doc.data() } as WhatsAppProfile);
        });
        // Sort by createdAt desc
        fetchedProfiles.sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
        );
        setProfiles(fetchedProfiles);
        setLoading(false);
        setError(null);
      },
      (err) => {
        console.error("Error fetching WhatsApp profiles:", err);
        setError(err.message);
        setLoading(false);
      },
    );

    return () => unsubscribe();
  }, [userId]);

  const addProfile = useCallback(
    async (profileData: {
      name: string;
      phoneNumber: string;
      isDefault?: boolean;
    }) => {
      if (!userId) throw new Error("User not authenticated");
      try {
        const batch = writeBatch(db);

        // If this new profile is default, unset others
        if (profileData.isDefault) {
          const existingDefaults = profiles.filter((p) => p.isDefault);
          existingDefaults.forEach((p) => {
            const ref = doc(db, "whatsapp_profiles", p.id);
            batch.update(ref, {
              isDefault: false,
              updatedAt: new Date().toISOString(),
            });
          });
        } else if (profiles.length === 0) {
          // First profile must be default
          profileData.isDefault = true;
        }

        const newProfile = {
          userId,
          name: profileData.name,
          phoneNumber: profileData.phoneNumber,
          isDefault: profileData.isDefault || false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        const docRef = doc(collection(db, "whatsapp_profiles"));
        batch.set(docRef, newProfile);

        await batch.commit();
        return { id: docRef.id, ...newProfile };
      } catch (err: any) {
        setError(err.message);
        throw err;
      }
    },
    [userId, profiles],
  );

  const updateProfile = useCallback(
    async (profileId: string, updates: Partial<WhatsAppProfile>) => {
      if (!userId) throw new Error("User not authenticated");
      try {
        const batch = writeBatch(db);

        // If setting as default, unset others
        if (updates.isDefault) {
          const existingDefaults = profiles.filter(
            (p) => p.isDefault && p.id !== profileId,
          );
          existingDefaults.forEach((p) => {
            const ref = doc(db, "whatsapp_profiles", p.id);
            batch.update(ref, {
              isDefault: false,
              updatedAt: new Date().toISOString(),
            });
          });
        }

        const profileRef = doc(db, "whatsapp_profiles", profileId);
        batch.update(profileRef, {
          ...updates,
          updatedAt: new Date().toISOString(),
        });

        await batch.commit();
      } catch (err: any) {
        setError(err.message);
        throw err;
      }
    },
    [userId, profiles],
  );

  const deleteProfile = useCallback(
    async (profileId: string) => {
      if (!userId) throw new Error("User not authenticated");
      try {
        // Prevent deleting the last remaining profile? Or allow and user has none?
        // Let's allow but if it was default, maybe set another as default?
        // User logic: just delete.

        // Check assigned forms logic should be in the UI or passed here.
        // But for safety, we should probably check before deleting.
        // However, checking assignments here would require fetching ALL forms/assignments which might be expensive.
        // We'll rely on the caller to check safety or just allow it and show warning that forms will break.
        // The plan said "Implement isProfileAssigned check".

        await deleteDoc(doc(db, "whatsapp_profiles", profileId));
      } catch (err: any) {
        setError(err.message);
        throw err;
      }
    },
    [userId],
  );

  // Helper to check if profile is in use
  // Note: This requires reading 'forms' collection.
  const isProfileAssigned = useCallback(
    async (profileId: string) => {
      if (!userId) return false;

      // Check new single-select addon field
      const singleQuery = query(
        collection(db, "forms"),
        where("config.addons.selectedWhatsappProfileId", "==", profileId),
      );
      const singleSnapshot = await getDocs(singleQuery);
      if (!singleSnapshot.empty) return true;

      // Check legacy multi-select addons field (for backward compat)
      const addonsQuery = query(
        collection(db, "forms"),
        where("config.addons.selectedWhatsappProfileIds", "array-contains", profileId),
      );
      const addonsSnapshot = await getDocs(addonsQuery);
      if (!addonsSnapshot.empty) return true;

      // Fallback: check legacy single-select field
      const legacyQuery = query(
        collection(db, "forms"),
        where("config.thankYou.selectedWhatsappProfileId", "==", profileId),
      );
      const legacySnapshot = await getDocs(legacyQuery);
      return !legacySnapshot.empty;
    },
    [userId],
  );

  return {
    profiles,
    loading,
    error,
    addProfile,
    updateProfile,
    deleteProfile,
    isProfileAssigned,
  };
};
