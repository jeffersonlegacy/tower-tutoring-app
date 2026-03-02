import { createTraceId, sendOk } from './_utils.js';

export default function handler(req, res) {
    const traceId = createTraceId('health');
    sendOk(res, { status: 'alive', timestamp: Date.now() }, traceId);
}
