import { createTraceId, readJsonBody, sendError, sendOk } from '../_utils.js';

function toDataUrlFromBase64(base64, mime = 'image/png') {
  return `data:${mime};base64,${base64}`;
}

export default async function handler(req, res) {
  const traceId = createTraceId('avatar');

  if (req.method !== 'POST') {
    return sendError(res, {
      status: 405,
      code: 'method_not_allowed',
      message: 'Method not allowed',
      retryable: false,
      traceId,
    });
  }

  try {
    const apiKey = process.env.OPENAI_API_KEY;
    const model = process.env.OPENAI_IMAGE_MODEL || 'gpt-image-1';

    if (!apiKey) {
      return sendError(res, {
        status: 500,
        code: 'missing_api_key',
        message: 'Missing OPENAI_API_KEY',
        retryable: false,
        traceId,
      });
    }

    const rawBody = readJsonBody(req);
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
      return sendError(res, {
        status: response.status,
        code: 'openai_image_error',
        message: 'OpenAI image generation failed',
        retryable: response.status >= 500 || response.status === 429,
        details: errorText,
        traceId,
      });
    }

    const data = await response.json();
    const item = data?.data?.[0];

    if (item?.b64_json) {
      return sendOk(res, {
        imageData: toDataUrlFromBase64(item.b64_json),
      }, traceId);
    }

    if (item?.url) {
      return sendOk(res, {
        imageData: item.url,
      }, traceId);
    }

    return sendError(res, {
      status: 500,
      code: 'no_image_returned',
      message: 'No image returned from OpenAI',
      retryable: true,
      traceId,
    });
  } catch (error) {
    console.error(`[${traceId}] OpenAI avatar route error:`, error);
    return sendError(res, {
      status: 500,
      code: 'avatar_generation_failed',
      message: 'Avatar generation failed',
      retryable: true,
      details: error?.message || 'unknown',
      traceId,
    });
  }
}
