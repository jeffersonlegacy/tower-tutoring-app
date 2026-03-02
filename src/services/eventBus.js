const CONTRACTS = {
  'ai-vision-upload': (detail) => {
    if (!detail || typeof detail !== 'object') return null;
    const source = ['homework', 'board', 'auto'].includes(detail.source) ? detail.source : null;
    const imageUrl = typeof detail.imageUrl === 'string' && detail.imageUrl ? detail.imageUrl : null;
    const imageData = typeof detail.imageData === 'string' && detail.imageData ? detail.imageData : null;
    const context = typeof detail.context === 'string' ? detail.context : '';

    if (!source || (!imageUrl && !imageData)) return null;
    return { source, imageUrl, imageData, context };
  },
  'ai-thinking-start': (detail) => ({ ...(detail || {}) }),
  'ai-thinking-stop': (detail) => ({ ...(detail || {}) }),
  'ai-whiteboard-action': (detail) => {
    if (!detail || typeof detail !== 'object') return null;
    if (typeof detail.type !== 'string' || !detail.type.trim()) return null;
    const payload = detail.payload && typeof detail.payload === 'object' ? detail.payload : {};
    const expiresMs = Number.isFinite(detail.expiresMs) ? detail.expiresMs : undefined;
    return { type: detail.type, payload, expiresMs };
  },
  'tower-notification': (detail) => {
    if (!detail || typeof detail !== 'object' || typeof detail.type !== 'string') return null;
    return { type: detail.type, data: detail.data || {} };
  },
  'ui-toast': (detail) => {
    if (!detail || typeof detail !== 'object' || typeof detail.message !== 'string') return null;
    const level = ['info', 'success', 'warning', 'error'].includes(detail.level) ? detail.level : 'info';
    const durationMs = Number.isFinite(detail.durationMs) ? detail.durationMs : 3000;
    return { level, message: detail.message, durationMs };
  },
};

export function publishEvent(name, detail = {}) {
  const contract = CONTRACTS[name];
  const payload = contract ? contract(detail) : detail;
  if (contract && !payload) return false;
  window.dispatchEvent(new CustomEvent(name, { detail: payload }));
  return true;
}

export function subscribeEvent(name, handler) {
  const listener = (event) => {
    const contract = CONTRACTS[name];
    const payload = contract ? contract(event.detail) : event.detail;
    if (contract && !payload) return;
    handler(payload, event);
  };
  window.addEventListener(name, listener);
  return () => window.removeEventListener(name, listener);
}

export function getEventContracts() {
  return Object.keys(CONTRACTS);
}
