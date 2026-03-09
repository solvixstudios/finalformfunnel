import { collection, doc, onSnapshot, setDoc, deleteDoc, query, orderBy } from 'firebase/firestore';
import { useCallback, useEffect, useState } from 'react';
import { Offer } from '../components/managers/PacksManager';
import { PromoCode } from '../components/managers/PromoCodeManager';
import { ShippingConfig } from '../components/managers/ShippingManager';
import { db } from '../lib/firebase';

export interface RuleMetadata {
    id: string;
    name: string;
    labels?: string[];
    createdAt: number;
    updatedAt: number;
}

export interface OfferRule extends RuleMetadata {
    offers: Offer[];
}

export interface ShippingRule extends RuleMetadata {
    shipping: ShippingConfig;
}

export interface CouponRule extends RuleMetadata {
    coupons: PromoCode[];
    config: {
        enabled: boolean;
        required: boolean;
    };
}

export const useFormRules = (userId: string | undefined, type: 'offers' | 'shipping' | 'coupons') => {
    const [rules, setRules] = useState<any[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    const collectionName = type === 'offers' ? 'offerRules' : type === 'shipping' ? 'shippingRules' : 'couponRules';

    // Real-time listener for rules list
    useEffect(() => {
        if (!userId) {
            setLoading(false);
            return;
        }

        const q = query(
            collection(db, 'users', userId, collectionName),
            orderBy('updatedAt', 'desc')
        );

        const unsubscribe = onSnapshot(
            q,
            (snapshot) => {
                const fetchedRules = snapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }));
                setRules(fetchedRules);
                setLoading(false);
            },
            (err) => {
                console.error("Error fetching rules:", err);
                setError(err.message);
                setLoading(false);
            }
        );

        return () => unsubscribe();
    }, [userId, collectionName]);

    // Save a rule
    const saveRule = useCallback(
        async (ruleData: any) => {
            if (!userId) throw new Error("User not authenticated");
            try {
                const isNew = !ruleData.id;
                const ruleId = isNew ? doc(collection(db, 'users', userId, collectionName)).id : ruleData.id;

                const now = Date.now();
                const dataToSave = {
                    ...ruleData,
                    id: ruleId,
                    updatedAt: now,
                    createdAt: isNew ? now : (ruleData.createdAt || now)
                };

                const docRef = doc(db, 'users', userId, collectionName, ruleId);
                await setDoc(docRef, dataToSave, { merge: true });
                return ruleId;
            } catch (err: unknown) {
                setError((err as Error).message);
                throw err;
            }
        },
        [userId, collectionName]
    );

    // Delete a rule
    const deleteRule = useCallback(
        async (ruleId: string) => {
            if (!userId) throw new Error("User not authenticated");
            try {
                const docRef = doc(db, 'users', userId, collectionName, ruleId);
                await deleteDoc(docRef);
            } catch (err: unknown) {
                setError((err as Error).message);
                throw err;
            }
        },
        [userId, collectionName]
    );

    return { rules, loading, error, saveRule, deleteRule };
};
