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
            default:
                console.warn('[WhiteboardActions] Unknown action type:', action.type);
        }
    }, [mapPosition]);

    const drawShape = (editor, { tool, start, end, color }) => {
        if (!start) return;

        // Convert percentage to page coordinates
        const viewport = editor.getViewportScreenBounds();
        const w = viewport.w;
        const h = viewport.h;

        const x = viewport.x + (w * (start.x / 100));
        const y = viewport.y + (h * (start.y / 100));

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

        if (tool === 'circle' || tool === 'ellipse') {
            // For circle, we might need a width/height. AI might give 'end' or 'radius'
            // If only start is given, make a default size
            const width = end ? (w * ((end.x - start.x) / 100)) : 100;
            const height = end ? (h * ((end.y - start.y) / 100)) : 100;

            editor.createShape({
                id,
                type: 'geo',
                x,
                y,
                props: {
                    geo: 'ellipse',
                    w: Math.abs(width),
                    h: Math.abs(height),
                    color: tlColor,
                    fill: 'none',
                    dash: 'draw'
                },
            });
        }
        else if (tool === 'box' || tool === 'rectangle') {
            const width = end ? (w * ((end.x - start.x) / 100)) : 150;
            const height = end ? (h * ((end.y - start.y) / 100)) : 100;

            editor.createShape({
                id,
                type: 'geo',
                x,
                y,
                props: {
                    geo: 'rectangle',
                    w: Math.abs(width),
                    h: Math.abs(height),
                    color: tlColor,
                    fill: 'none',
                    dash: 'draw'
                },
            });
        }
        else if (tool === 'arrow') {
            const endX = end ? viewport.x + (w * (end.x / 100)) : x + 100;
            const endY = end ? viewport.y + (h * (end.y / 100)) : y + 50;
            
            editor.createShape({
                id,
                type: 'arrow',
                x, 
                y,
                props: {
                    start: { x: 0, y: 0 },
                    end: { x: endX - x, y: endY - y },
                    color: tlColor,
                    dash: 'draw'
                }
            });
        }
    };

    const drawText = (editor, { text, position, color }) => {
        if (!text || !position) return;

        const viewport = editor.getViewportScreenBounds();
        const x = viewport.x + (viewport.w * (position.x / 100));
        const y = viewport.y + (viewport.h * (position.y / 100));

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
            },
        });
    };

    return { executeAction };
}
