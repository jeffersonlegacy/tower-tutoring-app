export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const apiKey = process.env.OPENAI_API_KEY;
    const model = process.env.OPENAI_MODEL || 'gpt-4.1-mini';

    if (!apiKey) {
      return res.status(500).json({ error: 'Missing OPENAI_API_KEY' });
    }

    const rawBody = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    const messages = Array.isArray(rawBody?.messages) ? rawBody.messages : [];

    if (!messages.length) {
      return res.status(400).json({ error: 'messages array is required' });
    }

    const payload = {
      model: rawBody?.model || model,
      messages,
      temperature: rawBody?.temperature ?? 0.75,
      stream: true,
    };

    const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(payload),
    });

    if (!openaiResponse.ok) {
      const errorText = await openaiResponse.text();
      return res.status(openaiResponse.status).json({ error: errorText });
    }

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');

    const reader = openaiResponse.body.getReader();
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      res.write(value);
    }
    res.end();
  } catch (error) {
    console.error('OpenAI proxy error:', error);
    res.status(500).json({ error: 'Internal proxy error' });
  }
}
