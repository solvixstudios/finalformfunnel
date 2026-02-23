import { useState, useEffect } from 'react';
import { collection, query, orderBy, onSnapshot, doc, updateDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { toast } from 'sonner';

export interface Order {
    id: string; // Firestore document ID
    orderId: string; // Generated ORD-xxx ID
    userId: string;
    status: 'completed' | 'abandoned' | 'pending' | 'confirmed' | 'shipped' | 'cancelled' | string;
    createdAt: string;

    // Customer Info
    name?: string;
    phone?: string;
    wilaya?: string;
    commune?: string;
    address?: string;
    note?: string;

    // Product Info
    productId?: string;
    productTitle?: string;
    variant?: string;
    quantity?: number;
    offerQty?: number;
    offerTitle?: string;

    // Pricing
    totalPrice?: number;
    offerPrice?: number;
    shippingPrice?: number;
    currency?: string;

    // Store Info
    shopDomain?: string;
    shopName?: string;

    [key: string]: any;
}

export function useOrders(userId: string) {
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!userId) {
            setOrders([]);
            setLoading(false);
            return;
        }

        const q = query(
            collection(db, 'users', userId, 'orders'),
            orderBy('createdAt', 'desc')
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const ordersData = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            })) as Order[];

            setOrders(ordersData);
            setLoading(false);
            setError(null);
        }, (err) => {
            console.error('Error fetching orders:', err);
            setError(err.message);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [userId]);

    const updateOrderStatus = async (orderId: string, newStatus: string) => {
        try {
            const orderRef = doc(db, 'users', userId, 'orders', orderId);
            await updateDoc(orderRef, { status: newStatus });
            toast.success('Order status updated');
        } catch (err: any) {
            console.error('Error updating order status:', err);
            toast.error(err.message || 'Failed to update order status');
            throw err;
        }
    };

    return { orders, loading, error, updateOrderStatus };
}
