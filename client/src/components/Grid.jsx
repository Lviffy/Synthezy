import { useEffect, useRef } from 'react';
import { useAppContext } from "../hooks/useAppContext.js";
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
    
    // Adaptive grid size based on zoom level
    let gridSize = 25;
    if (scale < 0.25) {
      gridSize = 100; // Larger grid when zoomed out
    } else if (scale < 0.5) {
      gridSize = 50;
    } else if (scale > 4) {
      gridSize = 12.5; // Smaller grid when zoomed in
    } else if (scale > 2) {
      gridSize = 20;
    }
    
    // Fade out grid when zoomed out too much
    const opacity = Math.min(0.8, Math.max(0.1, scale * 0.6));
    const dotColor = `rgba(160, 160, 160, ${opacity})`;
    
    // Calculate the grid offset using the same logic as the main canvas
    const translateX = translate.x * scale - scaleOffset.x;
    const translateY = translate.y * scale - scaleOffset.y;
    
    // Calculate the scaled grid size
    const scaledGridSize = gridSize * scale;
    
    // Skip drawing if grid is too small to be useful
    if (scaledGridSize < 5) return;
    
    // Calculate the starting position for dots based on translation
    const startX = translateX % scaledGridSize;
    const startY = translateY % scaledGridSize;
    
    // Calculate how many dots we need to draw
    const dotsX = Math.ceil(width / scaledGridSize) + 2;
    const dotsY = Math.ceil(height / scaledGridSize) + 2;
    
    // Adjust dot radius based on scale (but with limits for visibility)
    const baseDotRadius = scale > 1 ? 1.5 : 1.2;
    const adjustedDotRadius = Math.max(0.5, Math.min(3, baseDotRadius * Math.pow(scale, 0.3)));
    
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
