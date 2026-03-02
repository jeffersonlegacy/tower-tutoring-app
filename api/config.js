import { get } from '@vercel/edge-config';
import { createTraceId, sendError, sendOk } from './_utils.js';

export default async function handler(req, res) {
    const traceId = createTraceId('config');
    try {
        const galeneServerUrl = await get('galeneServerUrl');
        const maintenanceMode = await get('maintenanceMode');

        sendOk(res, {
            galeneServerUrl: galeneServerUrl || null,
            maintenanceMode: maintenanceMode || { enabled: false, message: '' }
        }, traceId);
    } catch (error) {
        console.error(`[${traceId}] Edge Config Error:`, error);
        sendError(res, {
            status: 500,
            code: 'config_fetch_failed',
            message: 'Failed to fetch config',
            retryable: true,
            details: error?.message || 'unknown',
            traceId,
        });
    }
}
