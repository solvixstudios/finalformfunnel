import { useCallback, useEffect, useRef, useState } from 'react';

export type ConnectionState = 'connected' | 'degraded' | 'server-down' | 'offline';

export interface ConnectionStatus {
    /** Browser has internet */
    isOnline: boolean;
    /** Backend server is reachable */
    isServerUp: boolean;
    /** Latency to server in ms */
    latency: number | null;
    /** Last successful health check */
    lastChecked: Date | null;
    /** Aggregate status */
    status: ConnectionState;
    /** Whether the user just came back online (for "back online" flash) */
    justReconnected: boolean;
}

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || '';
const HEALTH_ENDPOINT = `${BACKEND_URL}/health`;
const BASE_INTERVAL = 30_000; // 30s
const MAX_INTERVAL = 120_000; // 2min
const DEGRADED_THRESHOLD = 3_000; // 3s

export function useConnectionStatus(): ConnectionStatus {
    const [isOnline, setIsOnline] = useState(navigator.onLine);
    const [isServerUp, setIsServerUp] = useState(true); // optimistic
    const [latency, setLatency] = useState<number | null>(null);
    const [lastChecked, setLastChecked] = useState<Date | null>(null);
    const [justReconnected, setJustReconnected] = useState(false);

    const consecutiveFailures = useRef(0);
    const wasOffline = useRef(false);
    const wasServerDown = useRef(false);
    const intervalRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    // ─── Health Check ───
    const checkHealth = useCallback(async () => {
        if (!navigator.onLine || !BACKEND_URL) return;

        const start = performance.now();
        try {
            const controller = new AbortController();
            const timeout = setTimeout(() => controller.abort(), 10_000);

            const res = await fetch(HEALTH_ENDPOINT, {
                method: 'GET',
                signal: controller.signal,
                headers: { 'ngrok-skip-browser-warning': '1' },
            });
            clearTimeout(timeout);

            const elapsed = Math.round(performance.now() - start);

            if (res.ok) {
                const wasDown = !isServerUp || wasServerDown.current;
                setIsServerUp(true);
                setLatency(elapsed);
                setLastChecked(new Date());
                consecutiveFailures.current = 0;

                // Flash "reconnected" if server was previously down
                if (wasDown && wasServerDown.current) {
                    setJustReconnected(true);
                    wasServerDown.current = false;
                    reconnectTimerRef.current = setTimeout(() => setJustReconnected(false), 4000);
                }
            } else {
                throw new Error(`HTTP ${res.status}`);
            }
        } catch {
            consecutiveFailures.current += 1;
            setIsServerUp(false);
            setLatency(null);
            wasServerDown.current = true;
        }
    }, [isServerUp]);

    // ─── Schedule next ping with backoff ───
    const scheduleNext = useCallback(() => {
        if (intervalRef.current) clearTimeout(intervalRef.current);

        const backoff = Math.min(
            BASE_INTERVAL * Math.pow(1.5, consecutiveFailures.current),
            MAX_INTERVAL,
        );

        intervalRef.current = setTimeout(() => {
            checkHealth().then(scheduleNext);
        }, backoff);
    }, [checkHealth]);

    // ─── Browser online/offline ───
    useEffect(() => {
        const handleOnline = () => {
            setIsOnline(true);

            // If we were offline, flash "reconnected"
            if (wasOffline.current) {
                setJustReconnected(true);
                wasOffline.current = false;
                reconnectTimerRef.current = setTimeout(() => setJustReconnected(false), 4000);
            }

            // Immediately check server after coming back online
            checkHealth().then(scheduleNext);
        };

        const handleOffline = () => {
            setIsOnline(false);
            setIsServerUp(false);
            wasOffline.current = true;
            setJustReconnected(false);
        };

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, [checkHealth, scheduleNext]);

    // ─── Initial check + polling ───
    useEffect(() => {
        // Delay initial check slightly to avoid blocking first paint
        const initial = setTimeout(() => {
            checkHealth().then(scheduleNext);
        }, 3000);

        return () => {
            clearTimeout(initial);
            if (intervalRef.current) clearTimeout(intervalRef.current);
            if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current);
        };
    }, [checkHealth, scheduleNext]);

    // ─── Derived status ───
    const status: ConnectionState = !isOnline
        ? 'offline'
        : !isServerUp
            ? 'server-down'
            : latency !== null && latency > DEGRADED_THRESHOLD
                ? 'degraded'
                : 'connected';

    return { isOnline, isServerUp, latency, lastChecked, status, justReconnected };
}
