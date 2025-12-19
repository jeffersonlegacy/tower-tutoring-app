import { createOpenAI } from '@ai-sdk/openai';
import { streamText } from 'ai';

// THE HIVE: Prioritized list of high-value models
// Adapted for Client-Side usage
const HIVE_MODELS = [
    'google/gemini-2.0-flash-lite',
    'openai/gpt-4o-mini',
    'deepseek/deepseek-v3',
    'meta/llama-3.1-70b',
    'mistral/ministral-3b'
];

const CONFIG = {
    systemPrompt: `You are a seamless intelligent agent. 
    You are part of a swarm. 
    If you are picking up a conversation, continue naturally.
    Provide the highest value, most concise answer possible.`,
    temperature: 0.7,
};

class MindHiveService {
    constructor() {
        this.apiKey = import.meta.env.VITE_AI_GATEWAY_API_KEY;
        this.openai = createOpenAI({
            apiKey: this.apiKey,
            baseURL: 'https://gateway.ai.vercel.sh/openai/v1',
            // Dangerous: Client-side usage requires allowing browser access
            dangerouslyAllowBrowser: true
        });
    }

    /**
     * Streams a response from the hive, handling failover automatically.
     * @param {string} prompt - User input
     * @param {Array} history - Previous messages for context
     * @param {function} onChunk - Callback for each text chunk
     * @param {function} onModelChange - Callback when a specific model is locked in
     * @returns {Promise<void>}
     */
    async streamResponse(prompt, history = [], onChunk, onModelChange) {
        console.log(`🐝 activating mind hive...`);

        // Format history for the AI SDK if needed, 
        // but for now we'll just append the prompt to the system/user context structure
        // purely as a prompt string or use the SDK's 'messages' prop if we want robust chat history.
        // To catch "seamlessly pick up context", we pass the full message history.

        const messages = [
            { role: 'system', content: CONFIG.systemPrompt },
            ...history.map(m => ({ role: m.role === 'model' ? 'assistant' : 'user', content: m.text })),
            { role: 'user', content: prompt }
        ];

        for (const modelName of HIVE_MODELS) {
            try {
                console.log(`Attempting Node: ${modelName}`);

                const result = await streamText({
                    model: this.openai(modelName),
                    messages: messages,
                    temperature: CONFIG.temperature,
                });

                // Notify UI which model won the race
                if (onModelChange) onModelChange(modelName);

                let hasContent = false;

                // Stream the output
                for await (const textPart of result.textStream) {
                    hasContent = true;
                    onChunk(textPart);
                }

                if (!hasContent) {
                    throw new Error("Stream completed but returned no content.");
                }

                console.log(`✅ Success Node: ${modelName}`);
                return; // Success!

            } catch (error) {
                console.warn(`⚠️ Node ${modelName} failed/unresponsive. Swapping...`, error);
                // Loop continues to next model
            }
        }

        throw new Error("Hive Collapse: All nodes failed.");
    }
}

export const mindHive = new MindHiveService();
