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
import { DeliveryProfile, DeliveryProviderType } from "./types";

export const useDeliveryProfiles = (userId: string) => {
    const [profiles, setProfiles] = useState<DeliveryProfile[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!userId) {
            setLoading(false);
            return;
        }
        setLoading(true);

        const q = query(
            collection(db, "users", userId, "delivery_profiles"),
            where("userId", "==", userId)
        );

        const unsubscribe = onSnapshot(
            q,
            (snapshot) => {
                const fetchedProfiles: DeliveryProfile[] = [];
                snapshot.forEach((doc) => {
                    fetchedProfiles.push({ id: doc.id, ...doc.data() } as DeliveryProfile);
                });
                // Sort by createdAt desc
                fetchedProfiles.sort(
                    (a, b) =>
                        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
                );
                setProfiles(fetchedProfiles);
                setLoading(false);
                setError(null);
            },
            (err) => {
                console.error("Error fetching Delivery profiles:", err);
                setError(err.message);
                setLoading(false);
            }
        );

        return () => unsubscribe();
    }, [userId]);

    const addProfile = useCallback(
        async (profileData: {
            name: string;
            provider: DeliveryProviderType;
            isActive: boolean;
            apiToken?: string;
            apiKey?: string;
            apiId?: string;
            storeId?: string;
        }) => {
            if (!userId) throw new Error("User not authenticated");
            try {
                const batch = writeBatch(db);

                const newProfile = {
                    userId,
                    name: profileData.name,
                    provider: profileData.provider,
                    isActive: profileData.isActive,
                    apiToken: profileData.apiToken || "",
                    apiKey: profileData.apiKey || "",
                    apiId: profileData.apiId || "",
                    storeId: profileData.storeId || "",
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString(),
                };

                const docRef = doc(collection(db, "users", userId, "delivery_profiles"));
                batch.set(docRef, newProfile);

                await batch.commit();
                return { id: docRef.id, ...newProfile };
            } catch (err: any) {
                setError(err.message);
                throw err;
            }
        },
        [userId]
    );

    const updateProfile = useCallback(
        async (profileId: string, updates: Partial<DeliveryProfile>) => {
            if (!userId) throw new Error("User not authenticated");
            try {
                const batch = writeBatch(db);

                const profileRef = doc(db, "users", userId, "delivery_profiles", profileId);
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
        [userId]
    );

    const deleteProfile = useCallback(
        async (profileId: string) => {
            if (!userId) throw new Error("User not authenticated");
            try {
                await deleteDoc(doc(db, "users", userId, "delivery_profiles", profileId));
            } catch (err: any) {
                setError(err.message);
                throw err;
            }
        },
        [userId]
    );

    // Checks if a profile is currently the default or heavily relied on. 
    // Delivery profiles aren't inherently linked per form anymore, but we can keep standard checks
    const isProfileAssigned = useCallback(
        async (profileId: string) => {
            // In a more robust system, you'd check if any incomplete orders depend on this.
            // But for now, we'll allow safe deletion since it's just a config.
            return false;
        },
        []
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
