/**
 * Public Form Config API Route
 * 
 * This page serves as a public API endpoint that returns form configurations.
 * The Shopify loader script fetches from this endpoint directly.
 * 
 * URL: /api/form-config?domain=<domain>&productId=<productId>&productHandle=<handle>
 */

import { getFormConfig } from '@/lib/api/formConfig';
import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';

export default function FormConfigAPI() {
    const [searchParams] = useSearchParams();
    const [response, setResponse] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchConfig = async () => {
            const domain = searchParams.get('domain') || '';
            const productId = searchParams.get('productId') || undefined;
            const productHandle = searchParams.get('productHandle') || undefined;

            if (!domain) {
                setResponse({ error: 'Missing domain parameter' });
                setLoading(false);
                return;
            }

            const result = await getFormConfig(domain, productId, productHandle);
            setResponse(result);
            setLoading(false);
        };

        fetchConfig();
    }, [searchParams]);

    // Set CORS headers via meta tag workaround (actual CORS handled by hosting config)
    useEffect(() => {
        // For SPA-based API, we return JSON directly in the page
        // The loader will fetch this page and parse the JSON from the pre element
    }, []);

    if (loading) {
        return (
            <pre id="api-response" style={{ display: 'none' }}>
                {JSON.stringify({ loading: true })}
            </pre>
        );
    }

    return (
        <pre id="api-response" data-api-response="true" style={{ fontFamily: 'monospace', padding: '20px' }}>
            {JSON.stringify(response, null, 2)}
        </pre>
    );
}
