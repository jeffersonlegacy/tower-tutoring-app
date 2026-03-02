/**
 * useHaptics - Utility hook for haptic feedback
 */
import { useCallback } from 'react';

export function useHaptics() {
    const triggerHaptic = useCallback((pattern = 10) => {
        if (navigator.vibrate) {
            navigator.vibrate(pattern);
        }
    }, []);

    const triggerSuccess = useCallback(() => {
        triggerHaptic([10, 50, 10]); // Short-long-short pattern
    }, [triggerHaptic]);

    const triggerError = useCallback(() => {
        triggerHaptic(50); // Single medium vibration
    }, [triggerHaptic]);

    const triggerLight = useCallback(() => {
        triggerHaptic(10); // Short tap
    }, [triggerHaptic]);

    return {
        triggerHaptic,
        triggerSuccess,
        triggerError,
        triggerLight
    };
}
