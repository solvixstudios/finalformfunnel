import { useState, useEffect, useCallback } from 'react';

const LAST_SEEN_VERSION_KEY = 'ff_last_seen_version';
const CHANGELOG_OPEN_EVENT = 'ff:open-changelog';

// __APP_VERSION__ is injected by Vite during build
declare const __APP_VERSION__: string;

export interface ChangelogEntry {
    version: string;
    date: string;
    categories: { type: string; emoji: string; items: string[] }[];
}

/**
 * Parse CHANGELOG.md content into structured entries.
 */
function parseChangelog(raw: string): ChangelogEntry[] {
    const entries: ChangelogEntry[] = [];
    let current: ChangelogEntry | null = null;
    let currentCat: { type: string; emoji: string; items: string[] } | null = null;

    for (const line of raw.split('\n')) {
        const trimmed = line.trim();

        const versionMatch = trimmed.match(/^## (.+?) - (.+)$/);
        if (versionMatch) {
            if (current) entries.push(current);
            current = { version: versionMatch[1], date: versionMatch[2], categories: [] };
            currentCat = null;
            continue;
        }

        const catMatch = trimmed.match(/^### (.{1,2})\s+(.+)$/);
        if (catMatch && current) {
            currentCat = { emoji: catMatch[1], type: catMatch[2], items: [] };
            current.categories.push(currentCat);
            continue;
        }

        if (trimmed.startsWith('- ') && currentCat) {
            currentCat.items.push(trimmed.slice(2));
            continue;
        }
    }
    if (current) entries.push(current);

    return entries;
}

export function useChangelog() {
    const [showChangelog, setShowChangelog] = useState(false);
    const [currentVersion, setCurrentVersion] = useState('1.0.0');
    const [entries, setEntries] = useState<ChangelogEntry[]>([]);

    // Load and parse changelog
    useEffect(() => {
        import('/CHANGELOG.md?raw').then((mod) => {
            setEntries(parseChangelog(mod.default));
        }).catch(console.error);
    }, []);

    // Auto-show logic: only when version changes (not for brand-new users)
    useEffect(() => {
        try {
            const appVersion = typeof __APP_VERSION__ !== 'undefined' ? __APP_VERSION__ : '1.0.0';
            setCurrentVersion(appVersion);

            const lastSeenVersion = localStorage.getItem(LAST_SEEN_VERSION_KEY);

            if (lastSeenVersion && lastSeenVersion !== appVersion) {
                setShowChangelog(true);
            } else if (!lastSeenVersion) {
                localStorage.setItem(LAST_SEEN_VERSION_KEY, appVersion);
            }
        } catch (e) {
            console.error('Error checking changelog version:', e);
        }
    }, []);

    // Listen for manual open events (from settings or anywhere)
    useEffect(() => {
        const handler = () => setShowChangelog(true);
        window.addEventListener(CHANGELOG_OPEN_EVENT, handler);
        return () => window.removeEventListener(CHANGELOG_OPEN_EVENT, handler);
    }, []);

    const dismissChangelog = useCallback(() => {
        try {
            const appVersion = typeof __APP_VERSION__ !== 'undefined' ? __APP_VERSION__ : '1.0.0';
            localStorage.setItem(LAST_SEEN_VERSION_KEY, appVersion);
            setShowChangelog(false);
        } catch (e) {
            console.error('Error dismissing changelog:', e);
            setShowChangelog(false);
        }
    }, []);

    return {
        showChangelog,
        dismissChangelog,
        currentVersion,
        entries,
    };
}

/** Call from anywhere to open the changelog modal */
export function openChangelog() {
    window.dispatchEvent(new Event(CHANGELOG_OPEN_EVENT));
}
