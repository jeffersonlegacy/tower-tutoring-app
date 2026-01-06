/**
 * StrokeAnalytics.js - Capture stroke metadata for AI context injection
 * 
 * Analyzes user's drawing behavior to detect:
 * - Input method (mouse vs touch vs stylus)
 * - Stroke velocity (smooth, hesitant, erratic)
 * - Cognitive load (pause durations)
 * - Self-correction (eraser usage)
 * - Frustration signals
 */

class StrokeAnalytics {
    constructor() {
        this.strokes = [];          // Array of stroke data
        this.currentStroke = null;  // Current stroke being drawn
        this.eraserCount = 0;       // Number of eraser uses
        this.lastStrokeEnd = null;  // Timestamp of last stroke end
        this.pauses = [];           // Pause durations between strokes
        this.sessionStart = Date.now();
        this.inputMethod = 'unknown';

        // Attach listeners
        this.attachListeners();
    }

    attachListeners() {
        // Detect input method from pointer events
        document.addEventListener('pointerdown', (e) => {
            this.detectInputMethod(e);
            this.startStroke(e);
        }, { passive: true });

        document.addEventListener('pointermove', (e) => {
            if (this.currentStroke) {
                this.addPoint(e);
            }
        }, { passive: true });

        document.addEventListener('pointerup', () => {
            this.endStroke();
        }, { passive: true });

        // Detect eraser usage (tldraw specific)
        document.addEventListener('keydown', (e) => {
            if (e.key === 'e' || e.key === 'E') {
                this.eraserCount++;
            }
        });
    }

    detectInputMethod(e) {
        if (e.pointerType === 'pen') {
            this.inputMethod = 'stylus';
        } else if (e.pointerType === 'touch') {
            this.inputMethod = 'touch';
        } else if (e.pointerType === 'mouse') {
            this.inputMethod = 'mouse';
        }
    }

    startStroke(e) {
        // Record pause since last stroke
        if (this.lastStrokeEnd) {
            const pauseDuration = (Date.now() - this.lastStrokeEnd) / 1000;
            if (pauseDuration > 0.5 && pauseDuration < 120) { // Between 0.5s and 2min
                this.pauses.push(pauseDuration);
            }
        }

        this.currentStroke = {
            startTime: Date.now(),
            points: [],
            velocities: [],
            pressures: [],
        };

        this.addPoint(e);
    }

    addPoint(e) {
        if (!this.currentStroke) return;

        const point = {
            x: e.clientX,
            y: e.clientY,
            time: Date.now(),
            pressure: e.pressure || 0.5,
        };

        const points = this.currentStroke.points;
        if (points.length > 0) {
            const lastPoint = points[points.length - 1];
            const dx = point.x - lastPoint.x;
            const dy = point.y - lastPoint.y;
            const dt = (point.time - lastPoint.time) / 1000; // seconds
            const distance = Math.sqrt(dx * dx + dy * dy);
            const velocity = dt > 0 ? distance / dt : 0; // pixels per second
            this.currentStroke.velocities.push(velocity);
        }

        this.currentStroke.pressures.push(point.pressure);
        this.currentStroke.points.push(point);
    }

    endStroke() {
        if (!this.currentStroke) return;

        this.currentStroke.endTime = Date.now();
        this.currentStroke.duration = (this.currentStroke.endTime - this.currentStroke.startTime) / 1000;

        if (this.currentStroke.points.length > 2) {
            this.strokes.push(this.currentStroke);
        }

        this.lastStrokeEnd = Date.now();
        this.currentStroke = null;
    }

    /**
     * Analyze stroke velocity pattern
     */
    getVelocityPattern() {
        if (this.strokes.length === 0) return 'none';

        const allVelocities = this.strokes.flatMap(s => s.velocities);
        if (allVelocities.length === 0) return 'none';

        const avgVelocity = allVelocities.reduce((a, b) => a + b, 0) / allVelocities.length;
        const variance = allVelocities.reduce((sum, v) => sum + Math.pow(v - avgVelocity, 2), 0) / allVelocities.length;
        const stdDev = Math.sqrt(variance);
        const coefficientOfVariation = avgVelocity > 0 ? stdDev / avgVelocity : 0;

        // High variation = erratic, Low variation = smooth
        if (coefficientOfVariation > 1.0) return 'erratic';
        if (avgVelocity < 100) return 'hesitant';
        if (coefficientOfVariation < 0.5) return 'smooth';
        return 'moderate';
    }

    /**
     * Calculate average pause duration (cognitive load indicator)
     */
    getAvgPauseDuration() {
        if (this.pauses.length === 0) return 0;
        return (this.pauses.reduce((a, b) => a + b, 0) / this.pauses.length).toFixed(1);
    }

    /**
     * Determine eraser usage level
     */
    getEraserUsage() {
        if (this.eraserCount === 0) return 'none';
        if (this.eraserCount <= 2) return 'low';
        if (this.eraserCount <= 5) return 'moderate';
        return 'high';
    }

    /**
     * Detect frustration signals
     */
    detectFrustration() {
        const velocity = this.getVelocityPattern();
        const eraserUsage = this.getEraserUsage();

        // High eraser + erratic = frustrated
        if (velocity === 'erratic' && eraserUsage === 'high') return true;

        // Quick repeated strokes
        const recentPauses = this.pauses.slice(-5);
        if (recentPauses.length >= 3) {
            const avgRecent = recentPauses.reduce((a, b) => a + b, 0) / recentPauses.length;
            if (avgRecent < 1.0) return true; // Very rapid strokes
        }

        return false;
    }

    /**
     * Get time spent on screen
     */
    getTimeOnScreen() {
        return Math.floor((Date.now() - this.sessionStart) / 1000);
    }

    /**
     * Generate metadata JSON for AI context injection
     */
    getMetadata() {
        return {
            input_method: this.inputMethod,
            stroke_velocity: this.getVelocityPattern(),
            avg_pause_duration: `${this.getAvgPauseDuration()}s`,
            eraser_usage: this.getEraserUsage(),
            frustration_detected: this.detectFrustration(),
            time_on_screen: `${this.getTimeOnScreen()}s`,
            total_strokes: this.strokes.length,
        };
    }

    /**
     * Get formatted string for system prompt injection
     */
    getContextString() {
        const meta = this.getMetadata();
        return `[SYSTEM_DATA: Input=${meta.input_method}, Velocity=${meta.stroke_velocity}, Pauses=${meta.avg_pause_duration}, Erasures=${meta.eraser_usage}, TimeOnScreen=${meta.time_on_screen}, Frustrated=${meta.frustration_detected}]`;
    }

    /**
     * Reset analytics for new problem
     */
    reset() {
        this.strokes = [];
        this.eraserCount = 0;
        this.pauses = [];
        this.sessionStart = Date.now();
        this.lastStrokeEnd = null;
    }
}

// Singleton instance
export const strokeAnalytics = new StrokeAnalytics();
