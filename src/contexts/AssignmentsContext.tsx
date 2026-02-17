import { createContext, useContext, ReactNode } from 'react';
import { useConnectedStores } from '@/lib/firebase/hooks';
import { useStoreAssignments, N8nAssignment } from '@/lib/hooks/useStoreAssignments';
import { ConnectedStore } from '@/lib/firebase/types';

interface AssignmentsContextType {
    stores: ConnectedStore[];
    assignments: N8nAssignment[];
    loading: boolean;
    error: string | null;
    refetch: () => Promise<void>;
}

const AssignmentsContext = createContext<AssignmentsContextType | undefined>(undefined);

export function AssignmentsProvider({ children, userId }: { children: ReactNode; userId: string }) {
    // Centralized fetching of stores and assignments
    const { stores, loading: storesLoading } = useConnectedStores(userId);
    const { assignments, loading: assignmentsLoading, error, refetch } = useStoreAssignments(stores);

    const loading = storesLoading || assignmentsLoading;

    return (
        <AssignmentsContext.Provider value={{ stores, assignments, loading, error, refetch }}>
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
