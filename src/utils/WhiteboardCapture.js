/**
 * WhiteboardCapture.js - Capture whiteboard canvas as image
 * 
 * Used to let the AI "see" what the student has drawn.
 */

/**
 * Capture the tldraw canvas as a base64 data URL
 * @returns {Promise<string|null>} Base64 image data URL or null if failed
 */
export async function captureWhiteboard() {
    try {
        // Find the tldraw canvas element
        const canvas = document.querySelector('.tl-canvas');
        if (!canvas) {
            console.warn('Whiteboard canvas not found');
            return null;
        }

        // Use html2canvas-like approach with native canvas
        // The tldraw canvas is an SVG, so we need to convert it
        const svg = canvas.querySelector('svg');
        if (!svg) {
            // Try finding a direct canvas element
            const directCanvas = document.querySelector('.tldraw__editor canvas');
            if (directCanvas) {
                return directCanvas.toDataURL('image/png');
            }
            console.warn('No SVG or canvas found in whiteboard');
            return null;
        }

        // Clone and serialize SVG
        const svgClone = svg.cloneNode(true);
        const svgData = new XMLSerializer().serializeToString(svgClone);
        const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
        const url = URL.createObjectURL(svgBlob);

        // Draw to canvas
        const img = new Image();
        const canvas2d = document.createElement('canvas');

        return new Promise((resolve) => {
            img.onload = () => {
                canvas2d.width = img.width || 800;
                canvas2d.height = img.height || 600;
                const ctx = canvas2d.getContext('2d');
                ctx.fillStyle = 'white';
                ctx.fillRect(0, 0, canvas2d.width, canvas2d.height);
                ctx.drawImage(img, 0, 0);
                URL.revokeObjectURL(url);
                resolve(canvas2d.toDataURL('image/png'));
            };
            img.onerror = () => {
                URL.revokeObjectURL(url);
                resolve(null);
            };
            img.src = url;
        });
    } catch (error) {
        console.error('Whiteboard capture error:', error);
        return null;
    }
}

/**
 * Alternative: Use tldraw's built-in export if available
 */
export async function captureWhiteboardViaEditor(editor) {
    if (!editor) return null;

    try {
        // Get the current page shapes
        const shapes = editor.getCurrentPageShapes();
        if (shapes.length === 0) {
            return null; // Nothing to capture
        }

        // Export as SVG data URL
        const svg = await editor.getSvg(shapes);
        if (!svg) return null;

        const svgData = new XMLSerializer().serializeToString(svg);
        const base64 = btoa(unescape(encodeURIComponent(svgData)));
        return `data:image/svg+xml;base64,${base64}`;
    } catch (error) {
        console.error('Editor capture error:', error);
        return null;
    }
}
