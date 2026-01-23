/**
 * useLiveObservation.js - "Watch Me Work" Mode
 * 
 * Provides "Live & Interactive" feeling by auto-observing the user's work.
 * - Listens to Tldraw store changes (strokes, deletions).
 * - Debounces activity (waits for a pause in thinking).
 * - Auto-triggers a scan to the AI context.
 */
import { useEffect, useRef, useCallback } from 'react';
import { captureWhiteboard } from '../utils/WhiteboardCapture';

// Config
const DEBOUNCE_MS = 3500; // Wait 3.5s after last stroke before scanning
const COOLDOWN_MS = 15000; // Don't auto-scan more than once every 15s

export function useLiveObservation(editor, isEnabled) {
    const timeoutRef = useRef(null);
    const lastScanTime = useRef(0);
    const isObserving = useRef(false);

    const triggerObservation = useCallback(async () => {
        if (!isEnabled || !editor) return;

        // COOLDOWN CHECK
        const now = Date.now();
        if (now - lastScanTime.current < COOLDOWN_MS) {
            console.log('[LiveObserver] Cooldown active, skipping scan.');
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
                        isAuto: true 
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

    useEffect(() => {
        if (!editor || !isEnabled) return;

        // Listen to all changes in the store
        const unsubscribe = editor.store.listen((entry) => {
            // Only care about drawing changes (shapes)
            // entry.changes.added / updated / removed
            const hasShapeChanges = Object.keys(entry.changes.added).some(k => k.startsWith('shape:')) ||
                                    Object.keys(entry.changes.updated).some(k => k.startsWith('shape:')) ||
                                    Object.keys(entry.changes.removed).some(k => k.startsWith('shape:'));

            if (hasShapeChanges) {
                // Reset timer on every stroke
                if (timeoutRef.current) clearTimeout(timeoutRef.current);
                
                // Set new timer
                timeoutRef.current = setTimeout(triggerObservation, DEBOUNCE_MS);
            }
        });

        return () => {
             unsubscribe();
             if (timeoutRef.current) clearTimeout(timeoutRef.current);
        };
    }, [editor, isEnabled, triggerObservation]);
}
