/**
 * useWhiteboardActions.js - AI <-> Tldraw Bridge
 * 
 * Allows the AI to programmably create shapes, text, and annotations 
 * on the whiteboard using the Tldraw Editor SDK.
 */
import { useCallback } from 'react';
import { createShapeId } from '@tldraw/tldraw';

export function useWhiteboardActions() {

    /**
     * mapPosition: Converts partial 0-100 coordinates to actual page pixels
     */
    const mapPosition = useCallback((editor, xPercent, yPercent) => {
        if (!editor) return { x: 0, y: 0 };
        
        // Get common bounds or viewport
        const viewport = editor.getViewportScreenBounds();
        // Fallback to a reasonable default if viewport is weird (e.g. initial load)
        const width = viewport.w || window.innerWidth;
        const height = viewport.h || window.innerHeight;

        // Tldraw infinite canvas starts at 0,0 locally usually, but let's assume
        // we are drawing relative to the current center or viewport.
        // Actually, easiest for AI is "screen percentage" of current view.
        
        const x = viewport.x + (width * (xPercent / 100));
        const y = viewport.y + (height * (yPercent / 100));
        
        return { x, y };
    }, []);

    /**
     * executeAction: Main entry point for AI commands
     */
    const executeAction = useCallback((editor, action) => {
        if (!editor || !action) return;

        console.log('[WhiteboardActions] Executing:', action);

        // Standardize coordinates (AI gives 0-100 usually)
        // usage: start: { x: 50, y: 50 } -> Center of screen
        
        switch (action.type) {
            case 'DRAW_SHAPE':
                drawShape(editor, action);
                break;
            case 'DRAW_TEXT':
                drawText(editor, action);
                break;
            case 'CLEAR':
                editor.selectAll().deleteShapes(editor.getSelectedShapeIds());
                break;
            case 'PAN':
                panCamera(editor, action);
                break;
            case 'CREATE_PAGE':
                createPage(editor, action);
                break;
            case 'MODIFY_AT':
                modifyAt(editor, action);
                break;
            case 'WIPE_REGION':
                wipeRegion(editor, action);
                break;
            default:
                console.warn('[WhiteboardActions] Unknown action type:', action.type);
        }
    }, [mapPosition]);

    /**
     * SMART LOCATOR: Finds a position that doesn't overlap existing shapes.
     * Starts at (targetX, targetY) and spirals/scans outward if blocked.
     */
    const getSmartPosition = (editor, targetX, targetY, width, height) => {
        const shapes = Array.from(editor.getCurrentPageShapeIds()).map(id => editor.getShape(id));
        // Get bounds of all shapes on page
        const occupiedRegions = shapes.map(s => editor.getShapePageBounds(s.id)).filter(b => b);

        const spacing = 20; // Padding
        let x = targetX;
        let y = targetY;
        
        // Simple check: Is the Target Blocked?
        const isBlocked = (tx, ty, w, h) => {
            return occupiedRegions.some(region => {
                return (
                    tx < region.x + region.w &&
                    tx + w > region.x &&
                    ty < region.y + region.h &&
                    ty + h > region.y
                );
            });
        };

        if (!isBlocked(x, y, width, height)) return { x, y };

        // If blocked, try nudging DOWN first (classic writing flow)
        for (let offset = 50; offset < 500; offset += 50) {
            if (!isBlocked(x, y + offset, width, height)) return { x, y: y + offset };
        }

        // If down is blocked (e.g. column full), try RIGHT
        for (let offset = 100; offset < 1000; offset += 100) {
            if (!isBlocked(x + offset, y, width, height)) return { x: x + offset, y }; // New column
        }

        // If heavily congested, just put it deep below everything
        const bottomMost = occupiedRegions.reduce((max, r) => Math.max(max, r.y + r.h), 0);
        return { x, y: bottomMost + 50 };
    };

    const drawShape = (editor, { tool, start, end, color }) => {
        if (!start) return;

        // Convert percentage to page coordinates
        const viewport = editor.getViewportScreenBounds();
        const w = viewport.w;
        const h = viewport.h;

        let x = viewport.x + (w * (start.x / 100));
        let y = viewport.y + (h * (start.y / 100));
        
        let width = 100;
        let height = 100;

        if (end) {
             width = (w * ((end.x - start.x) / 100));
             height = (h * ((end.y - start.y) / 100));
        }

        // SMART NUDGE
        const smartPos = getSmartPosition(editor, x, y, Math.abs(width), Math.abs(height));
        x = smartPos.x;
        y = smartPos.y;

        const id = createShapeId();
        
        // Colors: Tldraw uses 'black', 'grey', 'light-violet', 'violet', 'blue', 'light-blue', 'yellow', 'orange', 'green', 'light-green', 'light-red', 'red'
        // Map common AI colors to these
        const colorMap = {
            cyan: 'light-blue',
            blue: 'blue',
            red: 'red',
            green: 'green',
            orange: 'orange',
            purple: 'violet',
            black: 'black',
            white: 'grey' // visible on dark?
        };
        const tlColor = colorMap[color] || 'light-blue';

        const shapeProps = {
            color: tlColor,
            fill: 'none',
            dash: 'draw'
        };

        if (tool === 'circle' || tool === 'ellipse') {
            editor.createShape({
                id,
                type: 'geo',
                x, y,
                props: { ...shapeProps, geo: 'ellipse', w: Math.abs(width), h: Math.abs(height) },
            });
        }
        else if (tool === 'box' || tool === 'rectangle') {
            editor.createShape({
                id,
                type: 'geo',
                x, y,
                props: { ...shapeProps, geo: 'rectangle', w: Math.abs(width), h: Math.abs(height) },
            });
        }
        else if (tool === 'arrow') {
             // Apples relative vector for updates
             editor.createShape({
                id,
                type: 'arrow',
                x, y,
                props: { ...shapeProps, start: { x: 0, y: 0 }, end: { x: width, y: height } }
            });
        }
        else if (tool === 'line') {
            editor.createShape({
                id,
                type: 'line',
                x, y,
                props: { ...shapeProps, size: 'm', points: [{ x: 0, y: 0 }, { x: width, y: height }] }
            });
        }
    };

    const drawText = (editor, { text, position, color }) => {
        if (!text || !position) return;

        const viewport = editor.getViewportScreenBounds();
        let x = viewport.x + (viewport.w * (position.x / 100));
        let y = viewport.y + (viewport.h * (position.y / 100));

        // Estimate text size for collision (approx 10px char width, 30px line height)
        const approxW = text.length * 8; 
        const approxH = 30;

        const smartPos = getSmartPosition(editor, x, y, approxW, approxH);
        x = smartPos.x;
        y = smartPos.y;

        const id = createShapeId();
        
        editor.createShape({
            id,
            type: 'text',
            x,
            y,
            props: {
                text,
                color: 'blue', // Default text color
                size: 'm',
                scale: 1
            },
        });
    };

    /**
     * Pan camera to a specific region or coordinate
     * action: { position: { x, y } } or { region: 'top-right' }
     */
    const panCamera = (editor, { position, region }) => {
        const viewport = editor.getViewportScreenBounds();
        const w = viewport.w;
        const h = viewport.h;
        let x = viewport.x;
        let y = viewport.y;

        if (position) {
            // Absolute move to percentage
             x = viewport.x + (w * (position.x / 100)) - (w/2); // Center on it
             y = viewport.y + (h * (position.y / 100)) - (h/2);
        } else if (region) {
            // Shift view by one full screen width/height in that direction
            const SHIFT = 0.8; 
            switch(region) {
                case 'right': x += w * SHIFT; break;
                case 'left': x -= w * SHIFT; break;
                case 'up': y -= h * SHIFT; break;
                case 'down': y += h * SHIFT; break;
                case 'new-section': x += w * 1.2; break; // Far jump
            }
        }

        editor.setCamera({ x: -x, y: -y, z: 1 }, { animation: { duration: 1000 } });
    };

   const createPage = (editor, { name }) => {
        const newPageId = editor.createPage({ name: name || 'Explanation' });
        editor.setCurrentPage(newPageId);
    };

    /**
     * GOD MODE: Modify existing shapes at a specific location
     * action: { point: {x,y}, operation: 'delete'|'resize'|'text', value: ... }
     */
    const modifyAt = (editor, { point, operation, value }) => {
        if (!point) return;
        const pos = mapPosition(editor, point.x, point.y);
        
        // Find top-most shape at this point
        const shapes = editor.getShapesAtPoint(pos);
        if (!shapes || shapes.length === 0) return;
        
        // Get the top-most one (usually the last in the list or z-index)
        const target = shapes[shapes.length - 1]; 

        if (operation === 'delete') {
            editor.deleteShapes([target.id]);
        } else if (operation === 'resize') {
            // value is scale factor (e.g. 1.5)
            editor.updateShape({ id: target.id, type: target.type, props: { scale: value || 1.2 } });
        } else if (operation === 'text' && target.type === 'text') {
            editor.updateShape({ id: target.id, type: 'text', props: { text: value } });
        }
    };

    /**
     * CLEANER: Wipe a specific rectangular region
     * region: { x, y, w, h } (Percent)
     */
    const wipeRegion = (editor, { region }) => {
        if (!region) return;
        const viewport = editor.getViewportScreenBounds();
        const x = viewport.x + (viewport.w * (region.x / 100));
        const y = viewport.y + (viewport.h * (region.y / 100));
        const w = viewport.w * (region.w / 100);
        const h = viewport.h * (region.h / 100);

        const shapes = editor.getCurrentPageShapes().filter(s => {
             const b = editor.getShapePageBounds(s);
             return b && 
                b.x >= x && b.x + b.w <= x + w &&
                b.y >= y && b.y + b.h <= y + h;
        });

        if (shapes.length > 0) {
            editor.deleteShapes(shapes.map(s => s.id));
        }
    };

    return { executeAction };
}
