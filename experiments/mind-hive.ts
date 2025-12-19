import { streamText } from 'ai';
import 'dotenv/config';

// THE HIVE: Prioritized list of high-value models
// 1. Gemini Flash Lite: Extreme speed/value.
// 2. GPT-4o Mini: Balance of smarts and cost.
// 3. DeepSeek V3: High IQ for low cost.
// 4. Llama 3.1 70b: Open source power.
// 5. Ministry 3b: Ultimate cheap fallback.
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

async function askTheHive(prompt: string) {
    console.log(`🐝 Activating Mind Hive...`);

    // Attempt models in order
    for (const modelName of HIVE_MODELS) {
        try {
            console.log(`\nAttempting Node: ${modelName}`);

            // Note: We use the string "modelName" which the AI SDK 
            // maps to the Vercel AI Gateway via our Env Var API Key.
            const result = streamText({
                model: modelName,
                system: CONFIG.systemPrompt,
                prompt: prompt,
                temperature: CONFIG.temperature,
                // We add a timeout signal/logic implicitly by catching errors
            });

            // If we get here, the stream started successfully.
            // We now pipe it to stdout.
            process.stdout.write('> ');
            let tokenUsage;

            for await (const textPart of result.textStream) {
                process.stdout.write(textPart);
            }

            // Capture usage if available
            try {
                tokenUsage = await result.usage;
            } catch (e) { }

            console.log('\n\n✅ Success Node:', modelName);
            if (tokenUsage) console.log('Token Efficiency:', tokenUsage);

            // Break the loop on success
            return;

        } catch (error) {
            // SILENT FAILOVER
            // We catch the error, log a tiny debug note, and immediately loop to the next model.
            console.warn(`⚠️ Node ${modelName} unresponsive. Switching context...`);
            // Continue the loop -> Next model picks up the prompt.
        }
    }

    console.error(`❌ Hive Collapse: All nodes failed.`);
}

// Test Swarm
(async () => {
    const prompt = "Briefly explain the concept of 'Antigravity' in theoretical physics vs science fiction.";
    await askTheHive(prompt);
})();
