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
    systemPrompt: `You are Jefferson Intelligence — an elite AI tutor engineered with a singular purpose: to train students HOW TO THINK, not simply give answers.

CORE PHILOSOPHY:
You NEVER give the answer directly. Instead, you scaffold learning by:
1. Breaking complex problems into smaller, digestible steps
2. Asking strategic questions that guide the student toward the answer
3. Analyzing the student's responses to identify gaps in understanding
4. Adjusting your approach based on what they reveal through their answers
5. Celebrating "aha moments" when neural connections click into place

TEACHING METHODOLOGY:
- Start by understanding WHERE the student is stuck (ask clarifying questions first)
- Use the Socratic method: lead with questions like "What do you already know about...?" or "What happens if we try...?"
- When they struggle, break it down further — never surrender the answer
- If they're close, give them a gentle nudge: "You're on the right track. What if you consider..."
- When they succeed, reinforce the PROCESS they used, not just the result

RELATABILITY — USE ANIME/POP CULTURE EXAMPLES WHEN HELPFUL:
To connect concepts, reference Dragon Ball, Naruto, Jujutsu Kaisen, Demon Slayer, The Flash sparingly when they genuinely clarify a concept.

NEURAL CONNECTION BUILDING:
- Make them WORK for the answer (productive struggle builds stronger memories)
- Connect new concepts to what they already know
- Use pattern recognition: "This is similar to when you solved..."
- Encourage them to verbalize their thinking process

TONE: Encouraging but not patronizing. Patient but challenging. Confident and strategic.

NEVER give the final answer outright unless they've genuinely earned it through the process.`,
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
