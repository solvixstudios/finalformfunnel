import { createContext, useContext, ReactNode, useState, useEffect } from 'react';
import { useConnectedStores } from '@/lib/firebase/hooks';
import { ConnectedStore } from '@/lib/firebase/types';
import { db } from '@/lib/firebase';
import { collection, query, onSnapshot } from 'firebase/firestore';

export interface BackendAssignment {
    type: 'store' | 'product';
    formId: string;
    productId?: string;
    storeId: string;
}

interface AssignmentsContextType {
    stores: ConnectedStore[];
    assignments: BackendAssignment[];
    loading: boolean;
    error: string | null;
    refetch: () => Promise<void>;
}

const AssignmentsContext = createContext<AssignmentsContextType | undefined>(undefined);

export function AssignmentsProvider({ children, userId }: { children: ReactNode; userId: string }) {
    // Centralized fetching of stores
    const { stores, loading: storesLoading } = useConnectedStores(userId);

    // Native real-time Firestore sync for assignments (fixes UI staleness)
    const [assignments, setAssignments] = useState<BackendAssignment[]>([]);
    const [assignmentsLoading, setAssignmentsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!userId) {
            setAssignments([]);
            setAssignmentsLoading(false);
            return;
        }

        setAssignmentsLoading(true);
        const q = query(collection(db, 'users', userId, 'assignments'));

        const unsubscribe = onSnapshot(
            q,
            (snapshot) => {
                const fetched: BackendAssignment[] = [];
                snapshot.forEach((doc) => {
                    const data = doc.data();
                    fetched.push({
                        type: data.assignmentType as 'store' | 'product',
                        formId: data.formId,
                        productId: data.productId || undefined,
                        storeId: data.storeId,
                    });
                });
                setAssignments(fetched);
                setAssignmentsLoading(false);
                setError(null);
            },
            (err) => {
                console.error('[AssignmentsContext] Error fetching assignments:', err);
                setError(err.message);
                setAssignmentsLoading(false);
            }
        );

        return () => unsubscribe();
    }, [userId]);

    const loading = storesLoading || assignmentsLoading;

    return (
        <AssignmentsContext.Provider value={{ stores, assignments, loading, error, refetch: async () => { } }}>
            {children}
        </AssignmentsContext.Provider>
    );
}

export function useAssignmentsContext() {
    const context = useContext(AssignmentsContext);
    if (context === undefined) {
        throw new Error('useAssignmentsContext must be used within an AssignmentsProvider');
    }
    return context;
}
