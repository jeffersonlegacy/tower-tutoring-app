/**
 * MindHiveService.js - Jefferson Intelligence v3.0
 * 
 * Neuro-Adaptive Learning Architect with:
 * - Multi-provider fallback (Gemini → Groq)
 * - Stroke metadata injection
 * - JSON-structured responses for visual overlays
 */
import { GoogleGenerativeAI } from '@google/generative-ai';

// Gemini models (primary - best for vision)
const GEMINI_MODELS = [
    'gemini-2.0-flash-exp',
    'gemini-1.5-flash',
    'gemini-1.5-flash-8b',
];

// Groq models (fallback - extremely fast)
const GROQ_MODELS = [
    'llama-3.3-70b-versatile',
    'llama-3.1-8b-instant',
    'mixtral-8x7b-32768',
];

const SYSTEM_PROMPT = `# JEFFERSON INTELLIGENCE v3.0 (Neuro-Adaptive Architect)

## IDENTITY & PRIME DIRECTIVE
You are **Jefferson Intelligence**, a Neuro-Adaptive Learning Architect. You analyze the **cognitive state** of each student to optimize their learning velocity.
Your Goal: Build a mind that can solve ANY problem, not just the one currently on the board.

## I. INPUT ANALYSIS LAYER (Reading the Student)

### A. DIGITAL EMPATHY (Handwriting Forensics)
You receive stroke metadata with each message. Use it:

* **input_method = "mouse"**: FORGIVE MESSINESS. Interpret jerky lines as hardware constraints, not confusion. Say: "That mouse drawing is tricky, but I see what you mean..."
* **stroke_velocity = "erratic"**: DETECT FRUSTRATION. Stop the math. Address the emotion: "I see those quick, heavy strokes. Let's slow down."
* **stroke_velocity = "hesitant"**: ENCOURAGE EXPLORATION: "Take your time. You're thinking carefully."
* **eraser_usage = "high"**: PRAISE SELF-CORRECTION: "I saw you erase that. Good catch — you noticed something was off."
* **avg_pause_duration > 10s**: HIGH COGNITIVE LOAD. Simplify immediately.
* **frustration_detected = true**: EMOTIONAL RESET. "I can tell this is frustrating. That's normal. Let's try a different angle."

### B. CONTEXTUAL INTENT (The "Verbal Mirror")
* **Never ask "Is that a 5?"** unless impossible to guess.
* Infer symbols from mathematical logic. If $2x = 10$ and they draw a squiggle, it's a 5.
* State your assumption: "I see you wrote **2x = 5**. Let's solve..."

## II. THE SCAFFOLDING ENGINE (Adaptive Modes)

### MODE A: THE GUIDE (Standard)
*Trigger:* Minor slip or asks for next steps.
*Action:* Micro-Hint. "Look at the denominator in the second fraction."

### MODE B: THE GUARDRAIL (Anti-Frustration)
*Trigger:* Same step failed 2x OR pause > 15s OR frustration_detected.
*Action:* Reduce cognitive load. Binary choice: "Does the graph go UP or DOWN from here?"

### MODE C: THE MODEL (Stuck Loop)
*Trigger:* Failed 3x or asks for the answer.
*Action:* Worked example. "Watch me solve a similar one." (Generate parallel example, NOT the original).

## III. AGE-ADAPTIVE COMMUNICATION

### ELEMENTARY (K-5)
* Stories: "Imagine you have 12 cookies..."
* Tactile: "Draw circles for each one"
* Celebrate: "YES! 🎉 You cracked it!"
* MAX 2 sentences

### MIDDLE SCHOOL (6-8)
* Connect to games, sports
* Give choices: "Equation or graph first?"
* Challenge: "Why does this pattern work?"

### HIGH SCHOOL (9-12)
* Explain the WHY
* Real applications: physics, coding, finance
* Peer treatment: "Here's how I think about this..."

### COLLEGE+
* Technical vocabulary
* Edge cases and exceptions
* Multiple solution paths

## IV. WHITEBOARD INTERACTION

When you see their whiteboard:
1. **DESCRIBE** what you observe: "I see you drew a parabola opening upward..."
2. **HIGHLIGHT** the focus area (provide coordinates)
3. **GUIDE** with ONE clear instruction

You can request these whiteboard actions:
* **highlight**: Glow around a region
* **arrow**: Point to specific element
* **circle**: Emphasize a symbol
* **text_label**: Add a label

## V. METACOGNITION (Post-Win Protocol)
When they get the answer RIGHT, do NOT stop. Anchor the neural pathway:
1. **Strategy Recap**: "How did you know to use that method?"
2. **Trap Detection**: "Why would using X have been a mistake?"
3. **Universality**: "Would this work if the angle was 90°?"

## VI. RESPONSE FORMAT
Reply in JSON (the frontend parses this):

\`\`\`json
{
  "voice_response": "Your spoken response. Warm, adaptive, concise.",
  "text_display": "Text shown on screen. Can include LaTeX: $x^2$",
  "whiteboard_action": {
    "tool": "highlight",
    "region": "top-right",
    "description": "the exponent"
  },
  "emotional_state": "curious",
  "cognitive_load": "medium",
  "next_step": "Check the sign on the second term"
}
\`\`\`

If you cannot determine coordinates, use descriptive regions: "top-left", "center", "bottom-right", etc.

## VII. BEHAVIORAL GUARDRAILS
* **No Lectures**: Max 3 sentences per turn
* **No Solving**: Never give final answer unless they derived it
* **No "Is that a 5?"**: Infer from context
* **Safety**: If inappropriate content, respond normally but add "safety_flag": true

## REMEMBER
You're not an encyclopedia. You're a coach.
Every question they answer themselves creates a neural pathway that STAYS.
Every answer you hand them is forgotten by tomorrow.`;

const CONFIG = {
    systemPrompt: SYSTEM_PROMPT,
    temperature: 0.75,
};

class MindHiveService {
    constructor() {
        this.geminiKey = import.meta.env.VITE_GEMINI_API_KEY;
        this.genAI = this.geminiKey ? new GoogleGenerativeAI(this.geminiKey) : null;
        this.groqKey = import.meta.env.VITE_GROQ_API_KEY;
        this.groqEndpoint = 'https://api.groq.com/openai/v1/chat/completions';
    }

    /**
     * Stream response with multi-provider fallback
     * Injects stroke metadata into context
     */
    async streamResponse(prompt, history = [], onChunk, onModelChange, images = [], strokeContext = '') {
        console.log('🐝 Activating Mind Hive v3.0...');

        // Inject stroke context into prompt
        const enrichedPrompt = strokeContext
            ? `${strokeContext}\n\nUser Message: ${prompt}`
            : prompt;

        const errors = [];

        // TIER 1: Try Gemini (best for vision/images)
        if (this.genAI) {
            for (const modelName of GEMINI_MODELS) {
                try {
                    console.log(`🔄 [Gemini] Attempting: ${modelName}`);
                    await this.streamGemini(modelName, enrichedPrompt, history, onChunk, onModelChange, images);
                    console.log(`✅ [Gemini] Success: ${modelName}`);
                    return;
                } catch (error) {
                    console.warn(`⚠️ [Gemini] ${modelName} failed: ${error.message}`);
                    errors.push(`Gemini/${modelName}: ${error.message}`);
                }
            }
        }

        // TIER 2: Try Groq (extremely fast, text-only)
        if (this.groqKey) {
            for (const modelName of GROQ_MODELS) {
                try {
                    console.log(`🔄 [Groq] Attempting: ${modelName}`);
                    await this.streamGroq(modelName, enrichedPrompt, history, onChunk, onModelChange);
                    console.log(`✅ [Groq] Success: ${modelName}`);
                    return;
                } catch (error) {
                    console.warn(`⚠️ [Groq] ${modelName} failed: ${error.message}`);
                    errors.push(`Groq/${modelName}: ${error.message}`);
                }
            }
        }

        console.error('🚨 Hive Collapse - All providers failed:', errors);
        throw new Error('All AI providers are currently unavailable. Please try again.');
    }

    async streamGemini(modelName, prompt, history, onChunk, onModelChange, images = []) {
        const model = this.genAI.getGenerativeModel({
            model: modelName,
            systemInstruction: CONFIG.systemPrompt,
            generationConfig: { temperature: CONFIG.temperature }
        });

        if (onModelChange) {
            onModelChange(modelName.toUpperCase().replace(/-/g, ' '));
        }

        let chatHistory = history.slice(0, -1).map(msg => ({
            role: msg.role === 'model' ? 'model' : 'user',
            parts: [{ text: msg.text }]
        }));
        while (chatHistory.length > 0 && chatHistory[0].role === 'model') {
            chatHistory.shift();
        }

        let parts = [{ text: prompt }];
        if (images && images.length > 0) {
            for (const imgUrl of images) {
                try {
                    const response = await fetch(imgUrl);
                    const blob = await response.blob();
                    const base64 = await this.blobToBase64(blob);
                    parts.push({
                        inlineData: {
                            mimeType: blob.type || 'image/png',
                            data: base64.split(',')[1]
                        }
                    });
                } catch (e) {
                    console.warn('Image processing failed:', e);
                }
            }
        }

        const chat = model.startChat({ history: chatHistory });
        const result = await chat.sendMessageStream(parts);

        let hasContent = false;
        for await (const chunk of result.stream) {
            const text = chunk.text();
            if (text) {
                hasContent = true;
                onChunk(text);
            }
        }

        if (!hasContent) throw new Error('Empty response');
    }

    async streamGroq(modelName, prompt, history, onChunk, onModelChange) {
        if (onModelChange) {
            onModelChange(`GROQ ${modelName.split('-')[0].toUpperCase()}`);
        }

        const messages = [{ role: 'system', content: CONFIG.systemPrompt }];

        let historyStarted = false;
        for (const msg of history.slice(0, -1)) {
            const role = msg.role === 'model' ? 'assistant' : 'user';
            if (!historyStarted && role === 'assistant') continue;
            historyStarted = true;
            messages.push({ role, content: msg.text });
        }
        messages.push({ role: 'user', content: prompt });

        const response = await fetch(this.groqEndpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.groqKey}`
            },
            body: JSON.stringify({
                model: modelName,
                messages,
                temperature: CONFIG.temperature,
                stream: true
            })
        });

        if (!response.ok) {
            const error = await response.text();
            throw new Error(`HTTP ${response.status}: ${error}`);
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let hasContent = false;

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const chunk = decoder.decode(value, { stream: true });
            for (const line of chunk.split('\n')) {
                const trimmed = line.trim();
                if (!trimmed || trimmed === 'data: [DONE]') continue;
                if (trimmed.startsWith('data: ')) {
                    try {
                        const json = JSON.parse(trimmed.slice(6));
                        const content = json.choices?.[0]?.delta?.content;
                        if (content) {
                            hasContent = true;
                            onChunk(content);
                        }
                    } catch { /* ignore */ }
                }
            }
        }

        if (!hasContent) throw new Error('Empty response');
    }

    blobToBase64(blob) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result);
            reader.onerror = reject;
            reader.readAsDataURL(blob);
        });
    }
}

export const mindHive = new MindHiveService();

/**
 * Parse AI response - handles both JSON and plain text
 */
export function parseAIResponse(rawText) {
    // Try to extract JSON from response
    const jsonMatch = rawText.match(/```json\s*([\s\S]*?)\s*```/) ||
        rawText.match(/\{[\s\S]*"voice_response"[\s\S]*\}/);

    if (jsonMatch) {
        try {
            const jsonStr = jsonMatch[1] || jsonMatch[0];
            const parsed = JSON.parse(jsonStr);
            return {
                isStructured: true,
                voiceResponse: parsed.voice_response || parsed.text_display || rawText,
                textDisplay: parsed.text_display || parsed.voice_response || rawText,
                whiteboardAction: parsed.whiteboard_action || null,
                emotionalState: parsed.emotional_state || 'neutral',
                cognitiveLoad: parsed.cognitive_load || 'medium',
                nextStep: parsed.next_step || null,
                safetyFlag: parsed.safety_flag || false,
            };
        } catch (e) {
            console.warn('JSON parse failed, using plain text');
        }
    }

    // Fallback to plain text
    return {
        isStructured: false,
        voiceResponse: rawText,
        textDisplay: rawText,
        whiteboardAction: null,
        emotionalState: 'neutral',
        cognitiveLoad: 'medium',
        nextStep: null,
        safetyFlag: false,
    };
}
