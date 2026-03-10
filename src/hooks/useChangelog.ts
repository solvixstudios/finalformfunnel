import { useState, useEffect } from 'react';

const LAST_SEEN_VERSION_KEY = 'ff_last_seen_version';

// __APP_VERSION__ is injected by Vite during build
declare const __APP_VERSION__: string;

export function useChangelog() {
    const [showChangelog, setShowChangelog] = useState(false);
    const [currentVersion, setCurrentVersion] = useState('1.0.0');

    useEffect(() => {
        try {
            // Depending heavily on the injected version from Vite define
            const appVersion = typeof __APP_VERSION__ !== 'undefined' ? __APP_VERSION__ : '1.0.0';
            setCurrentVersion(appVersion);

            const lastSeenVersion = localStorage.getItem(LAST_SEEN_VERSION_KEY);

            // If no recorded version, or recorded version is older than current app version
            if (!lastSeenVersion || lastSeenVersion !== appVersion) {
                // Determine if we should show the modal (don't show strictly for new users, but optional if we want an onboarding modal instead)
                if (lastSeenVersion) {
                    setShowChangelog(true);
                } else {
                    // For completely new users, just secretly set it so they aren't bombarded with a changelog right after signing up
                    localStorage.setItem(LAST_SEEN_VERSION_KEY, appVersion);
                }
            }
        } catch (e) {
            console.error('Error checking changelog version:', e);
        }
    }, []);

    const dismissChangelog = () => {
        try {
            const appVersion = typeof __APP_VERSION__ !== 'undefined' ? __APP_VERSION__ : '1.0.0';
            localStorage.setItem(LAST_SEEN_VERSION_KEY, appVersion);
            setShowChangelog(false);
        } catch (e) {
            console.error('Error dismissing changelog:', e);
            setShowChangelog(false);
        }
    };

    return {
        showChangelog,
        dismissChangelog,
        currentVersion
    };
}
