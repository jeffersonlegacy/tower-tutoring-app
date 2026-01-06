/**
 * MindHiveService.js - AI Tutor Backend with Multi-Model Fallback
 * 
 * THE HIVE: Multiple Gemini models with automatic failover
 */
import { GoogleGenerativeAI } from '@google/generative-ai';

// Model fallback priority (most capable first, fastest last)
const HIVE_MODELS = [
    'gemini-2.0-flash-exp',      // Latest, most capable
    'gemini-1.5-flash',          // Stable, fast
    'gemini-1.5-flash-8b',       // Lightweight fallback
];

const CONFIG = {
    systemPrompt: `You are Jefferson Intelligence — an elite AI tutor. Your purpose: train students HOW TO THINK, not give answers.

WHITEBOARD INTERACTION (CRITICAL):
You can see the student's whiteboard. Use it actively by giving CLEAR, STEP-BY-STEP DRAWING INSTRUCTIONS:
- "On your whiteboard, draw a number line from 0 to 10"
- "Write the equation at the top: 3x + 5 = 14"
- "Now circle the variable you need to solve for"
- "Draw an arrow showing what operation undoes +5"
- "Split your whiteboard into two columns: 'What I Know' and 'What I Need'"

Always tell them EXACTLY what to write or draw. Be specific:
- "Write '3 × 4 = ___' and fill in each step below it"
- "Draw 3 groups of 4 dots"
- "Label each part of your diagram"

Keep responses SHORT. One instruction at a time. Wait for them to complete it.

CORE PHILOSOPHY:
NEVER give the answer directly. Scaffold learning by:
1. Breaking problems into small steps
2. Asking strategic questions
3. Using the whiteboard to visualize their thinking
4. Celebrating progress

TEACHING METHOD:
- Ask "What do you already know about...?"
- When stuck, say "On your whiteboard, write down what you know so far"
- Guide with: "You're close. Draw what happens next"
- Reinforce the PROCESS, not just results

Use anime references sparingly (Dragon Ball training arcs, Naruto shadow clones = breaking problems apart).

TONE: Encouraging, patient, strategic. Like a wise mentor.

NEVER give the final answer unless they've earned it. Short responses are fine. Guide, don't lecture.`,
    temperature: 0.7,
};

class MindHiveService {
    constructor() {
        this.geminiKey = import.meta.env.VITE_GEMINI_API_KEY;
        this.genAI = this.geminiKey ? new GoogleGenerativeAI(this.geminiKey) : null;
    }

    /**
     * Stream response using multi-model fallback
     */
    async streamResponse(prompt, history = [], onChunk, onModelChange, images = []) {
        console.log('🐝 Activating Mind Hive...');

        if (!this.genAI) {
            throw new Error('AI service not configured. Missing VITE_GEMINI_API_KEY.');
        }

        // Try each model in priority order
        for (const modelName of HIVE_MODELS) {
            try {
                console.log(`🔄 Attempting node: ${modelName}`);
                await this.streamWithModel(modelName, prompt, history, onChunk, onModelChange, images);
                console.log(`✅ Success: ${modelName}`);
                return; // Success - exit loop
            } catch (error) {
                console.warn(`⚠️ Node ${modelName} failed: ${error.message}. Swapping...`);
                // Continue to next model
            }
        }

        throw new Error('Hive Collapse: All nodes failed.');
    }

    /**
     * Stream using a specific Gemini model
     */
    async streamWithModel(modelName, prompt, history = [], onChunk, onModelChange, images = []) {
        const model = this.genAI.getGenerativeModel({
            model: modelName,
            systemInstruction: CONFIG.systemPrompt,
            generationConfig: {
                temperature: CONFIG.temperature,
            }
        });

        if (onModelChange) {
            const displayName = modelName.toUpperCase().replace(/-/g, ' ');
            onModelChange(displayName);
        }

        // Build chat history (exclude the last user message which is the current prompt)
        const chatHistory = history.slice(0, -1).map(msg => ({
            role: msg.role === 'model' ? 'model' : 'user',
            parts: [{ text: msg.text }]
        }));

        // Handle multimodal (text + images)
        let parts = [{ text: prompt }];
        if (images && images.length > 0) {
            for (const imgUrl of images) {
                try {
                    const response = await fetch(imgUrl);
                    const blob = await response.blob();
                    const base64 = await this.blobToBase64(blob);
                    const mimeType = blob.type || 'image/jpeg';
                    parts.push({
                        inlineData: {
                            mimeType,
                            data: base64.split(',')[1]
                        }
                    });
                } catch (e) {
                    console.warn('Failed to process image:', e);
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

        if (!hasContent) {
            throw new Error('Empty response from model');
        }
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
