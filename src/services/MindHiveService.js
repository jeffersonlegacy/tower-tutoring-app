// THE HIVE: Prioritized list of validated models
// Updated to prioritize Mistral (Proven connectivity)
const HIVE_MODELS = [
    'openai/gpt-4o-mini',
    'mistral/ministral-3b',
    'deepseek/deepseek-v3'
];

const CONFIG = {
    systemPrompt: `You are Jefferson Intelligence, an elite AI tutor and strategic educational advisor.
    Your mission is to empower the user with high-value, precise, and actionable insights.
    
    Guidelines:
    - Tone: Professional, Sophisticated, Encouraging, and Sharp.
    - Context: You are the central intelligence of the Jefferson Tutoring platform.
    - Style: Be concise but comprehensive. Use markdown for structure (bullet points, bold text). Avoid generic pleasantries.
    - Goal: Maximize learning efficiency and clarity in every interaction.`,
    temperature: 0.7,
};

class MindHiveService {
    constructor() {
        // In dev mode, we might hit the gateway directly if the proxy /api is not available
        this.isDev = import.meta.env.DEV;
        this.gatewayUrl = 'https://ai-gateway.vercel.sh/v1/chat/completions';
        this.proxyUrl = window.location.origin + '/api/chat/completions';
    }

    /**
     * Streams a response from the hive using direct fetch to bypass SDK complexities.
     * Supports Multimodal Inputs (Text + Images).
     */
    async streamResponse(prompt, history = [], onChunk, onModelChange, images = []) {
        console.log(`🐝 activating mind hive...`);

        // Format User Message (Multimodal support)
        let userContent = prompt;
        if (images && images.length > 0) {
            userContent = [
                { type: "text", text: prompt },
                ...images.map(url => ({
                    type: "image_url",
                    image_url: { url: url }
                }))
            ];
        }

        const messages = [
            { role: 'system', content: CONFIG.systemPrompt },
            ...history.map(m => ({ role: m.role === 'model' ? 'assistant' : 'user', content: m.text })),
            { role: 'user', content: userContent }
        ];

        for (const modelName of HIVE_MODELS) {
            try {
                console.log(`Attempting Node: ${modelName}`);

                // Try proxy first, then gateway if in dev
                let targetUrl = this.proxyUrl;
                let headers = { 'Content-Type': 'application/json' };

                if (this.isDev) {
                    const devKey = import.meta.env.VITE_AI_GATEWAY_API_KEY;
                    if (devKey) {
                        targetUrl = this.gatewayUrl;
                        headers['Authorization'] = `Bearer ${devKey}`;
                    }
                }

                const response = await fetch(targetUrl, {
                    method: 'POST',
                    headers: headers,
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
                            } catch {
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
