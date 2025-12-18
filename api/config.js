import { get } from '@vercel/edge-config';

export default async function handler(req, res) {
    try {
        const galeneServerUrl = await get('galeneServerUrl');
        const maintenanceMode = await get('maintenanceMode');

        res.status(200).json({
            galeneServerUrl: galeneServerUrl || null,
            maintenanceMode: maintenanceMode || { enabled: false, message: '' }
        });
    } catch (error) {
        console.error('Edge Config Error:', error);
        res.status(500).json({
            galeneServerUrl: null,
            maintenanceMode: { enabled: false, message: '' },
            error: 'Failed to fetch config'
        });
    }
}
