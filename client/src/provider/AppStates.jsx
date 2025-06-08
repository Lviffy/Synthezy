import { createContext, useContext, useEffect, useState } from "react";
import {
  Circle,
  Line,
  Rectangle,
  Selection,
  Diamond,
  Hand,
  Lock,
  Arrow,
  Pencil,
  Text,
  Image,
} from "../assets/icons";
import { BACKGROUND_COLORS, STROKE_COLORS, STROKE_STYLES } from "../global/var";
import { getElementById, minmax } from "../helper/element";
import useHistory from "../hooks/useHistory";
import { socket } from "../api/socket";

const AppContext = createContext();

const isElementsInLocal = () => {
  try {
    const stored = localStorage.getItem("elements");
    if (!stored) return [];
    const parsed = JSON.parse(stored);
    if (!Array.isArray(parsed)) return [];
    return parsed;
  } catch (err) {
    return [];
  }
};

const initialElements = isElementsInLocal();

export function AppContextProvider({ children }) {
  const [session, setSession] = useState(null);
  const [selectedElement, setSelectedElement] = useState(null);
  const [selectedElements, setSelectedElements] = useState([]);
  const [selectionBounds, setSelectionBounds] = useState(null);
  const [elements, setElements, undo, redo] = useHistory(
    initialElements,
    session
  );
  const [action, setAction] = useState("none");
  const [selectedTool, setSelectedTool] = useState("selection");
  const [translate, setTranslate] = useState({
    x: 0,
    y: 0,
    sx: 0,
    sy: 0,
  });
  const [scale, setScale] = useState(1);
  const [scaleOffset, setScaleOffset] = useState({ x: 0, y: 0 });
  const [lockTool, setLockTool] = useState(false);  const [style, setStyle] = useState({
    strokeWidth: 1.5,
    strokeColor: STROKE_COLORS[0],
    strokeStyle: STROKE_STYLES[0].slug,
    fill: BACKGROUND_COLORS[0],
    opacity: 100,
  });  const [showGrid, setShowGrid] = useState(true);
  const [textInputMode, setTextInputMode] = useState(null);
  const [isZooming, setIsZooming] = useState(false);
  // Zoom configuration
  const ZOOM_LIMITS = {
    min: 0.05,
    max: 50,
    step: 0.1,
    fastStep: 0.5
  };

  // Touch state for pinch-to-zoom
  const [touchState, setTouchState] = useState({
    lastDistance: 0,
    lastScale: 1,
    initialTouches: null
  });

  useEffect(() => {
    if (session == null) {
      localStorage.setItem("elements", JSON.stringify(elements));
    }

    if (!getElementById(selectedElement?.id, elements)) {
      setSelectedElement(null);
    }
  }, [elements, session, selectedElement]);

  // Smooth zoom animation function
  const animateZoom = (targetScale, targetTranslate) => {
    if (isZooming) return; // Prevent multiple animations
    
    setIsZooming(true);
    const startScale = scale;
    const startTranslate = translate;
    const duration = 200; // ms
    const startTime = performance.now();
    
    const animate = (currentTime) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Easing function (ease-out cubic)
      const eased = 1 - Math.pow(1 - progress, 3);
      
      const newScale = startScale + (targetScale - startScale) * eased;
      const newTranslateX = startTranslate.x + (targetTranslate.x - startTranslate.x) * eased;
      const newTranslateY = startTranslate.y + (targetTranslate.y - startTranslate.y) * eased;
      
      setScale(newScale);
      setTranslate(prev => ({
        ...prev,
        x: newTranslateX,
        y: newTranslateY
      }));
      
      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        setIsZooming(false);
      }
    };
    
    requestAnimationFrame(animate);
  };

  // Helper function for touch distance calculation
  const getTouchDistance = (touch1, touch2) => {
    return Math.sqrt(
      Math.pow(touch2.clientX - touch1.clientX, 2) + 
      Math.pow(touch2.clientY - touch1.clientY, 2)
    );
  };
  // Zoom to fit all content within 100% of the canvas viewport
  const zoomToFitContent = () => {
    if (elements.length === 0) {
      onZoom("default");
      return;
    }
    
    // Calculate bounding box of all elements
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    
    elements.forEach(element => {
      const { x1, y1, x2, y2 } = element;
      
      // Handle draw tool elements with points
      if (element.tool === "draw" && element.points && element.points.length > 0) {
        element.points.forEach(point => {
          minX = Math.min(minX, point.x);
          minY = Math.min(minY, point.y);
          maxX = Math.max(maxX, point.x);
          maxY = Math.max(maxY, point.y);
        });
      } else {
        minX = Math.min(minX, x1, x2);
        minY = Math.min(minY, y1, y2);
        maxX = Math.max(maxX, x1, x2);
        maxY = Math.max(maxY, y1, y2);
      }
    });
    
    // Add comfortable padding around content (5% of content size or minimum 50px)
    const contentWidth = maxX - minX;
    const contentHeight = maxY - minY;
    const paddingX = Math.max(contentWidth * 0.05, 50);
    const paddingY = Math.max(contentHeight * 0.05, 50);
    
    const totalContentWidth = contentWidth + paddingX * 2;
    const totalContentHeight = contentHeight + paddingY * 2;
    
    // Get actual canvas dimensions
    const canvasWidth = window.innerWidth;
    const canvasHeight = window.innerHeight;
    
    // Calculate scale to fit content exactly within 100% of canvas
    const scaleX = canvasWidth / totalContentWidth;
    const scaleY = canvasHeight / totalContentHeight;
    const targetScale = Math.min(scaleX, scaleY, 1); // Don't zoom in beyond 100%
    
    // Calculate translation to center content perfectly in viewport
    const contentCenterX = (minX + maxX) / 2;
    const contentCenterY = (minY + maxY) / 2;
    const canvasCenterX = canvasWidth / 2;
    const canvasCenterY = canvasHeight / 2;
    
    const targetTranslateX = (canvasCenterX / targetScale) - contentCenterX;
    const targetTranslateY = (canvasCenterY / targetScale) - contentCenterY;
    
    animateZoom(targetScale, { 
      x: targetTranslateX, 
      y: targetTranslateY,
      sx: translate.sx,
      sy: translate.sy
    });
  };
  const onZoom = (delta, mouseX = null, mouseY = null, options = {}) => {
    const { isFastZoom = false, animate = false } = options;
    
    if (delta === "default") {
      if (animate) {
        animateZoom(1, { x: 0, y: 0, sx: 0, sy: 0 });
      } else {
        setScale(1);
        setTranslate({ x: 0, y: 0, sx: 0, sy: 0 });
      }
      return;
    }

    if (delta === "fit") {
      zoomToFitContent();
      return;
    }
    
    const zoomStep = isFastZoom ? ZOOM_LIMITS.fastStep : ZOOM_LIMITS.step;
    const actualDelta = typeof delta === 'number' ? delta : (delta > 0 ? zoomStep : -zoomStep);
    const targetScale = minmax(scale + actualDelta, [ZOOM_LIMITS.min, ZOOM_LIMITS.max]);
    
    // Prevent unnecessary updates if already at limit
    if (Math.abs(targetScale - scale) < 0.001) return;
    
    let targetTranslate = translate;
    
    // If mouse position is provided, zoom toward the cursor position
    if (mouseX !== null && mouseY !== null) {
      // Convert mouse position to world coordinates before zoom
      const worldX = (mouseX - translate.x * scale + scaleOffset.x) / scale;
      const worldY = (mouseY - translate.y * scale + scaleOffset.y) / scale;
      
      // Calculate new translation to keep the world point under the cursor
      const newTranslateX = (mouseX - worldX * targetScale + scaleOffset.x) / targetScale;
      const newTranslateY = (mouseY - worldY * targetScale + scaleOffset.y) / targetScale;

      targetTranslate = {
        ...translate,
        x: newTranslateX,
        y: newTranslateY,
      };
    }
    
    if (animate) {
      animateZoom(targetScale, targetTranslate);
    } else {
      setScale(targetScale);
      setTranslate(targetTranslate);
    }
  };

  // Touch handlers for pinch-to-zoom
  const handleTouchStart = (event) => {
    if (event.touches.length === 2) {
      const distance = getTouchDistance(event.touches[0], event.touches[1]);
      setTouchState({
        lastDistance: distance,
        lastScale: scale,
        initialTouches: {
          touch1: { x: event.touches[0].clientX, y: event.touches[0].clientY },
          touch2: { x: event.touches[1].clientX, y: event.touches[1].clientY }
        }
      });
    }
  };

  const handleTouchMove = (event) => {
    if (event.touches.length === 2 && touchState.initialTouches) {
      event.preventDefault();
      
      const currentDistance = getTouchDistance(event.touches[0], event.touches[1]);
      const scaleRatio = currentDistance / touchState.lastDistance;
      const newScale = minmax(touchState.lastScale * scaleRatio, [ZOOM_LIMITS.min, ZOOM_LIMITS.max]);
      
      // Get center point of pinch gesture
      const centerX = (event.touches[0].clientX + event.touches[1].clientX) / 2;
      const centerY = (event.touches[0].clientY + event.touches[1].clientY) / 2;
      
      onZoom(newScale - scale, centerX, centerY);
    }
  };

  const handleTouchEnd = () => {
    setTouchState({
      lastDistance: 0,
      lastScale: 1,
      initialTouches: null
    });
  };

  const toolAction = (slug) => {
    if (slug == "lock") {
      setLockTool((prevState) => !prevState);
      return;
    }
    setSelectedTool(slug);
  };

  const tools = [
    [
      {
        slug: "lock",
        icon: Lock,
        title: "Keep selected tool active after drawing",
        toolAction,
      },
    ],
    [
      {
        slug: "hand",
        icon: Hand,
        title: "Hand",
        toolAction,
      },
      {
        slug: "selection",
        icon: Selection,
        title: "Selection",
        toolAction,
      },
      {
        slug: "rectangle",
        icon: Rectangle,
        title: "Rectangle",
        toolAction,
      },
      {
        slug: "diamond",
        icon: Diamond,
        title: "Diamond",
        toolAction,
      },
      {
        slug: "circle",
        icon: Circle,
        title: "Circle",
        toolAction,
      },
      {
        slug: "arrow",
        icon: Arrow,
        title: "Arrow",
        toolAction,
      },      {
        slug: "line",
        icon: Line,
        title: "Line",
        toolAction,
      },
      {
        slug: "draw",
        icon: Pencil,
        title: "Draw",
        toolAction,
      },      {
        slug: "text",
        icon: Text,
        title: "Add Text • Click anywhere to start typing • Press T for quick access • Supports multi-line text",
        toolAction,
      },
      {
        slug: "image",
        icon: Image,
        title: "Insert Image",
        toolAction,
      },
    ],
  ];

  useEffect(() => {
    if (session) {
      socket.on("setElements", (data) => {
        setElements(data, true, false);
      });
    }
  }, [session]);
  return (
    <AppContext.Provider
      value={{
        action,
        setAction,
        tools,
        selectedTool,
        setSelectedTool,
        elements,
        setElements,
        translate,
        setTranslate,
        scale,
        setScale,
        onZoom,
        zoomToFitContent,
        scaleOffset,
        setScaleOffset,
        lockTool,
        setLockTool,
        style,
        setStyle,
        selectedElement,
        setSelectedElement,
        selectedElements,
        setSelectedElements,
        selectionBounds,
        setSelectionBounds,
        undo,
        redo,
        session,        setSession,
        showGrid,
        setShowGrid,
        textInputMode,
        setTextInputMode,
        handleTouchStart,
        handleTouchMove,
        handleTouchEnd,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useAppContext() {
  return useContext(AppContext);
}
