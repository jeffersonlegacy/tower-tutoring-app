
import { GoogleGenerativeAI } from '@google/generative-ai';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env' });
dotenv.config({ path: '.env.local' });

// Mock dependencies
const CONFIG = {
    systemPrompt: "You are a helpful AI tutor.",
    temperature: 0.75,
};

const OPENROUTER_MODELS = {
    math: 'deepseek/deepseek-r1',
    vision: 'google/gemini-2.0-flash-exp:free',
    general: 'google/gemini-2.0-flash-exp',
    fallback: 'moonshotai/kimi-k2'
};

const ENDPOINTS = {
    openrouter: 'https://openrouter.ai/api/v1/chat/completions',
    groq: 'https://api.groq.com/openai/v1/chat/completions',
};

class MindHiveService {
    constructor() {
        this.geminiKey = process.env.VITE_GEMINI_API_KEY;
        this.genAI = this.geminiKey ? new GoogleGenerativeAI(this.geminiKey) : null;
        this.groqKey = process.env.VITE_GROQ_API_KEY;
        this.openrouterKey = process.env.VITE_OPENROUTER_API_KEY;
        
        console.log('Keys loaded:', {
            gemini: !!this.geminiKey,
            groq: !!this.groqKey,
            openrouter: !!this.openrouterKey
        });
    }

    async streamResponse(prompt, history = [], onChunk, onModelChange, images = []) {
        console.log('Test Run: streamResponse called with prompt:', prompt);
        const enrichedPrompt = prompt;
        const isComplexMath = /solve|equation|calculate|proof|integral|matrix/i.test(prompt);
        const hasImages = images && images.length > 0;

        const providers = [
            // Preference 1: Native Gemini (if available) for vision/speed
            { name: 'Gemini', models: ['gemini-2.0-flash-exp', 'gemini-1.5-flash-latest'], key: this.geminiKey, type: 'gemini', priority: hasImages ? 1 : 10 },
            
            // Preference 2: OpenRouter (DeepSeek R1) for Math/Reasoning
            { name: 'OpenRouter', models: [OPENROUTER_MODELS.math], key: this.openrouterKey, type: 'openai', endpoint: ENDPOINTS.openrouter, priority: isComplexMath ? 1 : 20 },
            
            // Preference 3: OpenRouter Fallbacks
            { name: 'OpenRouter', models: [OPENROUTER_MODELS.general, OPENROUTER_MODELS.fallback], key: this.openrouterKey, type: 'openai', endpoint: ENDPOINTS.openrouter, priority: 30 },

            // Preference 4: Groq
            { name: 'Groq', models: ['llama-3.3-70b-versatile'], key: this.groqKey, type: 'openai', endpoint: ENDPOINTS.groq, priority: 40 }
        ].sort((a, b) => (a.priority || 5) - (b.priority || 5));

        for (const provider of providers) {
            if (!provider.key) {
                console.log(`Skipping ${provider.name} (no key)`);
                continue;
            }

            for (const modelName of provider.models) {
                try {
                    console.log(`Attempting: ${provider.name} / ${modelName}`);
                    if (provider.type === 'gemini') {
                        // Mock Gemini call for node context (can't use web SDK easily in node without polyfills usually, but let's try or skip)
                        console.log('Skipping native Gemini in test script (browser SDK)');
                        continue;
                    } else {
                        await this.streamOpenAI(provider.name, provider.endpoint, provider.key, modelName, enrichedPrompt, history, onChunk, onModelChange);
                    }
                    console.log(`Success: ${modelName}`);
                    return;
                } catch (error) {
                    console.error(`Failed: ${modelName} - ${error.message}`);
                }
            }
        }
    }

    async streamOpenAI(providerName, endpoint, apiKey, modelName, prompt, history, onChunk, onModelChange) {
        console.log(`Streaming from ${endpoint} with model ${modelName}`);
        
        const messages = [{ role: 'system', content: CONFIG.systemPrompt }];
        messages.push({ role: 'user', content: prompt });

        const response = await fetch(endpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
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

        // Simple text response for node test
        console.log('Response OK. Reading stream...');
        const decoder = new TextDecoder();
        // In node fetch, body is a stream but might differ slightly from browser. 
        // For quick test, let's just use text() and see if connection works, or use arrayBuffer
        
        // Node-compatible stream reading for simple verification
        for await (const chunk of response.body) {
             const decoded = decoder.decode(chunk);
             // console.log('Chunk:', decoded.substring(0, 50) + '...');
             onChunk(decoded.length); 
        }
    }
}

// Run Test
async function runTest() {
    const service = new MindHiveService();
    await service.streamResponse(
        "Hello, are you online?", 
        [], 
        (chunk) => process.stdout.write('.'), 
        (model) => console.log('Model switched to:', model)
    );
}

runTest().catch(console.error);
