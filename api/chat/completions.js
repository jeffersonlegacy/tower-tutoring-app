import { createTraceId, isValidTemperature, readJsonBody, sendError } from '../_utils.js';

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
    const apiKey = process.env.OPENAI_API_KEY;
    const model = process.env.OPENAI_MODEL || 'gpt-4.1-mini';

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
      model: rawBody?.model || model,
      messages,
      temperature: temperature ?? 0.75,
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
      return sendError(res, {
        status: openaiResponse.status,
        code: 'openai_error',
        message: 'OpenAI request failed',
        retryable: openaiResponse.status >= 500 || openaiResponse.status === 429,
        details: errorText,
        traceId,
      });
    }

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');
    res.setHeader('X-Trace-Id', traceId);

    const reader = openaiResponse.body.getReader();
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      res.write(value);
    }
    res.end();
  } catch (error) {
    console.error(`[${traceId}] OpenAI proxy error:`, error);
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
