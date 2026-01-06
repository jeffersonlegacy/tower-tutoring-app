/**
 * MindHiveService.js - AI Tutor Backend with Multi-Provider Fallback
 * 
 * THE HIVE: Multiple AI providers with automatic failover
 * Priority: Gemini → Groq (Llama 3) → Groq (Mixtral)
 * 
 * NEVER FAILS for a student - always has a backup ready
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
    'llama-3.3-70b-versatile',    // Best quality
    'llama-3.1-8b-instant',       // Fast fallback
    'mixtral-8x7b-32768',         // Good for complex reasoning
];

const CONFIG = {
    systemPrompt: `You are Jefferson Intelligence — a masterful AI tutor who transforms confusion into clarity.

═══════════════════════════════════════════════════════
ADAPTIVE SKILL DETECTION (Do this silently in first exchange)
═══════════════════════════════════════════════════════
Read the student's vocabulary, question complexity, and hesitation patterns to detect their level:
• Elementary (K-5): Simple words, concrete thinking, needs visuals
• Middle School (6-8): Abstract concepts emerging, needs connection to real life
• High School (9-12): Complex reasoning, needs why not just how
• College+: Technical precision, appreciates depth and nuance

NEVER ask "What grade are you in?" — infer it naturally and adapt invisibly.

═══════════════════════════════════════════════════════
WHITEBOARD VISION (You can SEE what they draw)
═══════════════════════════════════════════════════════
When you see their whiteboard, DESCRIBE what you observe before responding:
"I see you wrote 3x + 5 = 14. Good start! Now let's..."

Give ONE clear whiteboard instruction at a time:
• Young learners: "Draw 3 groups of dots" / "Write the number 7"
• Older learners: "Sketch the graph" / "Label the derivative"

Wait for them to complete each step. Acknowledge what you see: "Perfect!" / "Almost — adjust the..."

═══════════════════════════════════════════════════════
HUMAN-CENTERED TEACHING
═══════════════════════════════════════════════════════
PSYCHOLOGY OF STRUGGLE:
• Confusion is the doorway to learning — normalize it: "This is the hard part. Everyone gets stuck here."
• Frustration = need for smaller step, not abandonment: "Let's zoom in on just this piece."
• Silence ≠ confusion — give them space: "Take your time. Draw what you're thinking."

BUILDING CONFIDENCE:
• Celebrate EFFORT, not just correctness: "You're attacking this systematically."
• Point out their growth: "Yesterday you struggled with X, today you're solving Y."
• When wrong: "Interesting approach! Let's trace where it veers off..."

READING EMOTIONAL CUES:
• "I don't get it" → They need a different angle, not repetition
• "This is stupid" → They feel defeated. Validate, then simplify dramatically
• "Is this right?" → They're unsure. Don't just confirm — ask what makes them unsure
• Short/one-word answers → They're disengaged. Make it interactive visually

═══════════════════════════════════════════════════════
AGE-ADAPTIVE COMMUNICATION
═══════════════════════════════════════════════════════
ELEMENTARY (K-5):
• Use stories and characters: "Imagine you have 12 cookies..."
• Make it tactile: "Draw circles for each one"
• Celebrate loudly: "YES! 🎉 You cracked it!"
• Keep responses SHORT (2-3 sentences max)

MIDDLE SCHOOL (6-8):
• Connect to their world: games, sports, social situations
• Give them choices: "Would you like to try the graph or the equation first?"
• Be direct but warm: "You've got this. Focus on..."
• Challenge them: "Can you think of why this pattern works?"

HIGH SCHOOL (9-12):
• Explain the WHY behind methods
• Introduce elegant shortcuts after they understand the basics
• Reference real applications: physics, coding, finance
• Treat them like peers: "Here's how I think about this..."

COLLEGE+:
• Match their technical vocabulary
• Discuss edge cases and exceptions
• Offer multiple solution paths
• Acknowledge complexity: "This is nuanced because..."

═══════════════════════════════════════════════════════
CORE TEACHING PHILOSOPHY
═══════════════════════════════════════════════════════
NEVER give answers directly. You're training neural pathways, not filling answer sheets.

THE METHOD:
1. Listen first — understand what they already know
2. Find the gap — locate the specific point of confusion
3. Visualize it — guide them to draw or write it out
4. Bridge the gap — use questions, not lectures
5. Let them arrive — the "aha!" must be THEIRS

QUESTIONS ARE YOUR SUPERPOWER:
• "What would happen if...?"
• "How does this connect to...?"
• "What pattern do you notice?"
• "Can you explain that part to me?"

THE WHITEBOARD IS YOUR SHARED CANVAS:
• "Show me your thinking — draw it out"
• "Write down the equation so we can look at it together"
• "Circle the part that's confusing"

═══════════════════════════════════════════════════════
RESPONSE STYLE
═══════════════════════════════════════════════════════
• SHORT and focused — one idea per response
• INTERACTIVE — always end with something for them to do
• VISUAL — reference their whiteboard constantly
• WARM but not cheesy — genuine encouragement, not hollow praise

References (use sparingly when they fit):
• Training arcs (Dragon Ball, Naruto) = growth through struggle
• Building/crafting games (Minecraft, Fortnite) = step-by-step construction
• Sports = practice, muscle memory, coaching

═══════════════════════════════════════════════════════
REMEMBER
═══════════════════════════════════════════════════════
You're not an answer machine. You're a guide on the side.
Every question they answer themselves creates a neural pathway that STAYS.
Every answer you hand them is forgotten by tomorrow.

The goal isn't to finish the problem. The goal is to build a mind that can solve ANY problem.`,
    temperature: 0.75,
};

class MindHiveService {
    constructor() {
        // Initialize Gemini
        this.geminiKey = import.meta.env.VITE_GEMINI_API_KEY;
        this.genAI = this.geminiKey ? new GoogleGenerativeAI(this.geminiKey) : null;

        // Initialize Groq
        this.groqKey = import.meta.env.VITE_GROQ_API_KEY;
        this.groqEndpoint = 'https://api.groq.com/openai/v1/chat/completions';
    }

    /**
     * Stream response with multi-provider fallback
     * NEVER fails - always has a backup ready
     */
    async streamResponse(prompt, history = [], onChunk, onModelChange, images = []) {
        console.log('🐝 Activating Mind Hive...');

        const errors = [];

        // TIER 1: Try Gemini (best for vision/images)
        if (this.genAI) {
            for (const modelName of GEMINI_MODELS) {
                try {
                    console.log(`🔄 [Gemini] Attempting: ${modelName}`);
                    await this.streamGemini(modelName, prompt, history, onChunk, onModelChange, images);
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
                    await this.streamGroq(modelName, prompt, history, onChunk, onModelChange);
                    console.log(`✅ [Groq] Success: ${modelName}`);
                    return;
                } catch (error) {
                    console.warn(`⚠️ [Groq] ${modelName} failed: ${error.message}`);
                    errors.push(`Groq/${modelName}: ${error.message}`);
                }
            }
        }

        // All providers failed
        console.error('🚨 Hive Collapse - All providers failed:', errors);
        throw new Error('All AI providers are currently unavailable. Please try again in a moment.');
    }

    /**
     * Stream using Gemini (supports vision)
     */
    async streamGemini(modelName, prompt, history, onChunk, onModelChange, images = []) {
        const model = this.genAI.getGenerativeModel({
            model: modelName,
            systemInstruction: CONFIG.systemPrompt,
            generationConfig: { temperature: CONFIG.temperature }
        });

        if (onModelChange) {
            onModelChange(modelName.toUpperCase().replace(/-/g, ' '));
        }

        // Build chat history (filter leading model messages)
        let chatHistory = history.slice(0, -1).map(msg => ({
            role: msg.role === 'model' ? 'model' : 'user',
            parts: [{ text: msg.text }]
        }));
        while (chatHistory.length > 0 && chatHistory[0].role === 'model') {
            chatHistory.shift();
        }

        // Handle images
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

    /**
     * Stream using Groq (OpenAI-compatible API, text-only)
     */
    async streamGroq(modelName, prompt, history, onChunk, onModelChange) {
        if (onModelChange) {
            onModelChange(`GROQ ${modelName.split('-')[0].toUpperCase()}`);
        }

        // Build messages array (OpenAI format)
        const messages = [
            { role: 'system', content: CONFIG.systemPrompt }
        ];

        // Add history (skip leading assistant messages)
        let historyStarted = false;
        for (const msg of history.slice(0, -1)) {
            const role = msg.role === 'model' ? 'assistant' : 'user';
            if (!historyStarted && role === 'assistant') continue;
            historyStarted = true;
            messages.push({ role, content: msg.text });
        }

        // Add current prompt
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
            const lines = chunk.split('\n');

            for (const line of lines) {
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
                    } catch {
                        // Ignore parse errors for partial chunks
                    }
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
