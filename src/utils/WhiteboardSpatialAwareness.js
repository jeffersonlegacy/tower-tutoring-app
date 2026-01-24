/**
 * WhiteboardSpatialAwareness.js
 * Utility to extract structured spatial data from the Tldraw store.
 * This data helps the AI understand the layout of the student's work.
 */

export function getSpatialSummary(editor) {
    if (!editor) return null;

    const shapes = editor.getCurrentPageShapes();
    const viewport = editor.getViewportPageBounds();
    
    if (shapes.length === 0) return "The whiteboard is currently empty.";

    // Group shapes by general region
    const regions = {
        'top-left': [],
        'top-right': [],
        'bottom-left': [],
        'bottom-right': [],
        'center': []
    };

    const summary = shapes.map(shape => {
        const bounds = editor.getShapePageBounds(shape);
        if (!bounds) return null;

        // Calculate relative position (0-100) within current viewport
        const relX = ((bounds.x - viewport.x) / viewport.w) * 100;
        const relY = ((bounds.y - viewport.y) / viewport.h) * 100;

        let region = 'center';
        if (relX < 40 && relY < 40) region = 'top-left';
        else if (relX > 60 && relY < 40) region = 'top-right';
        else if (relX < 40 && relY > 60) region = 'bottom-left';
        else if (relX > 60 && relY > 60) region = 'bottom-right';

        const info = {
            id: shape.id,
            type: shape.type,
            text: shape.props?.text || '',
            region,
            pos: { x: Math.round(relX), y: Math.round(relY) }
        };
        
        regions[region].push(info);
        return info;
    }).filter(Boolean);

    // Build a text description for the AI
    let textSummary = `[BOARD_STATE: ${shapes.length} items visible]\n`;
    
    Object.entries(regions).forEach(([name, items]) => {
        if (items.length > 0) {
            textSummary += `- ${name.toUpperCase()}: ${items.map(i => {
                let desc = i.type;
                if (i.text) desc += ` ("${i.text.substring(0, 30)}")`;
                return desc;
            }).join(', ')}\n`;
        }
    });

    return textSummary;
}
