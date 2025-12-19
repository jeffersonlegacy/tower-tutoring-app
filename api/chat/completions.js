export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        // Forward the request to Vercel AI Gateway
        // We use the same API Key (server-side environment variable)
        const apiKey = process.env.VITE_AI_GATEWAY_API_KEY;

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
        // Using native fetch in Node 18+, body is a ReadableStream (web stream). 
        // Vercel/Node response expects a Node stream.
        // We can use a simple reader loop or convert it.

        const reader = gatewayResponse.body.getReader();
        const decoder = new TextDecoder();

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            // Write the raw bytes (or decoded text) to the response
            // res.write() in Node accepts strings or buffers. 
            // value is a Uint8Array.
            res.write(value);
        }

        res.end();

    } catch (error) {
        console.error('Proxy Error:', error);
        res.status(500).json({ error: 'Internal Proxy Error' });
    }
}
