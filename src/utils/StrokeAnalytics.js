/**
 * StrokeAnalytics.js - V2.0 Neuro-Behavioral Analysis Engine
 * 
 * Analyzes user's drawing behavior to detect:
 * - Input method (mouse vs touch vs stylus)
 * - Stroke velocity (smooth, hesitant, erratic)
 * - Cognitive load (pause durations)
 * - Self-correction (eraser usage)
 * - Frustration signals
 * - Spatial density (crowding behavior)
 * 
 * V2.0 Enhancements:
 * - Multi-signal fusion → Cognitive State Vector
 * - Expanded emotion spectrum (frustrated/confused/stuck/flow/confident)
 * - Per-session adaptive baselines
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
        
        // V2.0: Adaptive baselines (tracks session averages)
        this.baseline = {
            avgVelocity: null,
            avgPause: null,
            strokeCount: 0
        };
        
        // V2.0: Spatial density tracking
        this.recentPositions = [];

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
     * Detect frustration signals (legacy - kept for compatibility)
     */
    detectFrustration() {
        return this.getEmotionSpectrum().primary === 'frustrated';
    }

    /**
     * V2.0: Multi-Signal Cognitive State Vector
     * Combines velocity, pauses, erasures, and spatial density into a normalized vector.
     */
    getCognitiveStateVector() {
        const velocityPattern = this.getVelocityPattern();
        const avgPause = parseFloat(this.getAvgPauseDuration());
        const eraserUsage = this.getEraserUsage();
        const spatialDensity = this.getSpatialDensity();
        
        // Normalize to 0-1 scale
        const velocityScore = { erratic: 1.0, hesitant: 0.7, moderate: 0.4, smooth: 0.2, none: 0 }[velocityPattern] || 0.5;
        const pauseScore = Math.min(1, avgPause / 15); // 15s = max cognitive load
        const eraserScore = { high: 1.0, moderate: 0.6, low: 0.3, none: 0 }[eraserUsage] || 0;
        const densityScore = Math.min(1, spatialDensity / 10); // 10+ strokes in small area = crowded
        
        return {
            velocity: velocityScore,
            pause: pauseScore,
            eraser: eraserScore,
            density: densityScore,
            composite: (velocityScore * 0.3 + pauseScore * 0.3 + eraserScore * 0.25 + densityScore * 0.15)
        };
    }

    /**
     * V2.0: Spatial Density (crowding behavior)
     * Measures how concentrated recent strokes are in one area.
     */
    getSpatialDensity() {
        if (this.recentPositions.length < 3) return 0;
        
        const last10 = this.recentPositions.slice(-10);
        const avgX = last10.reduce((s, p) => s + p.x, 0) / last10.length;
        const avgY = last10.reduce((s, p) => s + p.y, 0) / last10.length;
        
        // Calculate average deviation from centroid
        const avgDeviation = last10.reduce((s, p) => {
            return s + Math.sqrt(Math.pow(p.x - avgX, 2) + Math.pow(p.y - avgY, 2));
        }, 0) / last10.length;
        
        // Low deviation = high density (crowded)
        return avgDeviation < 100 ? 10 : avgDeviation < 200 ? 5 : 2;
    }

    /**
     * V2.0: Expanded Emotion Spectrum
     * Returns primary emotion + confidence level.
     */
    getEmotionSpectrum() {
        const csv = this.getCognitiveStateVector();
        const timeOnScreen = this.getTimeOnScreen();
        
        // Decision logic based on composite score and individual signals
        let primary = 'neutral';
        let confidence = 0.5;
        
        // FRUSTRATED: High eraser + erratic velocity
        if (csv.eraser > 0.7 && csv.velocity > 0.8) {
            primary = 'frustrated';
            confidence = Math.min(1, (csv.eraser + csv.velocity) / 2);
        }
        // CONFUSED: High pauses + moderate erasures
        else if (csv.pause > 0.6 && csv.eraser > 0.3) {
            primary = 'confused';
            confidence = csv.pause;
        }
        // STUCK: Very high pauses, low activity
        else if (csv.pause > 0.8 && this.strokes.length < 5 && timeOnScreen > 60) {
            primary = 'stuck';
            confidence = 0.9;
        }
        // FLOW: Smooth velocity, low pauses, active
        else if (csv.velocity < 0.3 && csv.pause < 0.3 && this.strokes.length > 10) {
            primary = 'flow';
            confidence = 1 - csv.composite;
        }
        // CONFIDENT: Moderate speed, minimal corrections
        else if (csv.velocity < 0.5 && csv.eraser < 0.2 && this.strokes.length > 5) {
            primary = 'confident';
            confidence = 1 - csv.eraser;
        }
        // EXPLORING: High density (focused on one area)
        else if (csv.density > 0.7) {
            primary = 'exploring';
            confidence = csv.density;
        }
        
        return { primary, confidence: Math.round(confidence * 100) };
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
     * Get formatted string for system prompt injection (V2.0 Enhanced)
     */
    getContextString() {
        const meta = this.getMetadata();
        const emotion = this.getEmotionSpectrum();
        const csv = this.getCognitiveStateVector();
        
        return `[SYSTEM_DATA: Input=${meta.input_method}, Velocity=${meta.stroke_velocity}, Pauses=${meta.avg_pause_duration}, Erasures=${meta.eraser_usage}, TimeOnScreen=${meta.time_on_screen}]
[EMOTION_STATE: ${emotion.primary.toUpperCase()} (${emotion.confidence}% confidence)]
[COGNITIVE_VECTOR: velocity=${csv.velocity.toFixed(2)}, pause=${csv.pause.toFixed(2)}, eraser=${csv.eraser.toFixed(2)}, density=${csv.density.toFixed(2)}, composite=${csv.composite.toFixed(2)}]`;
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
        this.recentPositions = [];
        // Keep baseline for adaptive thresholds
    }
    
    /**
     * V2.0: Update adaptive baseline
     */
    updateBaseline() {
        if (this.strokes.length === 0) return;
        
        const allVelocities = this.strokes.flatMap(s => s.velocities);
        const avgVel = allVelocities.length > 0 
            ? allVelocities.reduce((a, b) => a + b, 0) / allVelocities.length 
            : 0;
        
        const avgPause = this.pauses.length > 0
            ? this.pauses.reduce((a, b) => a + b, 0) / this.pauses.length
            : 0;
        
        // Exponential moving average for smoother adaptation
        const alpha = 0.3;
        this.baseline.avgVelocity = this.baseline.avgVelocity === null 
            ? avgVel 
            : this.baseline.avgVelocity * (1 - alpha) + avgVel * alpha;
        this.baseline.avgPause = this.baseline.avgPause === null
            ? avgPause
            : this.baseline.avgPause * (1 - alpha) + avgPause * alpha;
        this.baseline.strokeCount += this.strokes.length;
    }
}

// Singleton instance
export const strokeAnalytics = new StrokeAnalytics();
