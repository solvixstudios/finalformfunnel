import axios from 'axios';

/**
 * Google Sheets Service
 * Handles dispatching payloads to the user's custom Google Apps Script endpoint.
 */

export function triggerGoogleSheet(
    config: { scriptUrl: string; sheetName?: string; abandonedSheetName?: string },
    payload: Record<string, unknown>
) {
    // Fire-and-forget, don't block the response
    axios.post(config.scriptUrl, payload).catch((err) => {
        console.error('Google Sheet trigger error:', err.message);
    });
}
