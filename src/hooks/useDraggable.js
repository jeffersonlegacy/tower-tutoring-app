import { useState, useRef, useEffect } from 'react';

export function useDraggable(initialPosition = { x: 0, y: 0 }) {
    const [position, setPosition] = useState(initialPosition);
    const [isDragging, setIsDragging] = useState(false);
    const dragOffset = useRef({ x: 0, y: 0 });

    const handleDragStart = (e) => {
        const clientX = e.clientX || e.touches[0].clientX;
        const clientY = e.clientY || e.touches[0].clientY;
        
        // Calculate offset from top-left of the element
        const rect = e.currentTarget.getBoundingClientRect();
        dragOffset.current = {
            x: clientX - rect.left,
            y: clientY - rect.top
        };
        setIsDragging(true);
    };

    const handleDragMove = (e) => {
        if (!isDragging) return;
        
        const clientX = e.clientX || (e.touches ? e.touches[0].clientX : 0);
        const clientY = e.clientY || (e.touches ? e.touches[0].clientY : 0);
        
        // Prevent default to stop scrolling on touch devices while dragging
        if (e.cancelable && e.type === 'touchmove') {
            e.preventDefault();
        }
        
        setPosition({
            x: clientX - dragOffset.current.x,
            y: clientY - dragOffset.current.y
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
            position: 'fixed',
            left: `${position.x}px`,
            top: `${position.y}px`,
            zIndex: 50,
            cursor: isDragging ? 'grabbing' : 'grab',
            touchAction: 'none'
        }
    };
}
