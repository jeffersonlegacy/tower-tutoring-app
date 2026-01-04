// THE HIVE: Prioritized list of validated models
// Updated to prioritize Mistral (Proven connectivity)
const HIVE_MODELS = [
    'openai/gpt-4o-mini',
    'mistral/ministral-3b',
    'deepseek/deepseek-v3'
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
