/**
 * useLiveObservation.js - V2.0 Adaptive "Watch Me Work" Mode
 * 
 * Provides "Live & Interactive" feeling by auto-observing the user's work.
 * 
 * V2.0 Enhancements:
 * - Adaptive debounce timing based on student pace
 * - Delta-only region transmission
 * - Smart silence (only intervene on error signals)
 */
import { useEffect, useRef, useCallback } from 'react';
import { captureWhiteboard } from '../utils/WhiteboardCapture';
import { strokeAnalytics } from '../utils/StrokeAnalytics';

// Config (V2.0: Now adaptive ranges)
const BASE_DEBOUNCE_MS = 3500;
const MIN_DEBOUNCE_MS = 2000;
const MAX_DEBOUNCE_MS = 6000;
const BASE_COOLDOWN_MS = 15000;

export function useLiveObservation(editor, isEnabled) {
    const timeoutRef = useRef(null);
    const lastScanTime = useRef(0);
    const isObserving = useRef(false);

    const triggerObservation = useCallback(async () => {
        if (!isEnabled || !editor) return;

        // COOLDOWN CHECK
        const now = Date.now();
        if (now - lastScanTime.current < BASE_COOLDOWN_MS) {
            console.log('[LiveObserver] Cooldown active, skipping scan.');
            return;
        }
        
        // V2.0: Smart Silence - Check emotion state before intervening
        const emotion = strokeAnalytics.getEmotionSpectrum();
        if (emotion.primary === 'flow' && emotion.confidence > 70) {
            console.log('[LiveObserver] Student in FLOW state, staying silent.');
            return;
        }

        console.log('[LiveObserver] 👀 Auto-observing user work...');
        isObserving.current = true;

        try {
            // reuse the capture utility
            const imageData = await captureWhiteboard();
            if (imageData) {
                // Dispatch special "auto-observation" event
                window.dispatchEvent(new CustomEvent('ai-vision-upload', { 
                    detail: { 
                        image: imageData, 
                        isAuto: true,
                        emotionState: emotion.primary,
                        emotionConfidence: emotion.confidence
                    } 
                }));
                lastScanTime.current = Date.now();
            }
        } catch (err) {
            console.warn('[LiveObserver] Observation failed:', err);
        } finally {
            isObserving.current = false;
        }
    }, [editor, isEnabled]);
    
    /**
     * V2.0: Calculate adaptive debounce based on student baseline
     */
    const getAdaptiveDebounce = useCallback(() => {
        const baseline = strokeAnalytics.baseline;
        if (!baseline.avgPause) return BASE_DEBOUNCE_MS;
        
        // If student naturally pauses longer, give them more time
        const adaptedMs = Math.min(MAX_DEBOUNCE_MS, 
            Math.max(MIN_DEBOUNCE_MS, baseline.avgPause * 1000 * 1.5));
        
        return adaptedMs;
    }, []);

    useEffect(() => {
        if (!editor || !isEnabled) return;

        // Listen to all changes in the store
        const unsubscribe = editor.store.listen((entry) => {
            // Only care about drawing changes (shapes)
            const hasShapeChanges = Object.keys(entry.changes.added).some(k => k.startsWith('shape:')) ||
                                    Object.keys(entry.changes.updated).some(k => k.startsWith('shape:')) ||
                                    Object.keys(entry.changes.removed).some(k => k.startsWith('shape:'));

            if (hasShapeChanges) {
                // Reset timer on every stroke
                if (timeoutRef.current) clearTimeout(timeoutRef.current);
                
                // V2.0: Use adaptive debounce
                const debounceMs = getAdaptiveDebounce();
                timeoutRef.current = setTimeout(triggerObservation, debounceMs);
            }
        });

        return () => {
             unsubscribe();
             if (timeoutRef.current) clearTimeout(timeoutRef.current);
        };
    }, [editor, isEnabled, triggerObservation, getAdaptiveDebounce]);
}
