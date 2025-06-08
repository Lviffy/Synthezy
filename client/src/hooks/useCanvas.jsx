import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { useAppContext } from "../provider/AppStates";
import useDimension from "./useDimension";
import { lockUI } from "../helper/ui";
import {
  draw,
  drawFocuse,
  drawMultiSelection,
  cornerCursor,
  inSelectedCorner,
} from "../helper/canvas";
import {
  adjustCoordinates,
  arrowMove,
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
  resizeValue,
  saveElements,
  updateElement,
  uploadElements,
} from "../helper/element";
import useKeys from "./useKeys";

export default function useCanvas() {
  const {
    selectedTool,
    setSelectedTool,
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
    style,
    selectedElement,
    setSelectedElement,
    selectedElements,
    setSelectedElements,
    selectionBounds,
    setSelectionBounds,
    undo,
    redo,
  } = useAppContext();

  const canvasRef = useRef(null);
  const keys = useKeys();
  const dimension = useDimension();
  const [isInElement, setIsInElement] = useState(false);
  const [inCorner, setInCorner] = useState(false);
  const [padding, setPadding] = useState(minmax(10 / scale, [0.5, 50]));
  const [cursor, setCursor] = useState("default");
  const [mouseAction, setMouseAction] = useState({ x: 0, y: 0 });
  const [initialSelectedElements, setInitialSelectedElements] = useState([]);  const [resizeOldDementions, setResizeOldDementions] = useState(null)
  const [isDrawing, setIsDrawing] = useState(false);
  const [textInputMode, setTextInputMode] = useState(null);

  const mousePosition = ({ clientX, clientY }) => {
    clientX = (clientX - translate.x * scale + scaleOffset.x) / scale;
    clientY = (clientY - translate.y * scale + scaleOffset.y) / scale;
    return { clientX, clientY };
  };

  const handleMouseDown = (event) => {
    const { clientX, clientY } = mousePosition(event);
    lockUI(true);

    if (inCorner) {
      setResizeOldDementions(getElementById(selectedElement.id, elements))
      setElements((prevState) => prevState);
      setMouseAction({ x: event.clientX, y: event.clientY });
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
          });
        } else {
          // Check if element is already in selection
          const isElementSelected = selectedElements.some(sel => sel.id === element.id);
          
          if (event.shiftKey) {
            // Toggle element in selection
            if (isElementSelected) {
              const newSelection = selectedElements.filter(sel => sel.id !== element.id);
              setSelectedElements(newSelection);
              setSelectedElement(newSelection.length > 0 ? newSelection[0] : null);
            } else {
              const newSelection = [...selectedElements, element];
              setSelectedElements(newSelection);
              setSelectedElement(element);
            }
            setAction("none"); // Don't start moving when shift-selecting
          } else {
            // If element is already part of multi-selection, move all selected elements
            if (isElementSelected && selectedElements.length > 1) {
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
        setAction("selecting");
      }      return;
    }

    // Handle text tool click-to-add
    if (selectedTool === "text") {
      setTextInputMode({ x: clientX, y: clientY });
      return;
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
      const element = createElement(
        clientX,
        clientY,
        clientX,
        clientY,
        style,
        selectedTool
      );
      element.points = [{ x: clientX, y: clientY }];
      setElements((prevState) => [...prevState, element]);
    } else {
      // Regular shape drawing
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
  };

  const handleMouseMove = (event) => {
    const { clientX, clientY } = mousePosition(event);

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
      const { id } = elements.at(-1);
      
      if (selectedTool === "draw" && isDrawing) {
        // Add point to freehand path
        const element = elements.at(-1);
        const newPoints = [...element.points, { x: clientX, y: clientY }];
        updateElement(
          id,
          { points: newPoints, x2: clientX, y2: clientY },
          setElements,
          elements,
          true
        );
      } else {
        // Regular shape drawing
        updateElement(
          id,
          { x2: clientX, y2: clientY },
          setElements,
          elements,
          true
        );
      }
    } else if (action == "selecting") {
      // Update marquee selection bounds
      setSelectionBounds(prev => ({
        ...prev,
        x2: clientX,
        y2: clientY
      }));    } else if (action == "move") {      if (selectedElements.length > 1 && initialSelectedElements.length > 0) {
        // Multi-element movement: calculate delta from initial mouse position
        const deltaX = clientX - mouseAction.x;
        const deltaY = clientY - mouseAction.y;

        // Batch update all selected elements at once to prevent race conditions
        setElements((prevState) => 
          prevState.map((element) => {
            const initialElement = initialSelectedElements.find(init => init.id === element.id);
            if (initialElement) {
              const updatedElement = {
                ...element,
                x1: initialElement.x1 + deltaX,
                y1: initialElement.y1 + deltaY,
                x2: initialElement.x2 + deltaX,
                y2: initialElement.y2 + deltaY
              };
              
              // For draw tool elements, also move all points in the drawing path
              if (element.tool === "draw" && initialElement.points && initialElement.points.length > 0) {
                updatedElement.points = initialElement.points.map(point => ({
                  x: point.x + deltaX,
                  y: point.y + deltaY
                }));
              }
              
              return updatedElement;
            }
            return element;
          })
        );      } else {
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
            elements,
            true
          );
        }
      }
    } else if (action == "translate") {
      const x = clientX - translate.sx;
      const y = clientY - translate.sy;

      setTranslate((prevState) => ({
        ...prevState,
        x: prevState.x + x,
        y: prevState.y + y,
      }));
    } else if (action.startsWith("resize")) {
      const resizeCorner = action.slice(7, 9);
      const resizeType = action.slice(10) || "default";
      const s_element = getElementById(selectedElement.id, elements);

      updateElement(
        s_element.id,
        resizeValue(resizeCorner, resizeType, clientX, clientY, padding, s_element, mouseAction, resizeOldDementions),
        setElements,
        elements,
        true
      );
    }
  };

  const handleMouseUp = (event) => {
    const currentAction = action; // Store current action before resetting
    
    // Handle marquee selection before resetting action
    if (currentAction == "selecting") {
      // Finalize marquee selection
      if (selectionBounds) {
        const selectedInBounds = getElementsInSelectionBounds(elements, selectionBounds);
        if (event.shiftKey) {
          // Add to existing selection
          const newSelection = [...selectedElements];
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
      if (selectedElements.length > 1) {
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
            elements,
            true
          );
        }
      } else {
        // Regular shape drawing
        const lastElement = elements.at(-1);
        const { id, x1, y1, x2, y2 } = adjustCoordinates(lastElement);
        updateElement(id, { x1, x2, y1, y2 }, setElements, elements, true);
      }
      
      if (!lockTool) {
        setSelectedTool("selection");
        setSelectedElement(elements.at(-1));
      }
    }

    if (currentAction.startsWith("resize")) {
      const { id, x1, y1, x2, y2 } = adjustCoordinates(
        getElementById(selectedElement.id, elements)
      );
      updateElement(id, { x1, x2, y1, y2 }, setElements, elements, true);
    }
  };

  const handleWheel = (event) => {
    if (event.ctrlKey) {
      onZoom(event.deltaY * -0.01);
      return;
    }

    setTranslate((prevState) => ({
      ...prevState,
      x: prevState.x - event.deltaX,
      y: prevState.y - event.deltaY,
    }));
  };

  useLayoutEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas.getContext("2d");

    const zoomPositionX = 2;
    const zoomPositionY = 2;
    // const zoomPositionX = scaleMouse ? canvas.width / scaleMouse.x : 2;
    // const zoomPositionY = scaleMouse ? canvas.height / scaleMouse.y : 2;

    const scaledWidth = canvas.width * scale;
    const scaledHeight = canvas.height * scale;

    const scaleOffsetX = (scaledWidth - canvas.width) / zoomPositionX;
    const scaleOffsetY = (scaledHeight - canvas.height) / zoomPositionY;

    setScaleOffset({ x: scaleOffsetX, y: scaleOffsetY });

    context.clearRect(0, 0, canvas.width, canvas.height);

    context.save();

    context.translate(
      translate.x * scale - scaleOffsetX,
      translate.y * scale - scaleOffsetY
    );
    context.scale(scale, scale);

    let focusedElement = null;
    elements.forEach((element) => {
      draw(element, context);
      if (element.id == selectedElement?.id) focusedElement = element;
    });

    const pd = minmax(10 / scale, [0.5, 50]);
    
    // Draw multi-selection indicators for multiple selected elements
    if (selectedElements.length > 1) {
      drawMultiSelection(selectedElements, context, scale);
    }
    
    // Draw focus indicators for the primary selected element
    if (focusedElement != null) {
      drawFocuse(focusedElement, context, pd, scale);
    }
    setPadding(pd);

    context.restore();
  }, [elements, selectedElement, scale, translate, dimension]);

  useEffect(() => {
    const keyDownFunction = (event) => {
      const { key, ctrlKey, metaKey, shiftKey } = event;
      const prevent = () => event.preventDefault();
      
      // Handle multi-selection shortcuts
      if (ctrlKey || metaKey) {
        if (key.toLowerCase() === "a") {
          prevent();
          // Select all elements
          setSelectedElements(elements);
          setSelectedElement(elements.length > 0 ? elements[0] : null);
          return;
        }
      }
      
      // Handle delete for multi-selection
      if (key === "Backspace" || key === "Delete") {
        if (selectedElements.length > 1) {
          prevent();
          deleteMultipleElements(selectedElements, setElements, setSelectedElement, setSelectedElements);
          return;
        } else if (selectedElement) {
          prevent();
          deleteElement(selectedElement, setElements, setSelectedElement);
          return;
        }
      }
      
      if (selectedElement) {
        if (ctrlKey && key.toLowerCase() == "d") {
          prevent();
          if (selectedElements.length > 1) {
            duplicateMultipleElements(selectedElements, setElements, setSelectedElements, 10);
          } else {
            duplicateElement(
              selectedElement,
              setElements,
              setSelectedElement,
              10
            );
          }
        }        if (key == "ArrowLeft") {
          prevent();
          if (selectedElements.length > 1) {
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
        }
        if (key == "ArrowUp") {
          prevent();
          if (selectedElements.length > 1) {
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
        }
        if (key == "ArrowRight") {
          prevent();
          if (selectedElements.length > 1) {
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
        }
        if (key == "ArrowDown") {
          prevent();
          if (selectedElements.length > 1) {
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
      }

      if (ctrlKey || metaKey) {
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
          uploadElements(setElements);
        }
      }
    };

    window.addEventListener("keydown", keyDownFunction, { passive: false });
    return () => {
      window.removeEventListener("keydown", keyDownFunction);
    };
  }, [undo, redo, selectedElement, selectedElements, elements, setElements, setSelectedElement, setSelectedElements]);

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
    } else {
      document.documentElement.style.setProperty("--canvas-cursor", "default");
    }
  }, [keys, selectedTool, action, isInElement, inCorner]);

  useEffect(() => {
    const fakeWheel = (event) => {
      if (event.ctrlKey) {
        event.preventDefault();
      }
    };
    window.addEventListener("wheel", fakeWheel, {
      passive: false,
    });

    return () => {
      window.removeEventListener("wheel", fakeWheel);
    };
  }, []);
  return {
    canvasRef,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    handleWheel,
    dimension,
    textInputMode,
    setTextInputMode,
  };
}
