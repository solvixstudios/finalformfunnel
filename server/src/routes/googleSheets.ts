import { Router, Request, Response } from 'express';
import { db } from '../config/firebase';

const router = Router();

// POST /webhook/google-sheets/sync
// Receives an update from Google Sheets App Script when a status is modified
router.post('/sync', async (req: Request, res: Response) => {
    try {
        const { orderId, status, userId } = req.body;

        if (!orderId || !status || !userId) {
            return res.status(400).json({ success: false, message: 'Missing required parameters: orderId, status, userId' });
        }

        // Validate status is one of our allowed states to avoid garbage data
        const validStatuses = ['completed', 'pending', 'confirmed', 'shipped', 'abandoned', 'cancelled'];
        const normalizedStatus = status.toLowerCase().trim();

        if (!validStatuses.includes(normalizedStatus)) {
            return res.status(400).json({ success: false, message: `Invalid status. Must be one of: ${validStatuses.join(', ')}` });
        }

        // Fetch document from firestore
        const docRef = db.collection('orders').doc(orderId);
        const docSnap = await docRef.get();

        if (!docSnap.exists) {
            return res.status(404).json({ success: false, message: `Order ${orderId} not found in Firestore` });
        }

        const data = docSnap.data();

        // Ensure cross-tenant safety
        if (data?.userId !== userId) {
            return res.status(403).json({ success: false, message: 'Forbidden. Order belongs to a different user namespace.' });
        }

        // Update the order status
        await docRef.update({
            status: normalizedStatus,
            updatedAt: new Date().toISOString()
        });

        console.log(`[Google Sheets] Order ${orderId} successfully synced to status: ${normalizedStatus}`);
        return res.json({ success: true, message: 'Order synced successfully' });

    } catch (error: any) {
        console.error('[Google Sheets] Webhook Sync Error:', error);
        return res.status(500).json({ success: false, message: error.message || 'Internal Server Error' });
    }
});

export default router;
