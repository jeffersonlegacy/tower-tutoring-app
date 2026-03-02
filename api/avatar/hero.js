function toDataUrlFromBase64(base64, mime = 'image/png') {
  return `data:${mime};base64,${base64}`;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const apiKey = process.env.OPENAI_API_KEY;
    const model = process.env.OPENAI_IMAGE_MODEL || 'gpt-image-1';

    if (!apiKey) {
      return res.status(500).json({ error: 'Missing OPENAI_API_KEY' });
    }

    const rawBody = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    const prompt =
      rawBody?.prompt ||
      'Create an epic superhero portrait avatar, bold colors, glowing energy aura, cinematic lighting, inspiring and kid-friendly style.';

    const response = await fetch('https://api.openai.com/v1/images/generations', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        prompt,
        size: '1024x1024',
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return res.status(response.status).json({ error: errorText });
    }

    const data = await response.json();
    const item = data?.data?.[0];

    if (item?.b64_json) {
      return res.status(200).json({
        imageData: toDataUrlFromBase64(item.b64_json),
      });
    }

    if (item?.url) {
      return res.status(200).json({
        imageData: item.url,
      });
    }

    return res.status(500).json({ error: 'No image returned from OpenAI' });
  } catch (error) {
    console.error('OpenAI avatar route error:', error);
    return res.status(500).json({ error: 'Avatar generation failed' });
  }
}
