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

export interface GoogleSheetConfig {
    id: string;
    userId: string;
    name: string;
    webhookUrl: string;
    sheetName: string;
    abandonedSheetName?: string;
    isDefault: boolean;
    createdAt: string;
    updatedAt: string;
}

export const useGoogleSheets = (userId: string) => {
    const [sheets, setSheets] = useState<GoogleSheetConfig[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!userId) {
            setLoading(false);
            return;
        }
        setLoading(true);

        const q = query(
            collection(db, "google_sheets"),
            where("userId", "==", userId),
        );

        const unsubscribe = onSnapshot(
            q,
            (snapshot) => {
                const fetchedSheets: GoogleSheetConfig[] = [];
                snapshot.forEach((doc) => {
                    fetchedSheets.push({ id: doc.id, ...doc.data() } as GoogleSheetConfig);
                });
                fetchedSheets.sort(
                    (a, b) =>
                        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
                );
                setSheets(fetchedSheets);
                setLoading(false);
                setError(null);
            },
            (err) => {
                console.error("Error fetching Google Sheets:", err);
                setError(err.message);
                setLoading(false);
            },
        );

        return () => unsubscribe();
    }, [userId]);

    const addSheet = useCallback(
        async (sheetData: {
            name: string;
            webhookUrl: string;
            sheetName: string;
            isDefault?: boolean;
        }) => {
            if (!userId) throw new Error("User not authenticated");

            const batch = writeBatch(db);
            const newDocRef = doc(collection(db, "google_sheets"));

            // If this is being set as default, unset others
            if (sheetData.isDefault) {
                sheets.forEach((s) => {
                    if (s.isDefault) {
                        batch.update(doc(db, "google_sheets", s.id), { isDefault: false });
                    }
                });
            }

            batch.set(newDocRef, {
                ...sheetData,
                userId,
                isDefault: sheetData.isDefault ?? sheets.length === 0,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
            });

            await batch.commit();
            return newDocRef.id;
        },
        [userId, sheets],
    );

    const updateSheet = useCallback(
        async (
            sheetId: string,
            updates: Partial<Omit<GoogleSheetConfig, "id" | "userId" | "createdAt">>,
        ) => {
            const batch = writeBatch(db);

            // If setting as default, unset others
            if (updates.isDefault) {
                sheets.forEach((s) => {
                    if (s.id !== sheetId && s.isDefault) {
                        batch.update(doc(db, "google_sheets", s.id), { isDefault: false });
                    }
                });
            }

            batch.update(doc(db, "google_sheets", sheetId), {
                ...updates,
                updatedAt: new Date().toISOString(),
            });

            await batch.commit();
        },
        [sheets],
    );

    const deleteSheet = useCallback(async (sheetId: string) => {
        await deleteDoc(doc(db, "google_sheets", sheetId));
    }, []);

    return {
        sheets,
        loading,
        error,
        addSheet,
        updateSheet,
        deleteSheet,
    };
};
