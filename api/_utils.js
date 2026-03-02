export function createTraceId(prefix = 'api') {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export function readJsonBody(req) {
  if (typeof req.body === 'string') {
    try {
      return JSON.parse(req.body);
    } catch {
      return null;
    }
  }
  return req.body || null;
}

export function sendError(res, { status = 500, code = 'internal_error', message = 'Internal error', retryable = false, details = null, traceId }) {
  const payload = {
    ok: false,
    error: { code, message, retryable, details },
    traceId,
  };
  res.status(status).json(payload);
}

export function sendOk(res, data, traceId) {
  res.status(200).json({ ok: true, data, traceId });
}

export function isValidTemperature(value) {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0 && value <= 2;
}
