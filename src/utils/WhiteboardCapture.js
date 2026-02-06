/**
 * WhiteboardCapture.js - Capture whiteboard canvas as image
 * 
 * Used to let the AI "see" what the student has drawn.
 * Uses html2canvas for reliable screenshot of the entire whiteboard area.
 */
import html2canvas from 'html2canvas';

// Global reference to the tldraw editor (set by Whiteboard component)
let globalEditor = null;

/**
 * Set the global editor reference (called by Whiteboard component)
 */
export function setWhiteboardEditor(editor) {
    globalEditor = editor;
    console.log('[WhiteboardCapture] Editor reference set');
}

export function getWhiteboardEditor() {
    return globalEditor;
}

/**
 * Capture the whiteboard as a base64 PNG data URL
 * Uses multiple strategies for reliability
 */
export async function captureWhiteboard() {
    console.log('[WhiteboardCapture] Attempting capture...');

    // Strategy 1: Use tldraw's built-in export (best quality)
    if (globalEditor) {
        try {
            const result = await captureViaEditor();
            if (result) {
                console.log('[WhiteboardCapture] ✅ Captured via editor export');
                return result;
            }
        } catch (e) {
            console.warn('[WhiteboardCapture] Editor export failed:', e.message);
        }
    }

    // Strategy 2: Use html2canvas on the whiteboard container
    try {
        const result = await captureViaHtml2Canvas();
        if (result) {
            console.log('[WhiteboardCapture] ✅ Captured via html2canvas');
            return result;
        }
    } catch (e) {
        console.warn('[WhiteboardCapture] html2canvas failed:', e.message);
    }

    console.error('[WhiteboardCapture] ❌ All capture methods failed');
    return null;
}

/**
 * Capture using tldraw editor's built-in export
 */
async function captureViaEditor() {
    if (!globalEditor) return null;

    const shapes = globalEditor.getCurrentPageShapes();
    if (!shapes || shapes.length === 0) {
        console.log('[WhiteboardCapture] No shapes to capture');
        return null;
    }

    // Use tldraw's getSvg with all shapes
    const shapeIds = shapes.map(s => s.id);
    const svg = await globalEditor.getSvg(shapeIds, {
        background: true,
        padding: 20,
    });

    if (!svg) return null;

    // Convert SVG to PNG via canvas
    const svgData = new XMLSerializer().serializeToString(svg);
    const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(svgBlob);

    return new Promise((resolve) => {
        const img = new Image();
        const canvas = document.createElement('canvas');

        img.onload = () => {
            const MAX_DIM = 1600;
            let width = img.width || 800;
            let height = img.height || 600;

            if (width > MAX_DIM || height > MAX_DIM) {
                const ratio = Math.min(MAX_DIM / width, MAX_DIM / height);
                width *= ratio;
                height *= ratio;
            }

            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            ctx.fillStyle = 'white';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(img, 0, 0, width, height);
            
            URL.revokeObjectURL(url);
            // Lower quality slightly for faster transmission
            resolve(canvas.toDataURL('image/jpeg', 0.8));
        };

        img.src = url;
    });
}

/**
 * Capture using html2canvas (fallback)
 */
async function captureViaHtml2Canvas() {
    // Find the whiteboard container
    const container = document.querySelector('.tl-container')
        || document.querySelector('[data-testid="whiteboard"]')
        || document.querySelector('.tldraw');

    if (!container) {
        console.warn('[WhiteboardCapture] No whiteboard container found');
        return null;
    }

    const canvas = await html2canvas(container, {
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        scale: 1, // Keep it 1:1 for speed
        logging: false,
    });

    return canvas.toDataURL('image/png', 0.9);
}
