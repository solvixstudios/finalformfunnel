import {
    collection,
    deleteDoc,
    doc,
    onSnapshot,
    query,
    where,
    writeBatch,
} from "firebase/firestore";
import { useCallback, useEffect, useState } from "react";
import { db } from "../firebase";
import { MetaPixelProfile } from "./types";

export const useMetaPixels = (userId: string) => {
    const [pixels, setPixels] = useState<MetaPixelProfile[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!userId) {
            setLoading(false);
            return;
        }
        setLoading(true);

        const q = query(
            collection(db, "users", userId, "meta_pixels"),
            where("userId", "==", userId),
        );

        const unsubscribe = onSnapshot(
            q,
            (snapshot) => {
                const fetchedPixels: MetaPixelProfile[] = [];
                snapshot.forEach((doc) => {
                    fetchedPixels.push({ id: doc.id, ...doc.data() } as MetaPixelProfile);
                });
                // Sort by createdAt desc
                fetchedPixels.sort(
                    (a, b) =>
                        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
                );
                setPixels(fetchedPixels);
                setLoading(false);
                setError(null);
            },
            (err) => {
                console.error("Error fetching Meta Pixels:", err);
                setError(err.message);
                setLoading(false);
            },
        );

        return () => unsubscribe();
    }, [userId]);

    const addPixel = useCallback(
        async (pixelData: {
            name: string;
            pixels: {
                pixelId: string;
                capiToken?: string;
                testCode?: string;
            }[];
        }) => {
            if (!userId) throw new Error("User not authenticated");

            // Basic validation
            if (pixelData.pixels.some(p => !/^\d+$/.test(p.pixelId))) {
                throw new Error("All Pixel IDs must contain only numbers");
            }

            try {
                const batch = writeBatch(db);

                const newPixel = {
                    userId,
                    name: pixelData.name,
                    pixels: pixelData.pixels,
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString(),
                };

                const docRef = doc(collection(db, "users", userId, "meta_pixels"));
                batch.set(docRef, newPixel);

                await batch.commit();
                return { id: docRef.id, ...newPixel };
            } catch (err: unknown) {
                setError(err.message);
                throw err;
            }
        },
        [userId],
    );

    const updatePixel = useCallback(
        async (pixelId: string, updates: Partial<MetaPixelProfile>) => {
            if (!userId) throw new Error("User not authenticated");

            if (updates.pixels && updates.pixels.some(p => !/^\d+$/.test(p.pixelId))) {
                throw new Error("All Pixel IDs must contain only numbers");
            }

            try {
                const batch = writeBatch(db);
                const pixelRef = doc(db, "users", userId, "meta_pixels", pixelId);

                batch.update(pixelRef, {
                    ...updates,
                    updatedAt: new Date().toISOString(),
                });

                await batch.commit();
            } catch (err: unknown) {
                setError(err.message);
                throw err;
            }
        },
        [userId],
    );

    const deletePixel = useCallback(
        async (pixelId: string) => {
            if (!userId) throw new Error("User not authenticated");
            try {
                await deleteDoc(doc(db, "users", userId, "meta_pixels", pixelId));
            } catch (err: unknown) {
                setError(err.message);
                throw err;
            }
        },
        [userId],
    );

    return {
        pixels,
        loading,
        error,
        addPixel,
        updatePixel,
        deletePixel,
    };
};
