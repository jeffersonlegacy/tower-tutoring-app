import { streamText } from 'ai';
import 'dotenv/config';

// Configuration "Genius Hack Professional"
const CONFIG = {
    primaryModel: 'openai/gpt-3.5-turbo', // Proven working model alias
    fallbackModel: 'openai/gpt-3.5-turbo', // Fallback
    systemPrompt: `You are a genius hack professional. 
  You provide concise, optimized, and high-leverage solutions. 
  Do not waste time on pleasantries. 
  Focus on impact, efficiency, and brilliant workarounds.`,
    temperature: 0.7,
    frequencyPenalty: 0.5,
};

async function generateWithFallback(prompt: string) {
    console.log(`⚡️ Initiating Pro-Request...`);

    try {
        console.log(`Attempting Primary Model: ${CONFIG.primaryModel}`);
        await streamResponse(CONFIG.primaryModel, prompt);
    } catch (error) {
        console.warn(`⚠️ Primary Model Failed. Engaging Fallback Protocols.`);
        console.error(`Error details: ${(error as any).message}`);

        try {
            console.log(`Engaging Fallback Model: ${CONFIG.fallbackModel}`);
            await streamResponse(CONFIG.fallbackModel, prompt);
        } catch (fallbackError) {
            console.error(`❌ Critical Failure: All models unavailable.`);
        }
    }
}

async function streamResponse(modelName: string, prompt: string) {
    // Direct string usage allows 'ai' SDK to auto-configure Vercel Gateway
    const result = streamText({
        model: modelName,
        system: CONFIG.systemPrompt,
        prompt: prompt,
        temperature: CONFIG.temperature,
        frequencyPenalty: CONFIG.frequencyPenalty,
    });

    process.stdout.write('\n> ');
    for await (const textPart of result.textStream) {
        process.stdout.write(textPart);
    }

    console.log('\n\n--- Stats ---');
    console.log('Model:', modelName);
    console.log('Token Usage:', await result.usage);
    console.log('-----------------');
}


// Test Run
(async () => {
    try {
        const prompt = "Explain the most efficient way to structure a scalable serverless architecture.";
        await generateWithFallback(prompt);
    } catch (error) {
        console.error("Fatal Script Error:", error);
    }
})();
