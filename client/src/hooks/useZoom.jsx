import { useRef, useCallback } from 'react';

export default function useZoom() {
  const zoomTimeoutRef = useRef(null);
  const lastZoomTimeRef = useRef(0);

  // Throttle zoom updates for performance
  const throttleZoom = useCallback((callback, delay = 16) => {
    const now = performance.now();
    const timeSinceLastZoom = now - lastZoomTimeRef.current;
    
    if (timeSinceLastZoom >= delay) {
      lastZoomTimeRef.current = now;
      callback();
    } else {
      clearTimeout(zoomTimeoutRef.current);
      zoomTimeoutRef.current = setTimeout(() => {
        lastZoomTimeRef.current = performance.now();
        callback();
      }, delay - timeSinceLastZoom);
    }
  }, []);

  // Calculate zoom step based on current scale for better UX
  const getAdaptiveZoomStep = useCallback((currentScale, direction = 1) => {
    if (currentScale < 0.1) return 0.05 * direction;
    if (currentScale < 0.5) return 0.1 * direction;
    if (currentScale < 1) return 0.15 * direction;
    if (currentScale < 2) return 0.2 * direction;
    if (currentScale < 5) return 0.5 * direction;
    return 1 * direction;
  }, []);

  // Calculate optimal zoom level to fit content in viewport
  const calculateFitZoom = useCallback((contentBounds, viewportSize, padding = 50) => {
    const { minX, minY, maxX, maxY } = contentBounds;
    const contentWidth = maxX - minX + padding * 2;
    const contentHeight = maxY - minY + padding * 2;
    
    if (contentWidth === 0 || contentHeight === 0) return { scale: 1, translate: { x: 0, y: 0 } };
    
    const scaleX = viewportSize.width / contentWidth;
    const scaleY = viewportSize.height / contentHeight;
    const optimalScale = Math.min(scaleX, scaleY, 2); // Don't zoom in beyond 200%
    
    // Calculate translation to center content
    const centerX = (minX + maxX) / 2;
    const centerY = (minY + maxY) / 2;
    const translateX = viewportSize.width / 2 / optimalScale - centerX;
    const translateY = viewportSize.height / 2 / optimalScale - centerY;
    
    return {
      scale: optimalScale,
      translate: { x: translateX, y: translateY }
    };
  }, []);

  // Smooth interpolation for zoom animations
  const easeOutCubic = useCallback((t) => {
    return 1 - Math.pow(1 - t, 3);
  }, []);

  const easeInOutQuad = useCallback((t) => {
    return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
  }, []);

  return {
    throttleZoom,
    getAdaptiveZoomStep,
    calculateFitZoom,
    easeOutCubic,
    easeInOutQuad,
  };
}
