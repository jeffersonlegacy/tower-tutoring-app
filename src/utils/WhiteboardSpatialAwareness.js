/**
 * WhiteboardSpatialAwareness.js - V2.0 Semantic Spatial Engine
 * Utility to extract structured spatial data from the Tldraw store.
 * This data helps the AI understand the layout of the student's work.
 * 
 * V2.0 Enhancements:
 * - Semantic clustering (groups nearby shapes into problem regions)
 * - Enhanced text extraction
 * - Temporal tracking (active work region)
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

/**
 * V2.0: Cluster shapes into semantic problem groups
 * Groups shapes that are spatially close together.
 */
export function clusterShapesIntoProblemGroups(editor) {
    if (!editor) return [];
    
    const shapes = editor.getCurrentPageShapes();
    if (shapes.length === 0) return [];
    
    // Get bounds for all shapes
    const shapeData = shapes.map(shape => {
        const bounds = editor.getShapePageBounds(shape);
        if (!bounds) return null;
        return {
            id: shape.id,
            type: shape.type,
            text: shape.props?.text || '',
            centroid: { x: bounds.x + bounds.w / 2, y: bounds.y + bounds.h / 2 },
            bounds
        };
    }).filter(Boolean);
    
    // Simple clustering: group shapes within 200px of each other
    const CLUSTER_RADIUS = 200;
    const clusters = [];
    const assigned = new Set();
    
    shapeData.forEach((shape, i) => {
        if (assigned.has(i)) return;
        
        const cluster = [shape];
        assigned.add(i);
        
        // Find neighbors
        shapeData.forEach((other, j) => {
            if (i === j || assigned.has(j)) return;
            const dx = shape.centroid.x - other.centroid.x;
            const dy = shape.centroid.y - other.centroid.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance < CLUSTER_RADIUS) {
                cluster.push(other);
                assigned.add(j);
            }
        });
        
        clusters.push(cluster);
    });
    
    return clusters.map((cluster, i) => ({
        id: `problem_${i + 1}`,
        shapes: cluster,
        textContent: cluster.filter(s => s.text).map(s => s.text).join(' '),
        itemCount: cluster.length
    }));
}

/**
 * V2.0: Enhanced spatial summary with problem groups
 */
export function getEnhancedSpatialSummary(editor) {
    if (!editor) return "Board state unknown.";
    
    const shapes = editor.getCurrentPageShapes();
    if (shapes.length === 0) return "The whiteboard is currently empty.";
    
    const clusters = clusterShapesIntoProblemGroups(editor);
    const basicSummary = getSpatialSummary(editor);
    
    let enhanced = basicSummary;
    
    if (clusters.length > 1) {
        enhanced += `\n[PROBLEM_CLUSTERS: ${clusters.length} distinct work areas detected]\n`;
        clusters.forEach(c => {
            enhanced += `- ${c.id.toUpperCase()}: ${c.itemCount} items`;
            if (c.textContent) enhanced += ` (contains: "${c.textContent.substring(0, 50)}...")`;
            enhanced += '\n';
        });
    }
    
    return enhanced;
}
