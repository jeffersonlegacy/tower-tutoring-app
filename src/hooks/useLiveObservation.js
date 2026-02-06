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

// Config (V2.1: More responsive timing)
const BASE_DEBOUNCE_MS = 2500;
const MIN_DEBOUNCE_MS = 1500;
const MAX_DEBOUNCE_MS = 4000;
const BASE_COOLDOWN_MS = 8000; // Reduced from 15s for better responsiveness

export function useLiveObservation(editor, isEnabled) {
    const timeoutRef = useRef(null);
    const lastScanTime = useRef(0);
    const isObserving = useRef(false);
    const strokeCount = useRef(0); // Track strokes since last scan

    const triggerObservation = useCallback(async () => {
        if (!isEnabled || !editor) return;

        // COOLDOWN CHECK (but allow override if many strokes)
        const now = Date.now();
        const timeSinceLast = now - lastScanTime.current;
        const forceOverride = strokeCount.current > 10; // Force if lots of activity
        
        if (timeSinceLast < BASE_COOLDOWN_MS && !forceOverride) {
            console.log('[LiveObserver] Cooldown active, skipping scan.');
            return;
        }
        
        // V2.1: Smart Silence - Only skip if VERY confident flow
        const emotion = strokeAnalytics.getEmotionSpectrum?.() || { primary: 'neutral', confidence: 0 };
        if (emotion.primary === 'flow' && emotion.confidence > 85 && !forceOverride) {
            console.log('[LiveObserver] Student in deep FLOW, staying silent.');
            return;
        }

        console.log('[LiveObserver] 👀 Auto-observing user work...');
        isObserving.current = true;
        strokeCount.current = 0; // Reset stroke counter

        try {
            // Capture with timeout fallback
            const imageData = await Promise.race([
                captureWhiteboard(),
                new Promise((_, reject) => setTimeout(() => reject(new Error('Capture timeout')), 3000))
            ]);
            
            if (imageData) {
                // Dispatch special "auto-observation" event
                window.dispatchEvent(new CustomEvent('ai-vision-upload', { 
                    detail: { 
                        image: imageData, 
                        isAuto: true,
                        emotionState: emotion.primary,
                        emotionConfidence: emotion.confidence,
                        prompt: "The student is working on the whiteboard. Observe what they've drawn and provide helpful, encouraging feedback. If you see a math problem, help guide them toward the solution."
                    } 
                }));
                lastScanTime.current = Date.now();
                console.log('[LiveObserver] ✅ Auto-scan sent to AI');
            } else {
                console.warn('[LiveObserver] Capture returned empty');
            }
        } catch (err) {
            console.warn('[LiveObserver] Observation failed:', err.message);
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
                // Track strokes for activity-based override
                strokeCount.current++;
                
                // Reset existing timers
                if (timeoutRef.current) clearInterval(timeoutRef.current);
                
                // V2.0: Use adaptive debounce
                const debounceMs = getAdaptiveDebounce();
                const startTime = Date.now();
                const endTime = startTime + debounceMs;
                
                // Dispatch START event
                window.dispatchEvent(new CustomEvent('live-tutor-timer-start', {
                    detail: { durationMs: debounceMs }
                }));

                // Start TICK interval
                let lastSeconds = Math.ceil(debounceMs / 1000);
                
                timeoutRef.current = setInterval(() => {
                    const remaining = Math.ceil((endTime - Date.now()) / 1000);
                    
                    if (remaining <= 0) {
                        clearInterval(timeoutRef.current);
                        triggerObservation();
                        // Dispatch END event
                        window.dispatchEvent(new CustomEvent('live-tutor-timer-end'));
                    } else if (remaining !== lastSeconds) {
                        // Optimization: Only dispatch if integer second changed
                        lastSeconds = remaining;
                        window.dispatchEvent(new CustomEvent('live-tutor-timer-tick', {
                            detail: { seconds: remaining }
                        }));
                    }
                }, 100); // Check frequently for smooth updates/cancellation
            }
        });

        return () => {
             unsubscribe();
             if (timeoutRef.current) clearTimeout(timeoutRef.current);
        };
    }, [editor, isEnabled, triggerObservation, getAdaptiveDebounce]);
}
