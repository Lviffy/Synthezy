import { useEffect, useRef } from 'react';
import { useAppContext } from '../provider/AppStates';
import useDimension from '../hooks/useDimension';

export default function Grid() {
  const { showGrid, scale, translate, scaleOffset } = useAppContext();
  const canvasRef = useRef(null);
  const dimension = useDimension();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !showGrid) {
      if (canvas) {
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
      return;
    }

    const ctx = canvas.getContext('2d');
    drawGrid(ctx, canvas.width, canvas.height, scale, translate, scaleOffset);
  }, [showGrid, scale, translate.x, translate.y, scaleOffset.x, scaleOffset.y, dimension]);

  const drawGrid = (ctx, width, height, scale, translate, scaleOffset) => {
    ctx.clearRect(0, 0, width, height);
    
    // Grid configuration
    const gridSize = 25; // 25 pixels apart
    const dotRadius = 1.5; // Small circular dots
    const dotColor = 'rgba(160, 160, 160, 0.6)'; // Light gray with transparency
    
    // Calculate the grid offset using the same logic as the main canvas
    const translateX = translate.x * scale - scaleOffset.x;
    const translateY = translate.y * scale - scaleOffset.y;
    
    // Calculate the scaled grid size
    const scaledGridSize = gridSize * scale;
    
    // Calculate the starting position for dots based on translation
    const startX = translateX % scaledGridSize;
    const startY = translateY % scaledGridSize;
    
    // Calculate how many dots we need to draw
    const dotsX = Math.ceil(width / scaledGridSize) + 2;
    const dotsY = Math.ceil(height / scaledGridSize) + 2;
    
    // Adjust dot radius based on scale (but with limits for visibility)
    const adjustedDotRadius = Math.max(0.5, Math.min(3, dotRadius * Math.pow(scale, 0.5)));
    
    // Set dot style
    ctx.fillStyle = dotColor;
    
    // Draw dots
    for (let x = -1; x < dotsX; x++) {
      for (let y = -1; y < dotsY; y++) {
        const dotX = x * scaledGridSize + startX;
        const dotY = y * scaledGridSize + startY;
        
        // Only draw dots that are visible on canvas
        if (dotX >= -adjustedDotRadius && dotX <= width + adjustedDotRadius && 
            dotY >= -adjustedDotRadius && dotY <= height + adjustedDotRadius) {
          ctx.beginPath();
          ctx.arc(dotX, dotY, adjustedDotRadius, 0, 2 * Math.PI);
          ctx.fill();
        }
      }
    }
  };

  return (
    <canvas
      ref={canvasRef}
      width={dimension.width}
      height={dimension.height}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        zIndex: -1,
        pointerEvents: 'none',
      }}
    />
  );
}
