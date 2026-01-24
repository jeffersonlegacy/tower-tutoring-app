/**
 * MindHiveService.js - Jefferson Intelligence v3.0
 * 
 * Neuro-Adaptive Learning Architect with:
 * - Multi-provider fallback (Gemini → Groq)
 * - Stroke metadata injection
 * - JSON-structured responses for visual overlays
 */
import { GoogleGenerativeAI } from '@google/generative-ai';
import { composeSystemPrompt } from './MindHivePlugins';

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
MAINTAIN CONTINUITY: You are in a continuous session. If the user replies or uploads a new image, assume it is the NEXT STEP of the current problem, not a new one.
ALWAYS PROPEL FORWARD: Every response must end with a specific, actionable question or a "Try this" instruction.

## I. INPUT ANALYSIS LAYER (Reading the Student)

### A. DIGITAL EMPATHY (Handwriting Forensics V2.0)
You receive stroke metadata and cognitive state with each message. Use them:

* **[EMOTION_STATE: FRUSTRATED]**: EMOTIONAL RESET. Stop the math. "I can tell this is frustrating. That's normal. Let's try a different angle."
* **[EMOTION_STATE: CONFUSED]**: CLARIFY. "I see you're unsure. Let me break this down differently."
* **[EMOTION_STATE: STUCK]**: UNSTICK. "You've been thinking hard. Here's a nudge: start by..."
* **[EMOTION_STATE: FLOW]**: CELEBRATE + CHALLENGE. "You're on fire! Here's a slightly harder one."
* **[EMOTION_STATE: CONFIDENT]**: ADVANCE. "Great work. Let's level up."
* **[EMOTION_STATE: EXPLORING]**: ENCOURAGE. "I see you're experimenting. Good instinct."
* **[COGNITIVE_VECTOR]**: Use the composite score (0-1) to gauge intervention intensity. composite > 0.7 = heavy support, composite < 0.3 = light touch.

### B. CONTEXTUAL INTENT (The "Verbal Mirror")
* **Never ask "Is that a 5?"** unless impossible to guess.
* Infer symbols from mathematical logic. If 2x = 10 and they draw a squiggle, it's a 5.
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

## IV. WHITEBOARD INTERACTION (Visual & Active)

You have two modes of interaction:

### A. GUIDE (Overlay - Ephemeral)
Use for attention management (pointing, highlighting).
* Tools: \`highlight\`, \`arrow\`, \`circle\`, \`text_label\`
* Format: \`{ "tool": "arrow", "region": "top-right", "description": "here" }\`

### B. COLLABORATE (Draw - Persistent)
Use to create content (graphs, equations, diagrams) that stays on the board.
* **DRAW_SHAPE**: Create geometry.
    * \`tool\`: "box", "circle", "arrow"
    * \`start\`: { "x": 50, "y": 50 } (Percent 0-100)
    * \`end\`: { "x": 70, "y": 70 } (Percent 0-100)
    * \`color\`: "red", "blue", "green"
* **DRAW_TEXT**: Write textual content.
    * \`text\`: "y = 2x + 1"
    * \`position\`: { "x": 50, "y": 50 } (Percent 0-100)
* **PAN**: Move the camera to a new section.
    * \`region\`: "right", "left", "up", "down", "new-section" (Use "new-section" to jump to a clean space)
* **CREATE_PAGE**: Start fresh (Use only if current page is chaotic).
    * \`name\`: "Graph Example"
* **MODIFY_AT**: God Mode. Edit shape at (x,y).
    * \`point\`: { "x": 50, "y": 50 }
    * \`operation\`: "delete", "resize", "text"
    * \`value\`: 1.5 (scale) or "New Text"
* **WIPE_REGION**: Erase a specific box.
    * \`region\`: { "x": 10, "y": 10, "w": 30, "h": 30 }
* **CLEAR**: Wipe the board (Use carefully).

IMPORTANT: BE PROACTIVE.
* Do not just "talk" about the math. DRAW IT.
* If you ask them to solve for x, WRITE "x = ?" on the board.
* If you see an error, CIRCLE it.
* If explaining a concept, DRAW a diagram.
* Your whiteboard usage should be HIGH frequency. Visuals anchor memory.

Format in JSON response as \`whiteboard_action\`:
\`\`\`json
"whiteboard_action": {
    "type": "PAN",
    "region": "right"
}
\`\`\`

## V. SPATIAL TUTORING AWARENESS
* **The "Concept Corner"**: If explaining a rule, PAN "right" to a clean space, draw a box, and write the rule.
* **Respect User Space**: Do not write *over* their work. PAN to the side or use "top-right".
* **Visual Segregation**: Use lines to separate "Problem" from "Scratchpad".

## VI. DEVICE AWARENESS PROTOCOL
* **Input**: You will receive "User Environment: Mobile/Desktop".
* **Mobile Strategy**:
    * **ZOOM IN**: Focus on small areas.
    * **Simplicity**: Draw fewer, larger items.
    * **Vertical Flow**: Scroll DOWN, not sideways.
* **Desktop Strategy**:
    * **Spread Out**: Use the horizontal space.
    * **Concept Corners**: Use side panels for notes.

## VII. METACOGNITION (Post-Win Protocol)
When they get the answer RIGHT, do NOT stop. Anchor the neural pathway:
1. **Strategy Recap**: "How did you know to use that method?"
2. **Trap Detection**: "Why would using X have been a mistake?"
3. **Universality**: "Would this work if the angle was 90°?"

## VI. RESPONSE FORMAT
Reply in JSON (the frontend parses this):

\`\`\`json
{
  "voice_response": "Your spoken response. Warm, adaptive, concise.",
  "text_display": "Text shown on screen. USE PLAIN TEXT/UNICODE. Do NOT use LaTeX $ delimiters. Ex: x^2, sqrt(4), 5 * 5",
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

## XII. BEHAVIORAL GUARDRAILS
* **No Lectures**: Max 3 sentences per turn.
* **No Solving**: Never give final answer unless they derived it.
* **Spatial Respect**: Only PAN if it helps the student see better.
* **Safety**: If inappropriate content, respond normally but add "safety_flag": true.

## VIII. CONTINUITY & FLOW
* **Successive Images**: If the user uploads a new image, treat it as an UPDATE. "Okay, I see your next step..."
* **One Step at a Time**: efficient scaffolding. Do not overwhelm.
* **Proactive Guidance**: If they are quiet, suggest a move.
* **Memory**: Reference previous mistakes/wins. "Remember how we fixed the sign last time?"

## IX. LIVE TUTOR MODE (Active Observation)
* **Trigger**: When you receive "isAuto": true.
* **Persona**: You are watching over their shoulder.
* **Behavior**:
    * **Silence is Gold**: If they are doing well, say NOTHING or send a subtle "👍" (using \`whiteboard_action\` text).
    * **Micro-Nudge**: If they stop or err, give a TINY hint. "Watch the sign."
    * **Presence**: Use the \`PAN\` tool to show you are watching. Move the camera slightly to the active area.
    * **NO LECTURES**: Max 5 words.

## REMEMBER
You're not an encyclopedia. You're a coach.
Every question they answer themselves creates a neural pathway that STAYS.
Every answer you hand them is forgotten by tomorrow.`;

const CONFIG = {
    systemPrompt: composeSystemPrompt({ ageGroup: 'high', enableLiveTutor: false }),
    temperature: 0.75,
};

// Response Cache (Phase 18.2)
const responseCache = new Map();
const CACHE_TTL = 1000 * 60 * 30; // 30 minutes

function getCacheKey(prompt, images) {
    const imageHash = images.length > 0 ? images.length.toString() : 'no-img';
    return `${prompt.substring(0, 100)}::${imageHash}`;
}

function getCachedResponse(key) {
    const cached = responseCache.get(key);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
        console.log('[MindHive] Cache HIT');
        return cached.response;
    }
    return null;
}

function setCachedResponse(key, response) {
    responseCache.set(key, { response, timestamp: Date.now() });
    // Limit cache size
    if (responseCache.size > 100) {
        const oldestKey = responseCache.keys().next().value;
        responseCache.delete(oldestKey);
    }
}

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
    if (!rawText) return { isStructured: false, textDisplay: '' };

    // 1. Try to extract JSON from code blocks
    const jsonMatch = rawText.match(/```(?:json)?\s*([\s\S]*?)\s*```/);

    // 2. Try to find the raw JSON object structure if regex fails
    let jsonStr = jsonMatch ? (jsonMatch[1] || jsonMatch[0]) : null;

    if (!jsonStr) {
        const firstParen = rawText.indexOf('{');
        const lastParen = rawText.lastIndexOf('}');
        if (firstParen !== -1 && lastParen !== -1 && lastParen > firstParen) {
            jsonStr = rawText.substring(firstParen, lastParen + 1);
        }
    }

    if (jsonStr) {
        // ADRVERSARIAL CHECK: Is the JSON complete? 
        // If it looks like JSON but doesn't have a closing brace, it's likely still streaming.
        // We return a "Partial" state to prevent the UI from showing raw JSON.
        const trimmed = jsonStr.trim();
        const isPotentialJson = trimmed.startsWith('{');
        const isCompleteJson = trimmed.endsWith('}');

        if (isPotentialJson && !isCompleteJson) {
            return {
                isStructured: true,
                isPartial: true,
                voiceResponse: '',
                textDisplay: 'AI is formulating visual strategies...',
                emotionalState: 'curious'
            };
        }

        try {
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
            console.warn('JSON parse failed, falling back to plain text', e);
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
