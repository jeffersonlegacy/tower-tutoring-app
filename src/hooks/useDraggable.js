import { useState, useRef, useEffect } from 'react';

export function useDraggable(initialPosition = { x: 0, y: 0 }, options = {}) {
    const strategy = options.strategy === 'absolute' ? 'absolute' : 'fixed';
    const margin = Number.isFinite(options.margin) ? options.margin : 8;
    const minXOption = Number.isFinite(options.minX) ? options.minX : null;
    const maxXOption = Number.isFinite(options.maxX) ? options.maxX : null;
    const minYOption = Number.isFinite(options.minY) ? options.minY : null;
    const maxYOption = Number.isFinite(options.maxY) ? options.maxY : null;

    const [position, setPosition] = useState(initialPosition);
    const [isDragging, setIsDragging] = useState(false);
    const dragOffset = useRef({ x: 0, y: 0 });
    const dragBounds = useRef({ left: 0, top: 0, width: 0, height: 0, elementW: 0, elementH: 0 });

    const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

    const handleDragStart = (e) => {
        const touch = e.touches?.[0];
        const clientX = e.clientX ?? touch?.clientX ?? 0;
        const clientY = e.clientY ?? touch?.clientY ?? 0;
        
        // Calculate offset from top-left of the element
        const rect = e.currentTarget.getBoundingClientRect();
        dragOffset.current = {
            x: clientX - rect.left,
            y: clientY - rect.top
        };

        // Resolve drag bounds relative to chosen positioning strategy
        if (strategy === 'absolute') {
            const parentRect = e.currentTarget.offsetParent?.getBoundingClientRect?.() || {
                left: 0,
                top: 0,
                width: window.innerWidth,
                height: window.innerHeight,
            };
            dragBounds.current = {
                left: parentRect.left,
                top: parentRect.top,
                width: parentRect.width,
                height: parentRect.height,
                elementW: rect.width,
                elementH: rect.height,
            };
        } else {
            dragBounds.current = {
                left: 0,
                top: 0,
                width: window.innerWidth,
                height: window.innerHeight,
                elementW: rect.width,
                elementH: rect.height,
            };
        }

        setIsDragging(true);
    };

    const handleDragMove = (e) => {
        if (!isDragging) return;
        
        const touch = e.touches?.[0];
        const clientX = e.clientX ?? touch?.clientX ?? 0;
        const clientY = e.clientY ?? touch?.clientY ?? 0;
        
        // Prevent default to stop scrolling on touch devices while dragging
        if (e.cancelable && e.type === 'touchmove') {
            e.preventDefault();
        }

        const {
            left,
            top,
            width,
            height,
            elementW,
            elementH,
        } = dragBounds.current;

        const rawX = strategy === 'absolute'
            ? clientX - dragOffset.current.x - left
            : clientX - dragOffset.current.x;
        const rawY = strategy === 'absolute'
            ? clientY - dragOffset.current.y - top
            : clientY - dragOffset.current.y;

        const hardMinX = minXOption ?? margin;
        const hardMinY = minYOption ?? margin;
        const hardMaxX = Math.max(hardMinX, maxXOption ?? (width - elementW - margin));
        const hardMaxY = Math.max(hardMinY, maxYOption ?? (height - elementH - margin));

        setPosition({
            x: clamp(rawX, hardMinX, hardMaxX),
            y: clamp(rawY, hardMinY, hardMaxY)
        });
    };

    const handleDragEnd = () => setIsDragging(false);

    useEffect(() => {
        if (isDragging) {
            window.addEventListener('mousemove', handleDragMove);
            window.addEventListener('mouseup', handleDragEnd);
            window.addEventListener('touchmove', handleDragMove, { passive: false });
            window.addEventListener('touchend', handleDragEnd);
        }
        return () => {
            window.removeEventListener('mousemove', handleDragMove);
            window.removeEventListener('mouseup', handleDragEnd);
            window.removeEventListener('touchmove', handleDragMove);
            window.removeEventListener('touchend', handleDragEnd);
        };
    }, [isDragging]);

    return {
        position,
        isDragging,
        dragHandlers: {
            onMouseDown: handleDragStart,
            onTouchStart: handleDragStart
        },
        style: {
            position: strategy,
            left: `${position.x}px`,
            top: `${position.y}px`,
            zIndex: 50,
            cursor: isDragging ? 'grabbing' : 'grab',
            touchAction: 'none'
        }
    };
}
