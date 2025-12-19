// THE HIVE: Prioritized list of validated models
// Updated to prioritize Mistral (Proven connectivity)
const HIVE_MODELS = [
    'mistral/ministral-3b',
    'openai/gpt-4o-mini',
    'deepseek/deepseek-v3'
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
        // No INIT needed
        this.baseUrl = window.location.origin + '/api/chat/completions';
    }

    /**
     * Streams a response from the hive using direct fetch to bypass SDK complexities.
     */
    async streamResponse(prompt, history = [], onChunk, onModelChange) {
        console.log(`🐝 activating mind hive...`);

        const messages = [
            { role: 'system', content: CONFIG.systemPrompt },
            ...history.map(m => ({ role: m.role === 'model' ? 'assistant' : 'user', content: m.text })),
            { role: 'user', content: prompt }
        ];

        for (const modelName of HIVE_MODELS) {
            try {
                console.log(`Attempting Node: ${modelName}`);

                const response = await fetch(this.baseUrl, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        model: modelName,
                        messages: messages,
                        temperature: CONFIG.temperature,
                        stream: true
                    })
                });

                if (!response.ok) {
                    const errorText = await response.text().catch(() => response.statusText);
                    console.warn(`Node ${modelName} returned HTTP ${response.status}: ${errorText}`);
                    throw new Error(`HTTP ${response.status}`);
                }

                // Notify UI which model connected
                if (onModelChange) onModelChange(modelName);

                const reader = response.body.getReader();
                const decoder = new TextDecoder();
                let hasContent = false;

                while (true) {
                    const { done, value } = await reader.read();
                    if (done) break;

                    const chunk = decoder.decode(value, { stream: true });
                    // Vercel Gateway returns SSE format "data: ...". 
                    // To keep it simple, we'll strip "data: " and json parse if we can,
                    // or just dump the raw text if it's not SSE.
                    // Actually, since we are proxying, we might receive raw chunks if we didn't handle SSE in proxy.
                    // But our proxy pipes raw.

                    // Simple parser for Vercel/OpenAI SSE
                    const lines = chunk.split('\n');
                    for (const line of lines) {
                        const trimmed = line.trim();
                        if (!trimmed || trimmed === 'data: [DONE]') continue;

                        if (trimmed.startsWith('data: ')) {
                            try {
                                const json = JSON.parse(trimmed.substring(6));
                                const content = json.choices?.[0]?.delta?.content;
                                if (content) {
                                    hasContent = true;
                                    onChunk(content);
                                }
                            } catch (e) {
                                // ignore parse errors for partial chunks
                            }
                        }
                    }
                }

                if (!hasContent) {
                    // Fallback: maybe it wasn't SSE? Just send raw chunk?
                    // No, assume connection worked.
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
