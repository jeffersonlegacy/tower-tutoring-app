export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        // Forward the request to Vercel AI Gateway
        // We use the same API Key (server-side environment variable), with a fallback for immediate success
        const apiKey = process.env.VITE_AI_GATEWAY_API_KEY || 'vck_8YdzdU64Ctl0OcTBz6Adxlmo7avofmbrywJSq26ad5Z5fuDjEn21maTJ';

        if (!apiKey) {
            return res.status(500).json({ error: 'Missing API configuration' });
        }

        const gatewayResponse = await fetch('https://ai-gateway.vercel.sh/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify(req.body)
        });

        if (!gatewayResponse.ok) {
            const errorText = await gatewayResponse.text();
            return res.status(gatewayResponse.status).json({ error: errorText });
        }

        // Set headers for SSE (Server-Sent Events)
        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');

        // Pipe the stream
        const reader = gatewayResponse.body.getReader();
        const decoder = new TextDecoder();

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            res.write(value);
        }

        res.end();

    } catch (error) {
        console.error('Proxy Error:', error);
        res.status(500).json({ error: 'Internal Proxy Error' });
    }
}
