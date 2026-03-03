import { createTraceId, readJsonBody, sendError, sendOk } from '../_utils.js';

function hashSeed(input = '') {
  const str = String(input || 'tower-hero');
  let hash = 2166136261;
  for (let i = 0; i < str.length; i += 1) {
    hash ^= str.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return Math.abs(hash >>> 0);
}

function pick(arr, seed, offset = 0) {
  return arr[(seed + offset) % arr.length];
}

function svgToDataUrl(svg) {
  return `data:image/svg+xml;base64,${Buffer.from(svg, 'utf8').toString('base64')}`;
}

function buildHeroSvg(seedText) {
  const seed = hashSeed(seedText);
  const palettes = [
    ['#06b6d4', '#2563eb', '#0f172a'],
    ['#f43f5e', '#7c3aed', '#111827'],
    ['#f59e0b', '#ef4444', '#1f2937'],
    ['#10b981', '#14b8a6', '#111827'],
    ['#22c55e', '#3b82f6', '#0b1022'],
  ];
  const symbols = ['⚡', '🛡️', '⭐', '🔥', '🧠', '🚀'];

  const [c1, c2, c3] = pick(palettes, seed);
  const symbol = pick(symbols, seed, 7);
  const ringOpacity = 0.18 + ((seed % 30) / 100);
  const tilt = ((seed % 21) - 10) / 10;

  const svg = `
<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 1024 1024" role="img" aria-label="Hero avatar">
  <defs>
    <radialGradient id="bg" cx="50%" cy="42%" r="70%">
      <stop offset="0%" stop-color="${c1}" />
      <stop offset="55%" stop-color="${c2}" />
      <stop offset="100%" stop-color="${c3}" />
    </radialGradient>
    <radialGradient id="aura" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="rgba(255,255,255,0.45)" />
      <stop offset="100%" stop-color="rgba(255,255,255,0)" />
    </radialGradient>
    <filter id="softGlow" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="16" result="blur" />
      <feMerge>
        <feMergeNode in="blur" />
        <feMergeNode in="SourceGraphic" />
      </feMerge>
    </filter>
  </defs>

  <rect width="1024" height="1024" fill="url(#bg)" />
  <circle cx="512" cy="512" r="420" fill="none" stroke="white" stroke-opacity="${ringOpacity.toFixed(2)}" stroke-width="24"/>
  <circle cx="512" cy="512" r="330" fill="url(#aura)" />
  <circle cx="512" cy="470" r="190" fill="rgba(255,255,255,0.08)" />
  <path d="M352 736 C430 660, 594 660, 672 736" fill="none" stroke="rgba(255,255,255,0.55)" stroke-width="36" stroke-linecap="round"/>
  <g transform="translate(512, 512) rotate(${tilt})" filter="url(#softGlow)">
    <text x="0" y="46" text-anchor="middle" font-size="232" font-family="Arial, sans-serif">${symbol}</text>
  </g>
  <text x="512" y="922" text-anchor="middle" fill="rgba(255,255,255,0.85)" font-size="44" font-family="Arial, sans-serif" letter-spacing="6">TOWER HERO</text>
</svg>
`;

  return svg;
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
    const rawBody = readJsonBody(req) || {};
    const prompt = String(rawBody.prompt || rawBody.sourceImage || 'tower-hero');
    const svg = buildHeroSvg(prompt);

    return sendOk(res, {
      imageData: svgToDataUrl(svg),
      provider: 'hero_forge',
    }, traceId);
  } catch (error) {
    console.error(`[${traceId}] Hero avatar route error:`, error);
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
