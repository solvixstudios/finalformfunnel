
import { collection, doc, getDoc, getDocs, query, where } from "firebase/firestore";
import { db } from "../firebase"; // Adjust path as needed
import { getAdapter } from "../integrations";

/**
 * Propagates form configuration changes to all n8n assignments.
 * This ensures that when a form is edited, the changes are reflected in the store webhooks immediately.
 */

/**
 * Propagates form configuration changes to all n8n assignments.
 * This ensures that when a form is edited, the changes are reflected in the store webhooks immediately.
 */
export async function propagateFormUpdate(formId: string, formName: string, config: any) {
    try {
        console.log(`[Sync] Propagating updates for form ${formId} to n8n...`);

        // 0. Resolve Google Sheets if IDs are present but full objects are missing
        // (FormLoader expects 'sheets' array with webhookUrl, etc.)
        if (config?.addons?.selectedSheetIds?.length > 0) {
            try {
                const sheetIds = config.addons.selectedSheetIds;
                const sheets: any[] = [];

                // Fetch each sheet config
                // We use Promise.all for parallel fetching
                const sheetPromises = sheetIds.map(async (id: string) => {
                    const docSnap = await getDoc(doc(db, "google_sheets", id));
                    if (docSnap.exists()) {
                        return { id: docSnap.id, ...docSnap.data() };
                    }
                    return null;
                });

                const results = await Promise.all(sheetPromises);

                // Map to the format FormLoader expects
                results.forEach((sheet: any) => {
                    if (sheet) {
                        sheets.push({
                            webhookUrl: sheet.webhookUrl,
                            sheetName: sheet.sheetName || "Orders",
                            abandonedSheetName: sheet.abandonedSheetName,
                            columns: sheet.columns || [],
                            pinnedCount: sheet.pinnedCount ?? 3
                        });
                    }
                });

                // Inject into config
                if (!config.addons) config.addons = {};
                config.addons.sheets = sheets;
                config.addons.enableSheets = sheets.length > 0;

                console.log(`[Sync] Resolved ${sheets.length} Google Sheets for form.`);
            } catch (e) {
                console.warn("[Sync] Failed to resolve Google Sheets:", e);
                // Continue with sync anyway, don't block
            }
        }

        // 1. Find all active assignments for this form
        const assignmentsQuery = query(
            collection(db, "assignments"),
            where("formId", "==", formId)
        );
        const assignmentsSnap = await getDocs(assignmentsQuery);

        if (assignmentsSnap.empty) {
            console.log(`[Sync] No active assignments for form ${formId}. Skipping n8n sync.`);
            return;
        }

        console.log(`[Sync] Found ${assignmentsSnap.size} assignments to update.`);

        // 2. For each assignment, push the new config to n8n
        const updatePromises = assignmentsSnap.docs.map(async (assignDoc) => {
            const assignment = assignDoc.data();
            const { storeId, assignmentType, productId } = assignment;

            if (!storeId) return;

            // Fetch store credentials
            const storeRef = doc(db, "stores", storeId);
            const storeSnap = await getDoc(storeRef);

            if (!storeSnap.exists()) {
                console.warn(`[Sync] Store ${storeId} not found for assignment ${assignDoc.id}`);
                return;
            }

            const storeData = storeSnap.data();
            if (!storeData.clientId || !storeData.clientSecret) {
                console.warn(`[Sync] Store ${storeId} missing credentials`);
                return;
            }

            const subdomain = (storeData.url || "")
                .replace(/^https?:\/\//, "")
                .replace(/\.myshopify\.com$/, "");

            const adapter = getAdapter(storeData.platform || 'shopify');

            // Push to n8n
            await adapter.assignForm(
                subdomain,
                {
                    clientId: storeData.clientId,
                    clientSecret: storeData.clientSecret
                },
                { ...config, formId, name: formName }, // Ensure ID/Name are present
                {
                    formId,
                    formName,
                    storeId,
                    assignmentType: assignmentType as "store" | "product",
                    productId: productId || undefined
                }
            );
        });

        await Promise.allSettled(updatePromises);
        console.log(`[Sync] Successfully synced form ${formId} to n8n.`);

    } catch (error) {
        console.error("[Sync] Failed to propagate form updates:", error);
        // We don't throw here to avoid blocking the Firestore save UI
    }
}

