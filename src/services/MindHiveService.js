/**
 * MindHiveService.js - AI Tutor Backend
 * 
 * Uses Gemini API directly with the existing API key as primary.
 * Falls back to AI Gateway if available.
 */
import { GoogleGenerativeAI } from '@google/generative-ai';

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
To connect concepts, you may reference:
- Dragon Ball: Training arcs, power levels as growth metaphors, mastering techniques through repetition
- Naruto: Shadow clones = breaking problems into parts, chakra control = focus and precision
- Jujutsu Kaisen: Cursed energy management = resource allocation, Domain Expansion = mastering your domain of knowledge
- Demon Slayer: Breathing techniques = methodical approach, Total Concentration = deep focus
- The Flash: Speed Force = processing speed improves with practice, time manipulation = working backwards from the answer

Use these references sparingly and only when they genuinely clarify a concept. Don't force them.

NEURAL CONNECTION BUILDING:
Your goal is to strengthen the student's neural pathways by:
- Making them WORK for the answer (productive struggle builds stronger memories)
- Connecting new concepts to what they already know
- Using pattern recognition: "This is similar to when you solved..."
- Encouraging them to verbalize their thinking process

TONE:
- Encouraging but not patronizing
- Patient but challenging
- Confident and strategic
- Speak like a wise mentor, not a textbook

NEVER:
- Give the final answer outright (unless they've genuinely earned it through the process)
- Say "the answer is..." without them working through it
- Let them give up — always find another angle

Remember: Every question they answer themselves is a neural connection that stays. Every answer you hand them is forgotten by tomorrow.`,
    temperature: 0.7,
};

class MindHiveService {
    constructor() {
        this.geminiKey = import.meta.env.VITE_GEMINI_API_KEY;
        this.genAI = this.geminiKey ? new GoogleGenerativeAI(this.geminiKey) : null;
    }

    /**
     * Stream response using Gemini API directly
     */
    async streamResponse(prompt, history = [], onChunk, onModelChange, images = []) {
        console.log('🐝 Activating Mind Hive...');

        // Try Gemini first (most reliable with existing key)
        if (this.genAI) {
            try {
                await this.streamGemini(prompt, history, onChunk, onModelChange, images);
                return;
            } catch (error) {
                console.warn('Gemini failed:', error.message);
            }
        }

        throw new Error('AI service unavailable. Please check your API configuration.');
    }

    /**
     * Stream using Google Gemini API
     */
    async streamGemini(prompt, history = [], onChunk, onModelChange, images = []) {
        const model = this.genAI.getGenerativeModel({
            model: 'gemini-2.0-flash-exp',
            systemInstruction: CONFIG.systemPrompt
        });

        if (onModelChange) onModelChange('gemini-2.0-flash');

        // Build chat history
        const chatHistory = history.slice(0, -1).map(msg => ({
            role: msg.role === 'model' ? 'model' : 'user',
            parts: [{ text: msg.text }]
        }));

        // Handle images if provided
        let parts = [{ text: prompt }];
        if (images && images.length > 0) {
            for (const imgUrl of images) {
                try {
                    // Convert URL to base64
                    const response = await fetch(imgUrl);
                    const blob = await response.blob();
                    const base64 = await this.blobToBase64(blob);
                    const mimeType = blob.type || 'image/jpeg';
                    parts.push({
                        inlineData: {
                            mimeType,
                            data: base64.split(',')[1] // Remove data:image/...;base64, prefix
                        }
                    });
                } catch (e) {
                    console.warn('Failed to process image:', e);
                }
            }
        }

        const chat = model.startChat({ history: chatHistory });
        const result = await chat.sendMessageStream(parts);

        for await (const chunk of result.stream) {
            const text = chunk.text();
            if (text) {
                onChunk(text);
            }
        }

        console.log('✅ Gemini stream complete');
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
