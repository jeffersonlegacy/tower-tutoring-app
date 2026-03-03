import { createTraceId, isValidTemperature, readJsonBody, sendError } from '../_utils.js';

function parseDataUrlImage(url) {
  if (typeof url !== 'string') return null;
  const match = url.match(/^data:([^;]+);base64,(.+)$/);
  if (!match) return null;
  return {
    mimeType: match[1],
    data: match[2],
  };
}

function toGeminiParts(content) {
  if (typeof content === 'string') {
    return content.trim() ? [{ text: content }] : [];
  }

  if (!Array.isArray(content)) return [];

  const parts = [];
  for (const item of content) {
    if (!item || typeof item !== 'object') continue;
    if (item.type === 'text' && typeof item.text === 'string' && item.text.trim()) {
      parts.push({ text: item.text });
      continue;
    }
    if (item.type === 'image_url') {
      const url = item?.image_url?.url;
      const inline = parseDataUrlImage(url);
      if (inline) {
        parts.push({ inlineData: inline });
      } else if (typeof url === 'string' && url.trim()) {
        parts.push({ text: `Image URL: ${url}` });
      }
    }
  }
  return parts;
}

function toGeminiPayload({ messages, model, temperature }) {
  const systemMessages = [];
  const contents = [];

  for (const message of messages) {
    if (!message || typeof message !== 'object') continue;
    const role = message.role;
    const parts = toGeminiParts(message.content);
    if (!parts.length) continue;

    if (role === 'system') {
      systemMessages.push(...parts.filter((p) => typeof p.text === 'string'));
      continue;
    }

    const geminiRole = role === 'assistant' ? 'model' : 'user';
    contents.push({ role: geminiRole, parts });
  }

  const payload = {
    contents,
    generationConfig: {
      temperature,
    },
  };

  if (systemMessages.length) {
    payload.system_instruction = { parts: systemMessages };
  }

  return { payload, model };
}

function extractGeminiText(result) {
  const parts = result?.candidates?.[0]?.content?.parts;
  if (!Array.isArray(parts)) return '';
  return parts
    .map((part) => (typeof part?.text === 'string' ? part.text : ''))
    .join('')
    .trim();
}

function writeSSEChunks(res, text, traceId) {
  const chunks = text.match(/[\s\S]{1,180}/g) || [];

  for (const piece of chunks) {
    const payload = {
      id: traceId,
      object: 'chat.completion.chunk',
      choices: [{ index: 0, delta: { content: piece }, finish_reason: null }],
    };
    res.write(`data: ${JSON.stringify(payload)}\n\n`);
  }

  const donePayload = {
    id: traceId,
    object: 'chat.completion.chunk',
    choices: [{ index: 0, delta: {}, finish_reason: 'stop' }],
  };

  res.write(`data: ${JSON.stringify(donePayload)}\n\n`);
  res.write('data: [DONE]\n\n');
}

export default async function handler(req, res) {
  const traceId = createTraceId('chat');

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
    const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
    const defaultModel = process.env.GEMINI_MODEL || 'gemini-1.5-flash';

    if (!apiKey) {
      return sendError(res, {
        status: 500,
        code: 'missing_api_key',
        message: 'Missing GEMINI_API_KEY',
        retryable: false,
        traceId,
      });
    }

    const rawBody = readJsonBody(req);
    if (!rawBody || typeof rawBody !== 'object') {
      return sendError(res, {
        status: 400,
        code: 'invalid_body',
        message: 'Request body must be valid JSON object',
        retryable: false,
        traceId,
      });
    }

    const messages = Array.isArray(rawBody?.messages) ? rawBody.messages : [];

    if (!messages.length) {
      return sendError(res, {
        status: 400,
        code: 'invalid_messages',
        message: 'messages array is required',
        retryable: false,
        traceId,
      });
    }

    const temperature = rawBody?.temperature;
    if (temperature !== undefined && !isValidTemperature(temperature)) {
      return sendError(res, {
        status: 400,
        code: 'invalid_temperature',
        message: 'temperature must be a number between 0 and 2',
        retryable: false,
        traceId,
      });
    }

    const payload = {
      model: rawBody?.model || defaultModel,
      messages,
      temperature: temperature ?? 0.75,
    };

    const { payload: geminiPayload, model } = toGeminiPayload(payload);
    if (!geminiPayload.contents?.length) {
      return sendError(res, {
        status: 400,
        code: 'invalid_messages',
        message: 'No valid user/assistant message parts found for Gemini payload',
        retryable: false,
        traceId,
      });
    }

    const geminiResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(apiKey)}`,
      {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(geminiPayload),
    },
    );

    if (!geminiResponse.ok) {
      const errorText = await geminiResponse.text();
      return sendError(res, {
        status: geminiResponse.status,
        code: 'gemini_error',
        message: 'Gemini request failed',
        retryable: geminiResponse.status >= 500 || geminiResponse.status === 429,
        details: errorText,
        traceId,
      });
    }

    const geminiJson = await geminiResponse.json();
    const text = extractGeminiText(geminiJson);
    if (!text) {
      return sendError(res, {
        status: 502,
        code: 'empty_model_response',
        message: 'Gemini returned an empty response',
        retryable: true,
        details: geminiJson,
        traceId,
      });
    }

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');
    res.setHeader('X-Trace-Id', traceId);
    writeSSEChunks(res, text, traceId);
    res.end();
  } catch (error) {
    console.error(`[${traceId}] Gemini proxy error:`, error);
    sendError(res, {
      status: 500,
      code: 'internal_proxy_error',
      message: 'Internal proxy error',
      retryable: true,
      details: error?.message || 'unknown',
      traceId,
    });
  }
}
