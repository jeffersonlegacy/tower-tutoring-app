/**
 * useNetworkStatus - Monitor online/offline status
 */
import { useState, useEffect } from 'react';

export function useNetworkStatus() {
    const [isOnline, setIsOnline] = useState(navigator.onLine);
    const [wasOffline, setWasOffline] = useState(false);

    useEffect(() => {
        const handleOnline = () => {
            setIsOnline(true);
            if (wasOffline) {
                console.log('[Network] Back online - syncing queued data');
                setWasOffline(false);
            }
        };

        const handleOffline = () => {
            setIsOnline(false);
            setWasOffline(true);
            console.log('[Network] Connection lost - queuing writes');
        };

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, [wasOffline]);

    return { isOnline, wasOffline };
}
