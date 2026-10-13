import { createLiveKitToken } from '../_livekit.js';

export default async function handler(req, res) {
  if (req.method !== 'POST' && req.method !== 'GET') {
    res.setHeader?.('Allow', 'POST, GET');
    return res.status(405).json({ ok: false, error: 'Method not allowed' });
  }

  try {
    let body = req.body || {};
    if (typeof body === 'string') {
      try {
        body = JSON.parse(body);
      } catch {
        body = {};
      }
    }

    const sessionId = body.sessionId || body.roomId || req.query?.sessionId;
    const displayName = body.displayName || body.userName || req.query?.displayName || 'Learner';
    const identity = body.identity || req.query?.identity;

    if (!sessionId) {
      return res.status(400).json({
        ok: false,
        error: 'sessionId is required to start a video session',
      });
    }

    const tokenData = await createLiveKitToken({
      sessionId,
      displayName,
      identity,
    });

    return res.status(200).json({ ok: true, data: tokenData });
  } catch (error) {
    return res.status(500).json({
      ok: false,
      error: error?.message || 'Failed to initialize video session',
    });
  }
}
