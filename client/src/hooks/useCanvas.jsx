import { useEffect, useLayoutEffect, useRef, useState, useCallback, useMemo } from "react";
import rough from "roughjs"; // Add this import
import { useAppContext } from "../provider/AppStates";
import useDimension from "./useDimension";
import { lockUI } from "../helper/ui";
import {
  draw,
  drawWithAutoResize,
  drawFocuse,
  drawMultiSelection,
  cornerCursor,
  inSelectedCorner,
  drawEraser, // Import drawEraser
} from "../helper/canvas";
import {
  adjustCoordinates,
  arrowMove,
  copyElements,
  createElement,
  deleteElement,
  deleteMultipleElements,
  duplicateElement,
  duplicateMultipleElements,
  getElementById,
  getElementPosition,
  getElementsInSelectionBounds,
  getSelectionBounds,
  minmax,
  moveElement,
  pasteElements,
  resizeValue,
  saveElements,
  updateElement,
  uploadElements,
  isWithinElement, // Add this import
} from "../helper/element";
import useKeys from "./useKeys";
import { PEN_TYPES, PEN_PROPERTIES } from "../global/penStyles"; // Added import

export default function useCanvas() {  const {
    selectedTool,
    setSelectedTool,
    tools,
    toolAction,
    action,
    setAction,
    elements,
    setElements,
    scale,
    onZoom,
    translate,
    setTranslate,
    scaleOffset,
    setScaleOffset,
    lockTool,
    style, // General style for shapes
    selectedElement,
    setSelectedElement,
    selectedElements,
    setSelectedElements,
    selectionBounds,
    setSelectionBounds,
    undo,
    redo,    textInputMode,
    setTextInputMode,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
    contextMenu,
    setContextMenu,
    currentMousePosition,
    setCurrentMousePosition,
    session,
    penProperties, // Added from AppContext
    selectedPen,   // Added from AppContext
  } = useAppContext();
  const canvasRef = useRef(null);
  const lastUpdateTime = useRef(0);
  const keys = useKeys();
  const dimension = useDimension();
  const [isInElement, setIsInElement] = useState(false);
  const [inCorner, setInCorner] = useState(false);
  const [padding, setPadding] = useState(minmax(10 / scale, [0.5, 50]));  const [cursor, setCursor] = useState("default");
  const [mouseAction, setMouseAction] = useState({ x: 0, y: 0 });
  const [initialSelectedElements, setInitialSelectedElements] = useState([]);
  const [resizeOldDementions, setResizeOldDementions] = useState(null)
  const [isDrawing, setIsDrawing] = useState(false);
  
  // Eraser trail state
  const [eraserTrail, setEraserTrail] = useState([]);
  const eraserTrailRef = useRef([]); // Ref to keep track of trail points for animation

  // Smooth translation state for hand tool
  const [smoothTranslate, setSmoothTranslate] = useState({ x: 0, y: 0 });
  const translateAnimationRef = useRef(null);
  const lastTranslateUpdate = useRef(0);
    // Helper function to get tool by number (1-12)
  const getToolByNumber = (number) => {
    let toolCounter = 0;
    for (const toolGroup of tools) {
      for (const tool of toolGroup) {
        toolCounter++;
        if (toolCounter === number) {
          return tool;
        }
      }
    }
    return null;
  };

  // Test function to verify tools array
  const testTools = () => {
    for (let i = 1; i <= 12; i++) {
      const tool = getToolByNumber(i);
    }
  };

  // Call test function once on mount
  useEffect(() => {
    if (tools && tools.length > 0) {
      testTools();
    }
  }, [tools]);

  // Debounced zoom handler to prevent excessive updates
  const debouncedZoom = useMemo(
    () => {
      let timeoutId;
      return (delta, mouseX, mouseY, options = {}) => {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => {
          // Calculate adaptive zoom step based on current scale
          let adaptiveDelta = delta;
          if (typeof delta === 'number') {
            const currentScale = scale;
            if (currentScale < 0.1) {
              adaptiveDelta = delta * 0.5; // Slower zoom when very zoomed out
            } else if (currentScale > 5) {
              adaptiveDelta = delta * 2; // Faster zoom when very zoomed in
            }
          }
          onZoom(adaptiveDelta, mouseX, mouseY, options);
        }, 16); // ~60fps
      };
    },
    [onZoom, scale]
  );

  const mousePosition = ({ clientX, clientY }) => {
    clientX = (clientX - translate.x * scale + scaleOffset.x) / scale;
    clientY = (clientY - translate.y * scale + scaleOffset.y) / scale;
    return { clientX, clientY };
  };

  const handleContextMenu = (event) => {
    event.preventDefault(); // Prevent browser's default context menu
    
    const { clientX, clientY } = mousePosition(event);
    setCurrentMousePosition({ x: clientX, y: clientY });
    
    // Close any existing context menu first
    setContextMenu(null);
    
    // Use screen coordinates for menu positioning
    const screenX = event.clientX;
    const screenY = event.clientY;
    
    // Check if right-clicking on a selected element
    const elementUnderCursor = elements.find(element => {
      const { x1, y1, x2, y2 } = element;
      const minX = Math.min(x1, x2);
      const maxX = Math.max(x1, x2);
      const minY = Math.min(y1, y2);
      const maxY = Math.max(y1, y2);
      
      return clientX >= minX && clientX <= maxX && clientY >= minY && clientY <= maxY;
    });
    
    let contextType = 'canvas';
    
    if (elementUnderCursor) {
      // If we clicked on an element
      if (selectedElements && selectedElements.length > 1 && selectedElements.some(el => el.id === elementUnderCursor.id)) {
        contextType = 'multi';
      } else {
        contextType = 'single';
        // Select the element if it's not already selected
        if (!selectedElement || selectedElement.id !== elementUnderCursor.id) {
          setSelectedElement(elementUnderCursor);
          setSelectedElements([]);
        }
      }
    } else if (selectedElement || (selectedElements && selectedElements.length > 0)) {
      // If we clicked on empty space but have selections
      if (selectedElements && selectedElements.length > 1) {
        contextType = 'multi';
      } else if (selectedElement) {
        contextType = 'single';
      }
    }
    
    // Show context menu with a small delay to ensure proper positioning
    setTimeout(() => {
      setContextMenu({
        x: screenX,
        y: screenY,
        type: contextType
      });
    }, 10);
  };

  const handleMouseDown = (event) => {
    const { clientX, clientY } = mousePosition(event);
    setCurrentMousePosition({ x: clientX, y: clientY });

    if (selectedTool === "eraser") {
      setAction("erasing");
      // Start eraser trail
      eraserTrailRef.current = [{ x: clientX, y: clientY, time: Date.now() }];
      setEraserTrail(eraserTrailRef.current);
      // No element is created for eraser, it acts directly on existing elements
      return;
    }

      // Handle text tool click-to-add (PRIORITY - before lockUI)
    if (selectedTool === "text") {
      // Use direct screen coordinates for fixed positioning
      setTextInputMode({ 
        x: event.clientX, 
        y: event.clientY, 
        canvasX: clientX, 
        canvasY: clientY 
      });
      return;
    }    // Handle sticky note tool click-to-add directly (PRIORITY - before lockUI)
    if (selectedTool === "stickyNote") {
      const element = createElement(
        clientX,
        clientY,
        clientX + 240,
        clientY + 180,
        {
          ...style,
          fill: "#fff3a0", // Default yellow sticky note color
          strokeColor: "#333333", // Default text color
          opacity: 85, // Default translucent
        },
        "stickyNote"
      );      // Add sticky note specific properties with defaults
      element.title = "";
      element.content = "";
      element.noteColor = "#fff3a0";
      element.textColor = "#333333";

      setElements((prevState) => [...prevState, element]);
      
      if (!lockTool) {
        setSelectedTool("selection");
        setSelectedElement(element);
      }
      
      return;
    }

    lockUI(true);if (inCorner) {
      setResizeOldDementions(getElementById(selectedElement.id, elements))
      setElements((prevState) => prevState);
      setMouseAction({ x: clientX, y: clientY }); // Use transformed canvas coordinates
      setCursor(cornerCursor(inCorner.slug));
      setAction(
        "resize-" + inCorner.slug + (event.shiftKey ? "-shiftkey" : "")
      );
      return;
    }

    if (keys.has(" ") || selectedTool == "hand" || event.button == 1) {
      setTranslate((prevState) => ({
        ...prevState,
        sx: clientX,
        sy: clientY,
      }));
      setAction("translate");
      return;
    }

    if (selectedTool == "selection") {
      const element = getElementPosition(clientX, clientY, elements);

      if (element) {
        const offsetX = clientX - element.x1;
        const offsetY = clientY - element.y1;

        if (event.altKey) {
          duplicateElement(element, setElements, setSelectedElement, 0, {
            offsetX,
            offsetY,
          });        } else {
          // Check if element is already in selection
          const isElementSelected = selectedElements && Array.isArray(selectedElements) ? 
            selectedElements.some(sel => sel.id === element.id) : false;
          
          if (event.shiftKey) {
            // Toggle element in selection
            if (isElementSelected) {
              const newSelection = selectedElements.filter(sel => sel.id !== element.id);
              setSelectedElements(newSelection);
              setSelectedElement(newSelection.length > 0 ? newSelection[0] : null);
            } else {
              const currentSelection = selectedElements && Array.isArray(selectedElements) ? selectedElements : [];
              const newSelection = [...currentSelection, element];
              setSelectedElements(newSelection);
              setSelectedElement(element);
            }
            setAction("none"); // Don't start moving when shift-selecting
          } else {
            // If element is already part of multi-selection, move all selected elements
            if (isElementSelected && selectedElements && Array.isArray(selectedElements) && selectedElements.length > 1) {
              // Store initial positions of all selected elements for grouped movement
              setInitialSelectedElements(selectedElements.map(el => {
                const currentEl = getElementById(el.id, elements);
                return currentEl ? { ...currentEl } : el;
              }));
              setSelectedElement({ ...element, offsetX, offsetY });
              setMouseAction({ x: clientX, y: clientY }); // Store initial canvas coordinates
              setAction("move");
            } else {
              // Single selection and move - clear multi-selection first
              setSelectedElements([element]);
              setSelectedElement({ ...element, offsetX, offsetY });
              setMouseAction({ x: clientX, y: clientY }); // Store initial canvas coordinates
              setInitialSelectedElements([]); // Clear any previous multi-selection state
              setAction("move");
            }
          }
        }
      } else {
        // Start marquee selection
        if (!event.shiftKey) {
          setSelectedElement(null);
          setSelectedElements([]);
        }
        setSelectionBounds({ x1: clientX, y1: clientY, x2: clientX, y2: clientY });
        setAction("selecting");      }      return;
    }

    // Handle image tool click-to-upload
    if (selectedTool === "image") {
      const fileInput = document.createElement("input");
      fileInput.type = "file";
      fileInput.accept = "image/*";
      fileInput.onchange = (e) => {
        const file = e.target.files[0];
        if (file) {
          const reader = new FileReader();
          reader.onload = (event) => {
            const img = new Image();
            img.onload = () => {
              const element = createElement(
                clientX,
                clientY,
                clientX + img.width,
                clientY + img.height,
                style,
                selectedTool
              );
              element.imageData = event.target.result;
              element.imageUrl = event.target.result;
              element.naturalWidth = img.width;
              element.naturalHeight = img.height;
              setElements((prevState) => [...prevState, element]);
              if (!lockTool) {
                setSelectedTool("selection");
                setSelectedElement(element);
              }
            };
            img.src = event.target.result;
          };
          reader.readAsDataURL(file);
        }
      };
      fileInput.click();
      return;
    }

    setAction("draw");
    
    // Handle draw tool for freehand drawing
    if (selectedTool === "draw") {
      setIsDrawing(true);
      
      const elementProperties = {
        ...penProperties, // All properties like strokeColor, width, opacity, lineCap, smoothing etc.
        penType: selectedPen, // Explicitly store the type of pen used for this element
      };

      const element = createElement(
        clientX,
        clientY,
        clientX,
        clientY,
        elementProperties, // Pass the combined pen properties
        selectedTool // This sets element.tool = "draw"
      );
      // Add points for freehand drawing
      element.points = [{ x: clientX, y: clientY }];
      // TODO: Handle Laser pen non-persistence later
      setElements((prevState) => [...prevState, element]);

    } else {
      // Regular shape drawing (uses global style)
      const element = createElement(
        clientX,
        clientY,
        clientX,
        clientY,
        style, 
        selectedTool
      );
      setElements((prevState) => [...prevState, element]);
    }
  };  const handleMouseMove = (event) => {
    try {
      // Smart throttling: more responsive during collaboration, balanced for solo use
      const now = performance.now();
      const isCollaborating = !!session;
      const throttleInterval = isCollaborating ? 8 : 12; // Faster throttling for more responsive dragging
      
      // Reduce throttling during move operations for smoother dragging
      const isMoving = action === "move";
      const moveThrottleInterval = isCollaborating ? 4 : 8;
      const currentThrottle = isMoving ? moveThrottleInterval : throttleInterval;
      
      if (now - lastUpdateTime.current < currentThrottle) {
        return;
      }
      lastUpdateTime.current = now;
      
      const { clientX, clientY } = mousePosition(event);

    // Update current mouse position for paste functionality
    setCurrentMousePosition({ x: clientX, y: clientY });

    if (action === "erasing" && selectedTool === "eraser") {
      // Add point to eraser trail for animation
      const currentTime = Date.now();
      eraserTrailRef.current = [
        ...eraserTrailRef.current,
        { x: clientX, y: clientY, time: currentTime },
      ].filter(p => currentTime - p.time < 500); // Keep points for 500ms
      setEraserTrail(eraserTrailRef.current);

      // Perform erasing logic
      const elementsToKeep = [];
      let wasElementErased = false;
      elements.forEach(element => {
        // For 'draw' elements, check if any point is near the eraser path
        if (element.tool === "draw" && element.points && element.points.length > 0) {
          const distanceToEraser = element.points.some(p => 
            Math.sqrt(Math.pow(p.x - clientX, 2) + Math.pow(p.y - clientY, 2)) < (element.strokeWidth / 2 + 10) // 10 is eraser radius
          );
          if (distanceToEraser) {
            wasElementErased = true;
            // Potentially, for partial erase of drawn lines, one might modify points here
            // For now, we erase the whole element if any part is touched
          } else {
            elementsToKeep.push(element);
          }
        } else {
          // For other shapes, check if eraser is within their bounding box
          // More precise collision (e.g. isWithinElement) can be used here
          const { x1, y1, x2, y2 } = element;
          const eraserRadius = 10; // Effective radius of the eraser
          const withinX = clientX > Math.min(x1,x2) - eraserRadius && clientX < Math.max(x1,x2) + eraserRadius;
          const withinY = clientY > Math.min(y1,y2) - eraserRadius && clientY < Math.max(y1,y2) + eraserRadius;

          if (withinX && withinY && isWithinElement(clientX, clientY, element)) { // Use isWithinElement for better accuracy
            wasElementErased = true;
          } else {
            elementsToKeep.push(element);
          }
        }
      });

      if (wasElementErased) {
        setElements(elementsToKeep);
      }
      return; // Prevent other mouse move actions when erasing
    }

    if (selectedElement) {
      setInCorner(
        inSelectedCorner(
          getElementById(selectedElement.id, elements),
          clientX,
          clientY,
          padding,
          scale
        )
      );
    }

    if (getElementPosition(clientX, clientY, elements)) {
      setIsInElement(true);
    } else {
      setIsInElement(false);
    }    if (action == "draw") {
      const element = elements.at(-1); // Get the current element being drawn
      if (!element) return; // Should not happen if isDrawing is true
      const { id } = element;
      
      if (selectedTool === "draw" && isDrawing) {
        // Add point to freehand path
        // Ensure element.points exists and is an array
        const currentPoints = element.points || [];
        const newPoints = [...currentPoints, { x: clientX, y: clientY }];
        
        // Update element with new points and adjust bounding box (x2, y2)
        // The bounding box for 'draw' elements is derived from points in canvas.js,
        // but x2, y2 can be used for rough culling or initial bounds.
        updateElement(
          id,
          { 
            points: newPoints, 
            x2: clientX, // Update x2 and y2 to expand the bounding box
            y2: clientY  // if necessary, though min/max of points is more accurate
          },
          setElements,
          true
        );
      } else if (selectedTool !== "draw") { // For regular shapes being drawn
        // Regular shape drawing
        updateElement(
          id,
          { x2: clientX, y2: clientY },
          setElements,
          true
        );
      }
    } else if (action == "selecting") {
      // Update marquee selection bounds
      setSelectionBounds(prev => ({
        ...prev,
        x2: clientX,
        y2: clientY
      }));    } else if (action == "move") {      if (selectedElements && Array.isArray(selectedElements) && selectedElements.length > 1 && initialSelectedElements && Array.isArray(initialSelectedElements) && initialSelectedElements.length > 0) {        // Multi-element movement: calculate delta from initial mouse position
        const deltaX = clientX - mouseAction.x;
        const deltaY = clientY - mouseAction.y;

        // Batch update all selected elements at once to prevent race conditions
        setElements((prevState) => {
          // Additional safety check to prevent crashes during heavy dragging
          if (!prevState || !Array.isArray(prevState)) {
            return prevState;
          }
          
          return prevState.map((element) => {
            if (!element || !element.id) return element;
            
            const initialElement = initialSelectedElements.find(init => init && init.id === element.id);
            if (initialElement) {
              // Ensure coordinates are valid numbers
              const validX1 = isFinite(initialElement.x1) ? initialElement.x1 : element.x1;
              const validY1 = isFinite(initialElement.y1) ? initialElement.y1 : element.y1;
              const validX2 = isFinite(initialElement.x2) ? initialElement.x2 : element.x2;
              const validY2 = isFinite(initialElement.y2) ? initialElement.y2 : element.y2;
              
              const updatedElement = {
                ...element,
                x1: validX1 + deltaX,
                y1: validY1 + deltaY,
                x2: validX2 + deltaX,
                y2: validY2 + deltaY
              };
              
              // For draw tool elements, also move all points in the drawing path
              if (element.tool === "draw" && initialElement.points && Array.isArray(initialElement.points) && initialElement.points.length > 0) {
                updatedElement.points = initialElement.points.map(point => ({
                  x: point.x + deltaX,
                  y: point.y + deltaY
                }));
              }
              
              return updatedElement;
            }
            return element;
          });
        });        // Update selectedElements positions in real-time during drag to clear past position blue marks
        setSelectedElements(prevSelected => 
          prevSelected.map(selectedEl => {
            const initialElement = initialSelectedElements.find(init => init && init.id === selectedEl.id);
            if (initialElement) {
              // Ensure coordinates are valid numbers
              const validX1 = isFinite(initialElement.x1) ? initialElement.x1 : selectedEl.x1;
              const validY1 = isFinite(initialElement.y1) ? initialElement.y1 : selectedEl.y1;
              const validX2 = isFinite(initialElement.x2) ? initialElement.x2 : selectedEl.x2;
              const validY2 = isFinite(initialElement.y2) ? initialElement.y2 : selectedEl.y2;
              
              const updatedSelectedElement = {
                ...selectedEl,
                x1: validX1 + deltaX,
                y1: validY1 + deltaY,
                x2: validX2 + deltaX,
                y2: validY2 + deltaY
              };
              
              // For draw tool elements, also move all points in the selected element
              if (selectedEl.tool === "draw" && initialElement.points && Array.isArray(initialElement.points) && initialElement.points.length > 0) {
                updatedSelectedElement.points = initialElement.points.map(point => ({
                  x: point.x + deltaX,
                  y: point.y + deltaY
                }));
              }
              
              return updatedSelectedElement;
            }
            return selectedEl;
          })
        );} else {
        // Single element movement
        const { offsetX, offsetY } = selectedElement;
        const currentX = clientX - offsetX;
        const currentY = clientY - offsetY;
        const element = getElementById(selectedElement.id, elements);
        
        if (element) {
          const deltaX = currentX - element.x1;
          const deltaY = currentY - element.y1;
          
          // Use moveElement to handle all element types including draw tools
          const movedElement = moveElement(element, deltaX, deltaY);
          
          updateElement(
            element.id,
            movedElement,
            setElements,
            true
          );
        }
      }    } else if (action == "translate") {
      const now = performance.now();
      const isCollaborating = !!session;
      const translateThrottle = isCollaborating ? 12 : 16; // More responsive during collaboration
      
      // Throttle translate updates for smooth dragging
      if (now - lastTranslateUpdate.current < translateThrottle) {
        return;
      }
      lastTranslateUpdate.current = now;
      
      const x = clientX - translate.sx;
      const y = clientY - translate.sy;

      // Use requestAnimationFrame for smooth translate updates
      if (translateAnimationRef.current) {
        cancelAnimationFrame(translateAnimationRef.current);
      }
      
      translateAnimationRef.current = requestAnimationFrame(() => {
        setTranslate((prevState) => ({
          ...prevState,
          x: prevState.x + x,
          y: prevState.y + y,
        }));
      });
    }else if (action.startsWith("resize")) {
      const resizeCorner = action.slice(7, 9);
      const resizeType = action.slice(10) || "default";
      const s_element = getElementById(selectedElement.id, elements);

      updateElement(
        s_element.id,
        resizeValue(resizeCorner, resizeType, clientX, clientY, padding, s_element, mouseAction, resizeOldDementions),
        setElements,
        true
      );
    }
    } catch (error) {
      console.error('Error in handleMouseMove:', error);
      // Gracefully handle the error by resetting action if needed
      if (action === "move") {
        setAction("none");
        lockUI(false);
      }
    }
  };

  const handleMouseUp = (event) => {
    lockUI(false);
    setTextInputMode(null); // Clear text input mode on mouse up

    const currentAction = action; // Capture action before it's reset
    const currentSelectedTool = selectedTool; // Capture selectedTool
    const currentSelectedPen = selectedPen; // Capture selectedPen

    if (currentAction === "erasing" && selectedTool === "eraser") {
      // Clear eraser trail on mouse up
      eraserTrailRef.current = [];
      setEraserTrail([]);
      if (!lockTool) {
        setSelectedTool("selection");
      }
      setAction("none");
      return;
    }

    if (currentAction === "draw") {
      const drawnElement = elements.at(-1);

      if (currentSelectedTool === "draw" && currentSelectedPen === PEN_TYPES.LASER) {
        if (drawnElement && drawnElement.id && drawnElement.tool === "draw" && drawnElement.penType === PEN_TYPES.LASER) {
          const duration = drawnElement.laserDuration || 
                           (penProperties && penProperties[PEN_PROPERTIES.LASER_DURATION]) || 
                           2000; // Fallback duration
          
          setTimeout(() => {
            setElements((prevElements) =>
              prevElements.filter((el) => el.id !== drawnElement.id)
            );
          }, duration);
        }
      }
      
      // If not locked, switch back to selection tool
      if (!lockTool) {
        setSelectedTool("selection");
        // Don't select the element if it's a laser pen stroke that will vanish
        if (currentSelectedTool === "draw" && currentSelectedPen === PEN_TYPES.LASER) {
          setSelectedElement(null);
        } else if (drawnElement) {
          setSelectedElement(drawnElement);
        }
      }
    } else if (currentAction === "selecting") {
      // Finalize marquee selection
      if (selectionBounds) {
        const selectedInBounds = getElementsInSelectionBounds(elements, selectionBounds);
        if (event.shiftKey) {
          // Add to existing selection
          const newSelection = [...(selectedElements || [])];
          selectedInBounds.forEach(element => {
            if (!newSelection.some(sel => sel.id === element.id)) {
              newSelection.push(element);
            }
          });
          setSelectedElements(newSelection);
          setSelectedElement(newSelection.length > 0 ? newSelection[0] : null);
        } else {
          // Replace selection
          setSelectedElements(selectedInBounds);
          setSelectedElement(selectedInBounds.length > 0 ? selectedInBounds[0] : null);
        }
      }
      setSelectionBounds(null);
      setAction("none");
      lockUI(false);
      return;
    }
    
    setAction("none");
    lockUI(false);    // Clear initial positions after movement
    if (currentAction == "move") {
      setInitialSelectedElements([]);
      // Update selectedElements to reflect final positions after group movement
      if (selectedElements && Array.isArray(selectedElements) && selectedElements.length > 1) {
        const updatedElements = selectedElements.map(sel => {
          const currentElement = getElementById(sel.id, elements);
          return currentElement || sel;
        });
        setSelectedElements(updatedElements);
      }
    }

    // Only revert if no actual movement occurred AND it's not a multi-selection drag
    const { clientX, clientY } = mousePosition(event);
    if (clientX == mouseAction.x && clientY == mouseAction.y && currentAction !== "move") {
      setElements("prevState");
      return;    }

    if (currentAction == "draw") {
      if (selectedTool === "draw") {
        setIsDrawing(false);
        // Finalize freehand drawing
        const lastElement = elements.at(-1);
        if (lastElement && lastElement.points && lastElement.points.length > 1) {
          // Calculate bounding box from points
          const xCoords = lastElement.points.map(p => p.x);
          const yCoords = lastElement.points.map(p => p.y);
          const minX = Math.min(...xCoords);
          const maxX = Math.max(...xCoords);
          const minY = Math.min(...yCoords);
          const maxY = Math.max(...yCoords);
            updateElement(
            lastElement.id,
            { x1: minX, y1: minY, x2: maxX, y2: maxY },
            setElements,
            true
          );
        }      } else {
        // Regular shape drawing
        const lastElement = elements.at(-1);
        const { id, x1, y1, x2, y2 } = adjustCoordinates(lastElement);
        updateElement(id, { x1, x2, y1, y2 }, setElements, /* elements, */ false);
      }
      
      if (!lockTool) {
        setSelectedTool("selection");
        setSelectedElement(elements.at(-1));
      }
    }    if (currentAction.startsWith("resize")) {
      const { id, x1, y1, x2, y2 } = adjustCoordinates(
        getElementById(selectedElement.id, elements)
      );
      updateElement(id, { x1, x2, y1, y2 }, setElements, /* elements, */ false);
    }
  };  // Momentum scrolling state
  const [momentum, setMomentum] = useState({ x: 0, y: 0 });
  const momentumRef = useRef({ x: 0, y: 0 });
  const lastWheelTime = useRef(0);

  // Enhanced wheel handler with momentum and better zoom detection
  const handleWheel = useCallback((event) => {
    const now = performance.now();
    const timeDelta = now - lastWheelTime.current;
    lastWheelTime.current = now;

    // Detect if this is a zoom gesture (Ctrl+wheel or pinch on trackpad)
    const isZoomGesture = event.ctrlKey || event.metaKey || 
                         (Math.abs(event.deltaY) > 0 && event.deltaX === 0 && event.deltaZ === 0);
    
    if (isZoomGesture) {
      event.preventDefault();
      
      // More sensitive zoom calculation for precise control
      let zoomFactor = -event.deltaY * 0.001;
      
      // Adjust zoom sensitivity based on deltaMode
      if (event.deltaMode === 1) { // DOM_DELTA_LINE
        zoomFactor *= 16;
      } else if (event.deltaMode === 2) { // DOM_DELTA_PAGE
        zoomFactor *= 400;
      }
      
      // Get mouse position relative to the canvas
      const rect = canvasRef.current?.getBoundingClientRect();
      if (rect) {
        const mouseX = event.clientX - rect.left;
        const mouseY = event.clientY - rect.top;
        
        // Use debounced zoom for smooth performance
        debouncedZoom(zoomFactor, mouseX, mouseY);
      }
      return;
    }

    // Handle panning with momentum
    const deltaX = event.deltaX * 0.5;
    const deltaY = event.deltaY * 0.5;
    
    // Apply immediate translation
    setTranslate((prevState) => ({
      ...prevState,
      x: prevState.x - deltaX,
      y: prevState.y - deltaY,
    }));

    // Add momentum if wheel events are coming quickly
    if (timeDelta < 100) {
      momentumRef.current = {
        x: momentumRef.current.x * 0.8 + deltaX * 0.2,
        y: momentumRef.current.y * 0.8 + deltaY * 0.2
      };
    } else {
      momentumRef.current = { x: deltaX, y: deltaY };
    }

    // Apply momentum decay
    const applyMomentum = () => {
      if (Math.abs(momentumRef.current.x) > 0.1 || Math.abs(momentumRef.current.y) > 0.1) {
        setTranslate((prevState) => ({
          ...prevState,
          x: prevState.x - momentumRef.current.x * 0.1,
          y: prevState.y - momentumRef.current.y * 0.1,
        }));
        
        momentumRef.current.x *= 0.95;
        momentumRef.current.y *= 0.95;
        
        requestAnimationFrame(applyMomentum);
      }
    };
    
    if (timeDelta > 100) {
      requestAnimationFrame(applyMomentum);
    }
  }, [debouncedZoom]);
  useLayoutEffect(() => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
    const context = canvas.getContext("2d");

    // Clear canvas
    context.clearRect(0, 0, canvas.width, canvas.height);

    // Apply scale and translate
    context.save();
    context.scale(scale, scale);
    context.translate(translate.x - scaleOffset.x / scale, translate.y - scaleOffset.y / scale);

    // Draw elements
    if (elements && Array.isArray(elements)) {
      elements.forEach((element) => {
        if (element) { // Add a null check for element
          draw(element, context, rough.canvas(canvas), style, scale, element.tool === "text");
        }
      });
    }

    // Draw eraser trail and indicator if eraser tool is active
    if (selectedTool === "eraser") {
      // Pass currentMousePosition for the indicator, and eraserTrail for the trail
      drawEraser(context, eraserTrail, currentMousePosition, scale);
    }

    // Draw selection focus
    if (selectedElement) {
      const element = getElementById(selectedElement.id, elements);
      if (element) { // Ensure element exists before drawing focus
        drawFocuse(element, context, padding, scale);
      }
    }

    // Draw multi-selection bounds and focus
    if (selectedElements && selectedElements.length > 0) {
      drawMultiSelection(selectedElements, context, padding, scale, elements);
    }

    // Draw marquee selection rectangle
    if (action === "selecting" && selectionBounds) {
      context.strokeStyle = "rgba(0, 0, 255, 0.5)";
      context.lineWidth = 1 / scale;
      context.strokeRect(
        selectionBounds.x1,
        selectionBounds.y1,
        selectionBounds.x2 - selectionBounds.x1,
        selectionBounds.y2 - selectionBounds.y1
      );
    }

    context.restore();

    // Set cursor style
    if (selectedTool === "eraser") {
      canvas.style.cursor = `url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="%23000000" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-eraser"><path d="m7 21-4.3-4.3c-1-1-1-2.5 0-3.4l9.6-9.6c1-1 2.5-1 3.4 0l5.6 5.6c1 1 1 2.5 0 3.4L13 21H7Z"/><path d="M22 21H7"/></svg>') 12 12, auto`;
    } else if (inCorner) {
      canvas.style.cursor = cornerCursor(inCorner.slug);
    } else if (action == "translate" || keys.has(" ") || selectedTool == "hand") {
      canvas.style.cursor = "grabbing";
    } else if (selectedTool == "selection" && isInElement) {
      canvas.style.cursor = "move";
    } else if (selectedTool == "text") {
      canvas.style.cursor = "text";
    } else {
      canvas.style.cursor = "default";
    }
  }, [
    elements,
    selectedElement,
    selectedElements,
    selectionBounds,
    action,
    scale,
    translate,
    scaleOffset,
    padding,
    style,
    inCorner,
    isInElement,
    keys,
    selectedTool,
    dimension,
    eraserTrail, // Add eraserTrail as a dependency
    currentMousePosition // Add currentMousePosition as a dependency
  ]);
  useEffect(() => {    const keyDownFunction = (event) => {
      const { key, ctrlKey, metaKey, shiftKey } = event;
      const prevent = () => event.preventDefault();
      
      // Skip keyboard shortcuts if user is typing in text input
      if (textInputMode) {
        return;
      }
      
      // Skip if user is typing in any input field
      const activeElement = document.activeElement;
      if (activeElement && (
        activeElement.tagName === 'INPUT' || 
        activeElement.tagName === 'TEXTAREA' ||
        activeElement.contentEditable === 'true'
      )) {
        return;
      }      // Handle tool number shortcuts (1-9, 0 for tool 10, -, = for tools 11-12)
      if (!ctrlKey && !metaKey && !shiftKey) {
        let toolNumber = null;
        
        if (key >= '1' && key <= '9') {
          toolNumber = parseInt(key);
        } else if (key === '0') {
          toolNumber = 10; // Key '0' still maps to tool #10 internally
        } else if (key === 'i') {
          toolNumber = 11;
        } else if (key === '=') {
          toolNumber = 12;
        }
        
        if (toolNumber) {
          const tool = getToolByNumber(toolNumber);
            if (tool) {
            prevent();
            tool.toolAction(tool.slug);
            return;
          }
        }
      }        // Handle multi-selection shortcuts
      if (ctrlKey || metaKey) {        if (key.toLowerCase() === "a") {
          prevent();
          // Select all elements
          setSelectedElements(elements);
          setSelectedElement(elements.length > 0 ? elements[0] : null);
          return;
        }

        // Copy elements (Ctrl+C) - works with multi-selection even without primary element
        if (key.toLowerCase() === "c") {
          prevent();
          if (selectedElements && Array.isArray(selectedElements) && selectedElements.length > 0) {
            copyElements(selectedElements);
          } else if (selectedElement) {
            copyElements([selectedElement]);
          }
          return;
        }        // Paste elements (Ctrl+V) - works without any selection
        if (key.toLowerCase() === "v") {
          prevent();
          // Use current mouse position for paste location, fallback to center if no position tracked
          const pastePosition = currentMousePosition.x !== 0 || currentMousePosition.y !== 0 
            ? { x: currentMousePosition.x, y: currentMousePosition.y }
            : { x: dimension.width / 2 / scale, y: dimension.height / 2 / scale }; // Fallback to canvas center
          pasteElements(setElements, setSelectedElements, setSelectedElement, pastePosition);
          return;
        }
      }
        // Handle delete for multi-selection
      if (key === "Backspace" || key === "Delete") {
        if (selectedElements && Array.isArray(selectedElements) && selectedElements.length > 1) {
          prevent();
          deleteMultipleElements(selectedElements, setElements, setSelectedElement, setSelectedElements);
          return;
        } else if (selectedElement) {
          prevent();
          deleteElement(selectedElement, setElements, setSelectedElement);
          return;
        }
      }      if (selectedElement) {        if (ctrlKey && key.toLowerCase() == "d") {
          prevent();
          if (selectedElements && Array.isArray(selectedElements) && selectedElements.length > 1) {
            duplicateMultipleElements(selectedElements, setElements, setSelectedElements, 10);
          } else {
            duplicateElement(
              selectedElement,
              setElements,
              setSelectedElement,
              10
            );
          }
        }if (key == "ArrowLeft") {
          prevent();
          if (selectedElements && Array.isArray(selectedElements) && selectedElements.length > 1) {
            // Multi-element arrow movement
            setElements(prevState => 
              prevState.map(element => {
                const selectedEl = selectedElements.find(sel => sel.id === element.id);
                if (selectedEl) {
                  return moveElement(element, -1, 0);
                }
                return element;
              })
            );
            // Update selectedElements state to reflect new positions
            setSelectedElements(prevSelected => 
              prevSelected.map(sel => moveElement(sel, -1, 0))
            );
          } else {
            arrowMove(selectedElement, -1, 0, setElements);
          }
        }        if (key == "ArrowUp") {
          prevent();
          if (selectedElements && Array.isArray(selectedElements) && selectedElements.length > 1) {
            // Multi-element arrow movement
            setElements(prevState => 
              prevState.map(element => {
                const selectedEl = selectedElements.find(sel => sel.id === element.id);
                if (selectedEl) {
                  return moveElement(element, 0, -1);
                }
                return element;
              })
            );
            // Update selectedElements state to reflect new positions
            setSelectedElements(prevSelected => 
              prevSelected.map(sel => moveElement(sel, 0, -1))
            );
          } else {
            arrowMove(selectedElement, 0, -1, setElements);
          }
        }        if (key == "ArrowRight") {
          prevent();
          if (selectedElements && Array.isArray(selectedElements) && selectedElements.length > 1) {
            // Multi-element arrow movement
            setElements(prevState => 
              prevState.map(element => {
                const selectedEl = selectedElements.find(sel => sel.id === element.id);
                if (selectedEl) {
                  return moveElement(element, 1, 0);
                }
                return element;
              })
            );
            // Update selectedElements state to reflect new positions
            setSelectedElements(prevSelected => 
              prevSelected.map(sel => moveElement(sel, 1, 0))
            );
          } else {
            arrowMove(selectedElement, 1, 0, setElements);
          }
        }        if (key == "ArrowDown") {
          prevent();
          if (selectedElements && Array.isArray(selectedElements) && selectedElements.length > 1) {
            // Multi-element arrow movement
            setElements(prevState => 
              prevState.map(element => {
                const selectedEl = selectedElements.find(sel => sel.id === element.id);
                if (selectedEl) {
                  return moveElement(element, 0, 1);
                }
                return element;
              })
            );
            // Update selectedElements state to reflect new positions
            setSelectedElements(prevSelected => 
              prevSelected.map(sel => moveElement(sel, 0, 1))
            );
          } else {
            arrowMove(selectedElement, 0, 1, setElements);
          }
        }
      }      if (ctrlKey || metaKey) {
        if (
          key.toLowerCase() == "y" ||
          (key.toLowerCase() == "z" && shiftKey)
        ) {
          prevent();
          redo();
        } else if (key.toLowerCase() == "z") {
          prevent();
          undo();
        } else if (key.toLowerCase() == "s") {
          prevent();
          saveElements(elements);
        } else if (key.toLowerCase() == "o") {
          prevent();
          uploadElements(setElements);        } else if (key === "=" || key === "+") {
          // Ctrl++ or Ctrl+= for zoom in
          prevent();
          onZoom(0.1, null, null, { animate: true });
        } else if (key === "-") {
          // Ctrl+- for zoom out
          prevent();
          onZoom(-0.1, null, null, { animate: true });
        } else if (key === "0") {
          // Ctrl+0 for reset zoom
          prevent();
          onZoom("default", null, null, { animate: true });
        } else if (key.toLowerCase() === "9") {
          // Ctrl+9 for zoom to fit content
          prevent();
          onZoom("fit");
        }
      }
    };    window.addEventListener("keydown", keyDownFunction, { passive: false });
    return () => {
      window.removeEventListener("keydown", keyDownFunction);
    };
  }, [undo, redo, selectedElement, selectedElements, elements, setElements, setSelectedElement, setSelectedElements, tools, toolAction, textInputMode]);

  useEffect(() => {
    if (selectedTool != "selection") {
      setSelectedElement(null);
      setSelectedElements([]);
    }
  }, [selectedTool]);

  useEffect(() => {
    if (action == "translate") {
      document.documentElement.style.setProperty("--canvas-cursor", "grabbing");
    } else if (action.startsWith("resize")) {
      document.documentElement.style.setProperty("--canvas-cursor", cursor);
    } else if (
      (keys.has(" ") || selectedTool == "hand") &&
      action != "move" &&
      action != "resize"
    ) {
      document.documentElement.style.setProperty("--canvas-cursor", "grab");
    } else if (selectedTool !== "selection") {
      document.documentElement.style.setProperty(
        "--canvas-cursor",
        "crosshair"
      );
    } else if (inCorner) {
      document.documentElement.style.setProperty(
        "--canvas-cursor",
        cornerCursor(inCorner.slug)
      );
    } else if (isInElement) {
      document.documentElement.style.setProperty("--canvas-cursor", "move");
    } else if (selectedTool === "eraser") {
      document.documentElement.style.setProperty("--canvas-cursor", "url('data:image/svg+xml;utf8,<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"24\" height=\"24\" viewBox=\"0 0 576 512\"><path fill=\"currentColor\" d=\"M290.7 57.4L57.4 290.7c-25 25-25 65.5 0 90.5l80 80c12 12 28.3 18.7 45.3 18.7H512c17.7 0 32-14.3 32-32s-14.3-32-32-32H387.9l130.7-130.6c25-25 25-65.5 0-90.5L381.3 57.4c-25-25-65.5-25-90.5 0zm6.7 358.6H182.6l-80-80 124.7-124.7 137.4 137.4-67.3 67.3z\"/></svg>') 12 12, auto"); // 12 12 is hotspot
    } else {
      document.documentElement.style.setProperty("--canvas-cursor", "default");
    }
  }, [keys, selectedTool, action, isInElement, inCorner]);  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Add wheel event listener with passive: false to allow preventDefault
    canvas.addEventListener("wheel", handleWheel, { passive: false });

    const preventBrowserZoom = (event) => {
      if (event.ctrlKey) {
        event.preventDefault();
      }
    };
    window.addEventListener("wheel", preventBrowserZoom, {
      passive: false,
    });

    return () => {
      canvas.removeEventListener("wheel", handleWheel);
      window.removeEventListener("wheel", preventBrowserZoom);
    };
  }, [handleWheel]);return {
    canvasRef,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    handleWheel,
    handleContextMenu,
    dimension,
    textInputMode,
    setTextInputMode,
  };
}
