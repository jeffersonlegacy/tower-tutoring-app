import { SignJWT } from 'jose';
import { randomUUID } from 'node:crypto';

const FALLBACK_LIVEKIT_URL = 'wss://livekit.73.189.223.234.sslip.io:8448';
const FALLBACK_LIVEKIT_API_KEY = 'lk_97c6b6b08a5398673804901f817bafee';
const FALLBACK_LIVEKIT_API_SECRET = '1a77a58cd5fd3d8c88014ebb8d2029991a27af6eca803a31f1ea10ef296338b8';

export function getLiveKitConfig() {
  const apiKey = process.env.LIVEKIT_API_KEY || FALLBACK_LIVEKIT_API_KEY;
  const apiSecret = process.env.LIVEKIT_API_SECRET || FALLBACK_LIVEKIT_API_SECRET;
  const livekitUrl = process.env.LIVEKIT_URL || process.env.VITE_LIVEKIT_URL || FALLBACK_LIVEKIT_URL;

  const isConfigured = Boolean(apiKey && apiSecret && livekitUrl);
  return { apiKey, apiSecret, livekitUrl, isConfigured };
}

export async function createLiveKitToken({
  sessionId,
  displayName,
  identity: customIdentity,
  role: _role = 'attendee',
}) {
  const { apiKey, apiSecret, livekitUrl, isConfigured } = getLiveKitConfig();
  const roomName = `tutoring-${String(sessionId || 'default').trim().toLowerCase()}`;
  const cleanName = String(displayName || 'Learner').trim();
  const identity = customIdentity || `${cleanName.toLowerCase().replace(/[^a-z0-9]+/g, '-')}_${randomUUID().slice(0, 8)}`;

  const nowSeconds = Math.floor(Date.now() / 1000);
  const expSeconds = nowSeconds + 60 * 60; // 1 hour

  if (!isConfigured) {
    return {
      provider: 'livekit',
      token: `dev-token-${roomName}-${identity}`,
      roomName,
      identity,
      displayName: cleanName,
      expiresAt: new Date(expSeconds * 1000).toISOString(),
      livekitUrl: livekitUrl || 'ws://127.0.0.1:7880',
      devMode: true,
      message: 'LiveKit credentials missing. Set LIVEKIT_API_KEY, LIVEKIT_API_SECRET, and LIVEKIT_URL.',
    };
  }

  const secret = new TextEncoder().encode(apiSecret);
  const token = await new SignJWT({
    name: cleanName,
    video: {
      room: roomName,
      roomJoin: true,
      canPublish: true,
      canSubscribe: true,
      canPublishData: true,
    },
  })
    .setProtectedHeader({ alg: 'HS256', typ: 'JWT' })
    .setIssuer(apiKey)
    .setSubject(identity)
    .setIssuedAt(nowSeconds)
    .setNotBefore(nowSeconds)
    .setExpirationTime(expSeconds)
    .sign(secret);

  return {
    provider: 'livekit',
    token,
    roomName,
    identity,
    displayName: cleanName,
    expiresAt: new Date(expSeconds * 1000).toISOString(),
    livekitUrl,
    devMode: false,
  };
}
