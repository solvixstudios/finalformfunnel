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
import { TikTokPixelProfile } from "./types";

export const useTikTokPixels = (userId: string) => {
    const [pixels, setPixels] = useState<TikTokPixelProfile[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!userId) {
            setLoading(false);
            return;
        }
        setLoading(true);

        const q = query(
            collection(db, "tiktok_pixels"),
            where("userId", "==", userId),
        );

        const unsubscribe = onSnapshot(
            q,
            (snapshot) => {
                const fetchedPixels: TikTokPixelProfile[] = [];
                snapshot.forEach((doc) => {
                    fetchedPixels.push({ id: doc.id, ...doc.data() } as TikTokPixelProfile);
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
                console.error("Error fetching TikTok Pixels:", err);
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
                accessToken?: string;
                testCode?: string;
            }[];
        }) => {
            if (!userId) throw new Error("User not authenticated");

            // Basic validation
            if (pixelData.pixels.some(p => !/^[A-Z0-9]+$/.test(p.pixelId))) {
                // TikTok Pixel IDs are alphanumeric (e.g., C1234567890)
                throw new Error("Invalid TikTok Pixel ID format");
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

                const docRef = doc(collection(db, "tiktok_pixels"));
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
        async (pixelId: string, updates: Partial<TikTokPixelProfile>) => {
            if (!userId) throw new Error("User not authenticated");

            if (updates.pixels && updates.pixels.some(p => !/^[A-Z0-9]+$/.test(p.pixelId))) {
                throw new Error("Invalid TikTok Pixel ID format");
            }

            try {
                const batch = writeBatch(db);
                const pixelRef = doc(db, "tiktok_pixels", pixelId);

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
                await deleteDoc(doc(db, "tiktok_pixels", pixelId));
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
