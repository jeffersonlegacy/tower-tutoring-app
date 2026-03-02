function nowIso() {
  return new Date().toISOString();
}

function normalizeError(error) {
  if (!error) return { message: 'Unknown error' };
  if (typeof error === 'string') return { message: error };
  return {
    message: error.message || 'Unknown error',
    name: error.name || 'Error',
    stack: error.stack || '',
  };
}

export function trackEvent(name, data = {}) {
  console.info('[telemetry:event]', { name, data, at: nowIso() });
}

export function trackError(scope, error, context = {}) {
  console.error('[telemetry:error]', {
    scope,
    error: normalizeError(error),
    context,
    at: nowIso(),
  });
}

export function withTraceId(prefix = 'trace') {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}
