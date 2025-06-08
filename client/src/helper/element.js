import { distance } from "./canvas";
import { v4 as uuid } from "uuid";

export function isWithinElement(x, y, element) {
  let { tool, x1, y1, x2, y2, strokeWidth } = element;

  switch (tool) {
    case "arrow":
    case "line":
      const a = { x: x1, y: y1 };
      const b = { x: x2, y: y2 };
      const c = { x, y };

      const offset = distance(a, b) - (distance(a, c) + distance(b, c));
      return Math.abs(offset) < (0.05 * strokeWidth || 1);
      
    case "draw":
      // For freehand drawing, check if point is near any segment of the path
      if (element.points && element.points.length > 1) {
        const threshold = strokeWidth + 5; // Add some tolerance
        
        for (let i = 0; i < element.points.length - 1; i++) {
          const p1 = element.points[i];
          const p2 = element.points[i + 1];
          const lineDistance = distance(p1, p2) - (distance(p1, { x, y }) + distance(p2, { x, y }));
          
          if (Math.abs(lineDistance) < threshold * 0.1) {
            return true;
          }
        }
        return false;
      }
      // Fallback to bounding box
      return x >= Math.min(x1, x2) - strokeWidth && 
             x <= Math.max(x1, x2) + strokeWidth &&
             y >= Math.min(y1, y2) - strokeWidth && 
             y <= Math.max(y1, y2) + strokeWidth;
             
    case "text":
      // Text elements use bounding box detection
      const minX = Math.min(x1, x2) - strokeWidth / 2;
      const maxX = Math.max(x1, x2) + strokeWidth / 2;
      const minY = Math.min(y1, y2) - strokeWidth / 2;
      const maxY = Math.max(y1, y2) + strokeWidth / 2;
      return x >= minX && x <= maxX && y >= minY && y <= maxY;
      
    case "image":
      // Image elements use bounding box detection
      const imgMinX = Math.min(x1, x2);
      const imgMaxX = Math.max(x1, x2);
      const imgMinY = Math.min(y1, y2);
      const imgMaxY = Math.max(y1, y2);
      return x >= imgMinX && x <= imgMaxX && y >= imgMinY && y <= imgMaxY;
      
    case "circle":
      const width = x2 - x1 + strokeWidth;
      const height = y2 - y1 + strokeWidth;
      x1 -= strokeWidth / 2;
      y1 -= strokeWidth / 2;

      const centreX = x1 + width / 2;
      const centreY = y1 + height / 2;

      const mouseToCentreX = centreX - x;
      const mouseToCentreY = centreY - y;

      const radiusX = Math.abs(width) / 2;
      const radiusY = Math.abs(height) / 2;

      return (
        (mouseToCentreX * mouseToCentreX) / (radiusX * radiusX) +
          (mouseToCentreY * mouseToCentreY) / (radiusY * radiusY) <=
        1
      );

    case "diamond":
    case "rectangle":
      const rectMinX = Math.min(x1, x2) - strokeWidth / 2;
      const rectMaxX = Math.max(x1, x2) + strokeWidth / 2;
      const rectMinY = Math.min(y1, y2) - strokeWidth / 2;
      const rectMaxY = Math.max(y1, y2) + strokeWidth / 2;

      return x >= rectMinX && x <= rectMaxX && y >= rectMinY && y <= rectMaxY;
  }
}

export function getElementPosition(x, y, elements) {
  return elements.filter((element) => isWithinElement(x, y, element)).at(-1);
}

export function createElement(x1, y1, x2, y2, style, tool) {
  const baseElement = { id: uuid(), x1, y1, x2, y2, ...style, tool };
  
  // Add special properties for different tools
  if (tool === "draw") {
    return { ...baseElement, points: [{ x: x1, y: y1 }] };
  }
  
  if (tool === "text") {
    return { ...baseElement, text: "", fontSize: 16, fontFamily: "Arial" };
  }
  
  if (tool === "image") {
    return { ...baseElement, imageData: null, imageUrl: null };
  }
  
  return baseElement;
}

export function updateElement(
  id,
  stateOption,
  setState,
  state,
  overwrite = false
) {
  const index = state.findIndex((ele) => ele.id == id);

  const stateCopy = [...state];

  stateCopy[index] = {
    ...stateCopy[index],
    ...stateOption,
  };

  setState(stateCopy, overwrite);
}

export function deleteElement(s_element, setState, setSelectedElement) {
  if (!s_element) return;

  const { id } = s_element;
  setState((prevState) => prevState.filter((element) => element.id != id));
  setSelectedElement(null);
}

export function duplicateElement(
  s_element,
  setState,
  setSelected,
  factor,
  offsets = {}
) {
  if (!s_element) return;

  const { id } = s_element;
  setState((prevState) =>
    prevState
      .map((element) => {
        if (element.id == id) {
          const duplicated = { ...moveElement(element, factor), id: uuid() };
          setSelected({ ...duplicated, ...offsets });
          return [element, duplicated];
        }
        return element;
      })
      .flat()
  );
}

export function moveElement(element, factorX, factorY = null) {
  const deltaY = factorY ?? factorX;
  const movedElement = {
    ...element,
    x1: element.x1 + factorX,
    y1: element.y1 + deltaY,
    x2: element.x2 + factorX,
    y2: element.y2 + deltaY,
  };

  // For draw tool elements, also move all points in the drawing path
  if (element.tool === "draw" && element.points && element.points.length > 0) {
    movedElement.points = element.points.map(point => ({
      x: point.x + factorX,
      y: point.y + deltaY
    }));
  }

  return movedElement;
}

export function moveElementLayer(id, to, setState, state) {
  const index = state.findIndex((ele) => ele.id == id);
  const stateCopy = [...state];
  let replace = stateCopy[index];
  stateCopy.splice(index, 1);

  let toReplaceIndex = index;
  if (to == 1 && index < state.length - 1) {
    toReplaceIndex = index + 1;
  } else if (to == -1 && index > 0) {
    toReplaceIndex = index - 1;
  } else if (to == 0) {
    toReplaceIndex = 0;
  } else if (to == 2) {
    toReplaceIndex = state.length - 1;
  }

  const firstPart = stateCopy.slice(0, toReplaceIndex);
  const lastPart = stateCopy.slice(toReplaceIndex);

  setState([...firstPart, replace, ...lastPart]);
}

export function arrowMove(s_element, x, y, setState) {
  if (!s_element) return;

  const { id } = s_element;
  setState((prevState) =>
    prevState.map((element) => {
      if (element.id == id) {
        return moveElement(element, x, y);
      }
      return element;
    })
  );
}

export function minmax(value, interval) {
  return Math.max(Math.min(value, interval[1]), interval[0]);
}

export function getElementById(id, elements) {
  return elements.find((element) => element.id == id);
}

export function adjustCoordinates(element) {
  const { id, x1, x2, y1, y2, tool } = element;
  if (tool == "line" || tool == "arrow") return { id, x1, x2, y1, y2 };

  const minX = Math.min(x1, x2);
  const maxX = Math.max(x1, x2);
  const minY = Math.min(y1, y2);
  const maxY = Math.max(y1, y2);

  return { id, x1: minX, y1: minY, x2: maxX, y2: maxY };
}

// Helper function to calculate minimum height needed for text with wrapping
function calculateMinTextHeight(text, width, fontSize, fontFamily = 'Arial') {
  if (!text || text.trim() === '') return fontSize * 1.2; // Minimum one line
  
  // Create a temporary canvas to measure text
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  ctx.font = `${fontSize}px ${fontFamily}`;
  
  const lineHeight = fontSize * 1.2;
  const lines = text.split('\n');
  let totalLines = 0;
  
  lines.forEach(line => {
    if (line.trim() === '') {
      totalLines += 1; // Empty line still takes space
      return;
    }
    
    // Calculate how many lines this text will wrap to
    const words = line.split(' ');
    let currentLine = '';
    let lineCount = 0;
    
    for (let i = 0; i < words.length; i++) {
      const testLine = currentLine + (currentLine ? ' ' : '') + words[i];
      const metrics = ctx.measureText(testLine);
      
      if (metrics.width > width && currentLine !== '') {
        lineCount++;
        currentLine = words[i];
      } else {
        currentLine = testLine;
      }
    }
    
    if (currentLine) {
      lineCount++;
    }
    
    totalLines += Math.max(1, lineCount); // At least one line per paragraph
  });
  
  return totalLines * lineHeight;
}

// Helper function to get standard resize coordinates (non-text elements)
function getStandardResize(corner, type, x, y, padding, element, offset, elementOffset) {
  // Validate inputs
  if (!isFinite(x) || !isFinite(y) || !element || !offset || !elementOffset) {
    console.warn("Invalid inputs to getStandardResize, returning original coordinates");
    return {
      x1: element?.x1 || 0,
      y1: element?.y1 || 0,
      x2: element?.x2 || 100,
      y2: element?.y2 || 100
    };
  }
  
  const { x1, x2, y1, y2 } = element;
  
  const getPadding = (condition) => {
    return condition ? padding : padding * -1;
  };

  const getType = (coordinate, originalCoordinate, eleOffset, te = false) => {
    if (type === "default") return originalCoordinate;

    const def = coordinate - offset.y;
    if (te) return eleOffset - def;
    return eleOffset + def;
  };

  switch (corner) {
    case "tt":
      return {
        x1: getType(y, x1, elementOffset.x1, true),
        y1: y + getPadding(y < y2),
        x2: getType(y, x2, elementOffset.x2),
        y2: getType(y, y2, elementOffset.y2),
      };
    case "bb":
      return { 
        x1, 
        y1, 
        x2, 
        y2: y + getPadding(y < y1) 
      };
    case "rr":
      return { 
        x1, 
        y1, 
        x2: x + getPadding(x < x1), 
        y2 
      };
    case "ll":
      return { 
        x1: x + getPadding(x < x2), 
        y1, 
        x2, 
        y2 
      };
    case "tl":
      return { 
        x1: x + getPadding(x < x2), 
        y1: y + getPadding(y < y2), 
        x2, 
        y2 
      };
    case "tr":
      return { 
        x1, 
        y1: y + getPadding(y < y2), 
        x2: x + getPadding(x < x1), 
        y2 
      };
    case "bl":
      return { 
        x1: x + getPadding(x < x2), 
        y1, 
        x2, 
        y2: y + getPadding(y < y1) 
      };
    case "br":
      return { 
        x1, 
        y1, 
        x2: x + getPadding(x < x1), 
        y2: y + getPadding(y < y1) 
      };
    case "l1":
      return { x1: x, y1: y, x2, y2 };
    case "l2":
      return { x1, y1, x2: x, y2: y };
    default:
      return { x1, y1, x2, y2 };
  }
}

export function resizeValue(
  corner,
  type,
  x,
  y,
  padding,
  element,
  offset,
  elementOffset
) {
  const { x1, x2, y1, y2, tool } = element;
  // Special handling for text elements - intelligent text box behavior
  if (tool === "text") {
    // Validate inputs to prevent NaN/Infinity issues
    if (!isFinite(x) || !isFinite(y) || !isFinite(offset.x) || !isFinite(offset.y)) {
      return {
        x1: element.x1,
        y1: element.y1,
        x2: element.x2,
        y2: element.y2,
        fontSize: element.fontSize || 16,
        text: element.text,
        fontFamily: element.fontFamily
      };
    }
    
    const originalFontSize = elementOffset.fontSize || 16;
    
    // Get the standard resize coordinates for the bounding box first
    const standardResize = getStandardResize(corner, type, x, y, padding, element, offset, elementOffset);
    
    // Validate the coordinates before proceeding
    const validatedResize = {
      x1: isFinite(standardResize.x1) ? standardResize.x1 : element.x1,
      y1: isFinite(standardResize.y1) ? standardResize.y1 : element.y1,
      x2: isFinite(standardResize.x2) ? standardResize.x2 : element.x2,
      y2: isFinite(standardResize.y2) ? standardResize.y2 : element.y2,
    };
    
    // Ensure minimum dimensions (prevent zero or negative width/height)
    const minWidth = 40; // Minimum width for readable text
    const minHeight = 25; // Minimum height for readable text
    
    if (Math.abs(validatedResize.x2 - validatedResize.x1) < minWidth) {
      if (validatedResize.x2 > validatedResize.x1) {
        validatedResize.x2 = validatedResize.x1 + minWidth;
      } else {
        validatedResize.x1 = validatedResize.x2 + minWidth;
      }
    }
    
    if (Math.abs(validatedResize.y2 - validatedResize.y1) < minHeight) {
      if (validatedResize.y2 > validatedResize.y1) {
        validatedResize.y2 = validatedResize.y1 + minHeight;
      } else {
        validatedResize.y1 = validatedResize.y2 + minHeight;
      }
    }

    // Intelligent font size scaling based on resize type
    let newFontSize = originalFontSize;
    
    if (corner === "ll" || corner === "rr") {
      // Left/Right edges: Only change width, keep font size the same
      // Text will automatically wrap to fit new width
      newFontSize = originalFontSize;
      
    } else if (corner === "tt" || corner === "bb") {
      // Top/Bottom edges: Scale font size based on height change
      const originalHeight = Math.abs(elementOffset.y2 - elementOffset.y1);
      const newHeight = Math.abs(validatedResize.y2 - validatedResize.y1);
      
      if (originalHeight > 0) {
        const heightRatio = newHeight / originalHeight;
        newFontSize = Math.max(8, Math.min(200, originalFontSize * heightRatio));
      }
      
    } else if (corner === "br" || corner === "tr" || corner === "bl" || corner === "tl") {
      // Corner resize: Scale font based on area change for proportional scaling
      const originalWidth = Math.abs(elementOffset.x2 - elementOffset.x1);
      const originalHeight = Math.abs(elementOffset.y2 - elementOffset.y1);
      const originalArea = originalWidth * originalHeight;
      
      const newWidth = Math.abs(validatedResize.x2 - validatedResize.x1);
      const newHeight = Math.abs(validatedResize.y2 - validatedResize.y1);
      const newArea = newWidth * newHeight;
      
      if (originalArea > 0) {
        // Use square root of area ratio for more natural font scaling
        const areaRatio = Math.sqrt(newArea / originalArea);
        newFontSize = Math.max(8, Math.min(200, originalFontSize * areaRatio));
      }
    }
    
    // Round font size and ensure it's finite
    newFontSize = Math.round(newFontSize);
    if (!isFinite(newFontSize)) {
      newFontSize = originalFontSize;
    }
    
    return {
      ...validatedResize,
      fontSize: newFontSize,
      text: element.text,
      fontFamily: element.fontFamily
    };
  }

  const getPadding = (condition) => {
    return condition ? padding : padding * -1;
  };

  const getType = (y, coordinate, originalCoordinate, eleOffset, te = false) => {
    if (type == "default") return originalCoordinate;

    const def = coordinate - y;
    if (te) return eleOffset - def;
    return eleOffset + def;
  };

  switch (corner) {
    case "tt":
      return {
        y1: y + getPadding(y < y2),
        y2: getType(y, offset.y, y2, elementOffset.y2),
        x1: getType(y, offset.y, x1, elementOffset.x1, true),
        x2: getType(y, offset.y, x2, elementOffset.x2),
      };
    case "bb":
      return { y2: y + getPadding(y < y1) };
    case "rr":
      return { x2: x + getPadding(x < x1) };
    case "ll":
      return { x1: x + getPadding(x < x2) };
    case "tl":
      return { x1: x + getPadding(x < x2), y1: y + getPadding(y < y2) };
    case "tr":
      return { x2: x + getPadding(x < x1), y1: y + getPadding(y < y2) };
    case "bl":
      return { x1: x + getPadding(x < x2), y2: y + getPadding(y < y1) };
    case "br":
      return { x2: x + getPadding(x < x1), y2: y + getPadding(y < y1) };
    case "l1":
      return { x1: x, y1: y };
    case "l2":
      return { x2: x, y2: y };
  }
}

export function saveElements(elements) {
  const jsonString = JSON.stringify(elements);
  const blob = new Blob([jsonString], { type: "application/json" });
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.download = "canvas.flowstate";
  link.href = url;
  link.click();
}

export function uploadElements(setElements) {
  function uploadJSON(event) {
    const file = event.target.files[0];
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target.result);
        setElements(data);
      } catch (error) {
        console.error("Error :", error);
      }
    };

    reader.readAsText(file);
  }
  const fileInput = document.createElement("input");
  fileInput.type = "file";
  fileInput.accept = ".flowstate";
  fileInput.onchange = uploadJSON;
  fileInput.click();
}

// Multi-selection helper functions
export function isElementInSelectionBounds(element, bounds) {
  const { x1: bx1, y1: by1, x2: bx2, y2: by2 } = bounds;
  const { x1: ex1, y1: ey1, x2: ex2, y2: ey2 } = element;

  // Normalize coordinates
  const minBx = Math.min(bx1, bx2);
  const maxBx = Math.max(bx1, bx2);
  const minBy = Math.min(by1, by2);
  const maxBy = Math.max(by1, by2);

  const minEx = Math.min(ex1, ex2);
  const maxEx = Math.max(ex1, ex2);
  const minEy = Math.min(ey1, ey2);
  const maxEy = Math.max(ey1, ey2);

  // Check if element is partially or fully within bounds
  return !(maxEx < minBx || minEx > maxBx || maxEy < minBy || minEy > maxBy);
}

export function getElementsInSelectionBounds(elements, bounds) {
  return elements.filter((element) =>
    isElementInSelectionBounds(element, bounds)
  );
}

export function getSelectionBounds(selectedElements) {
  if (selectedElements.length === 0) return null;

  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  selectedElements.forEach((element) => {
    const { x1, y1, x2, y2 } = element;
    minX = Math.min(minX, x1, x2);
    minY = Math.min(minY, y1, y2);
    maxX = Math.max(maxX, x1, x2);
    maxY = Math.max(maxY, y1, y2);
  });

  return { x1: minX, y1: minY, x2: maxX, y2: maxY };
}

export function deleteMultipleElements(selectedElements, setState, setSelectedElement, setSelectedElements) {
  if (selectedElements.length === 0) return;

  const selectedIds = selectedElements.map(el => el.id);
  setState((prevState) => prevState.filter((element) => !selectedIds.includes(element.id)));
  setSelectedElement(null);
  setSelectedElements([]);
}

export function updateMultipleElements(selectedElements, styleUpdates, setState, state) {
  if (selectedElements.length === 0) return;

  const selectedIds = selectedElements.map(el => el.id);
  setState((prevState) => 
    prevState.map((element) => {
      if (selectedIds.includes(element.id)) {
        return { ...element, ...styleUpdates };
      }
      return element;
    })
  );
}

export function duplicateMultipleElements(selectedElements, setState, setSelectedElements, factor) {
  if (selectedElements.length === 0) return;

  const duplicatedElements = [];
  
  setState((prevState) => {
    const newElements = [...prevState];
    
    selectedElements.forEach((element) => {
      const duplicated = { 
        ...moveElement(element, factor), 
        id: uuid() 
      };
      duplicatedElements.push(duplicated);
      newElements.push(duplicated);
    });
    
    return newElements;
  });
  
  setSelectedElements(duplicatedElements);
}
