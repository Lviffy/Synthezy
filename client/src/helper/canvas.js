import rough from "roughjs";

// Image cache to prevent creating new Image objects repeatedly
const imageCache = new Map();

export const shapes = {
  arrow: (x1, y1, x2, y2, roughCanvas, options) => {
    // Draw the main line
    roughCanvas.line(x1, y1, x2, y2, options);
    
    // Calculate arrow head
    const headlen = 10;
    const angle = Math.atan2(y2 - y1, x2 - x1);
    
    // Draw arrow head lines
    roughCanvas.line(
      x2,
      y2,
      x2 - headlen * Math.cos(angle - Math.PI / 7),
      y2 - headlen * Math.sin(angle - Math.PI / 7),
      options
    );
    
    roughCanvas.line(
      x2,
      y2,
      x2 - headlen * Math.cos(angle + Math.PI / 7),
      y2 - headlen * Math.sin(angle + Math.PI / 7),
      options
    );
  },
  line: (x1, y1, x2, y2, roughCanvas, options) => {
    roughCanvas.line(x1, y1, x2, y2, options);
  },
  rectangle: (x1, y1, x2, y2, roughCanvas, options) => {
    const width = x2 - x1;
    const height = y2 - y1;
    roughCanvas.rectangle(x1, y1, width, height, options);
  },
  diamond: (x1, y1, x2, y2, roughCanvas, options) => {
    const width = x2 - x1;
    const height = y2 - y1;
    const centerX = x1 + width / 2;
    const centerY = y1 + height / 2;
    
    // Create diamond path
    const points = [
      [centerX, y1],        // top
      [x2, centerY],        // right
      [centerX, y2],        // bottom
      [x1, centerY]         // left
    ];
    
    roughCanvas.polygon(points, options);
  },
  circle: (x1, y1, x2, y2, roughCanvas, options) => {
    const width = Math.abs(x2 - x1);
    const height = Math.abs(y2 - y1);
    const centerX = x1 + (x2 - x1) / 2;
    const centerY = y1 + (y2 - y1) / 2;
    
    roughCanvas.ellipse(centerX, centerY, width, height, options);
  },
  draw: (x1, y1, x2, y2, roughCanvas, options, element) => {
    // For freehand drawing, we need to draw the path from points
    if (element && element.points && element.points.length > 1) {
      const points = element.points;
      
      // Draw smooth path through all points
      for (let i = 0; i < points.length - 1; i++) {
        roughCanvas.line(
          points[i].x,
          points[i].y,
          points[i + 1].x,
          points[i + 1].y,
          { 
            ...options, 
            roughness: 0.5, // Smoother for freehand drawing
            stroke: options.stroke,
            strokeWidth: options.strokeWidth 
          }
        );
      }
    } else {
      // Fallback for single point or line
      roughCanvas.line(x1, y1, x2, y2, options);
    }
  },
  text: (x1, y1, x2, y2, roughCanvas, options, element) => {
    const width = Math.abs(x2 - x1);
    const height = Math.abs(y2 - y1);
    const minX = Math.min(x1, x2);
    const minY = Math.min(y1, y2);
    
    // Don't draw border for text elements during actual rendering
    // The text will be rendered separately in the draw function
    if (!element?.text) {
      // Only show dashed rectangle during creation
      const textOptions = { ...options, strokeLineDash: [5, 5] };
      roughCanvas.rectangle(minX, minY, Math.max(width, 20), Math.max(height, 20), textOptions);
    }
  },  image: (x1, y1, x2, y2, roughCanvas, options, element) => {
    const width = Math.abs(x2 - x1);
    const height = Math.abs(y2 - y1);
    const minX = Math.min(x1, x2);
    const minY = Math.min(y1, y2);
    
    if (!element?.imageData) {
      // Show placeholder only if no image is loaded
      const maxX = minX + width;
      const maxY = minY + height;
      
      // Draw rectangle border
      roughCanvas.rectangle(minX, minY, width, height, options);
      
      // Draw diagonal lines to indicate image placeholder
      roughCanvas.line(minX, minY, maxX, maxY, options);
      roughCanvas.line(maxX, minY, minX, maxY, options);
    }
    // If imageData exists, it will be rendered separately in the draw function
  },
  stickyNote: (x1, y1, x2, y2, roughCanvas, options, element) => {
    const width = Math.abs(x2 - x1);
    const height = Math.abs(y2 - y1);
    const minX = Math.min(x1, x2);
    const minY = Math.min(y1, y2);
      // Don't draw rough border for sticky notes - they'll be rendered with custom styling
    // The note content will be rendered separately in the draw function
    if (!element?.title?.trim() && !element?.content?.trim()) {
      // Only show dashed rectangle during creation when both title and content are empty
      const noteOptions = { ...options, strokeLineDash: [5, 5] };
      roughCanvas.rectangle(minX, minY, Math.max(width, 150), Math.max(height, 100), noteOptions);
    }
  },
};

export function distance(a, b) {
  return Math.sqrt(Math.pow(a.x - b.x, 2) + Math.pow(a.y - b.y, 2));
}

export function getFocuseDemention(element, padding) {
  const { x1, y1, x2, y2, tool } = element;

  if (tool == "line" || tool == "arrow")
    return { fx: x1, fy: y1, fw: x2, fh: y2 };

  // For draw tool with points, calculate bounding box from points
  if (tool === "draw" && element.points && element.points.length > 1) {
    const xCoords = element.points.map(p => p.x);
    const yCoords = element.points.map(p => p.y);
    const minX = Math.min(...xCoords);
    const maxX = Math.max(...xCoords);
    const minY = Math.min(...yCoords);
    const maxY = Math.max(...yCoords);
    
    const p = { min: padding, max: padding * 2 };
    return {
      fx: minX - p.min,
      fy: minY - p.min,
      fw: maxX - minX + p.max,
      fh: maxY - minY + p.max,
    };
  }

  const p = { min: padding, max: padding * 2 };
  const minX = Math.min(x1, x2);
  const maxX = Math.max(x1, x2);
  const minY = Math.min(y1, y2);
  const maxY = Math.max(y1, y2);

  return {
    fx: minX - p.min,
    fy: minY - p.min,
    fw: maxX - minX + p.max,
    fh: maxY - minY + p.max,
  };
}

export function getFocuseCorners(element, padding, position) {
  let { fx, fy, fw, fh } = getFocuseDemention(element, padding);

  if (element.tool == "line" || element.tool == "arrow") {
    return {
      line: { fx, fy, fw, fh },
      corners: [
        {
          slug: "l1",
          x: fx - position,
          y: fy - position,
        },
        {
          slug: "l2",
          x: fw - position,
          y: fh - position,
        },
      ],
    };
  }
  
  // For draw tool, don't show resize corners
  if (element.tool === "draw") {
    return {
      line: { fx, fy, fw, fh },
      corners: [], // No resize corners for freehand drawings
    };
  }
  
  return {
    line: { fx, fy, fw, fh },
    corners: [
      {
        slug: "tl",
        x: fx - position,
        y: fy - position,
      },
      {
        slug: "tr",
        x: fx + fw - position,
        y: fy - position,
      },
      {
        slug: "bl",
        x: fx - position,
        y: fy + fh - position,
      },
      {
        slug: "br",
        x: fx + fw - position,
        y: fy + fh - position,
      },
      {
        slug: "tt",
        x: fx + fw / 2 - position,
        y: fy - position,
      },
      {
        slug: "rr",
        x: fx + fw - position,
        y: fy + fh / 2 - position,
      },
      {
        slug: "ll",
        x: fx - position,
        y: fy + fh / 2 - position,
      },
      {
        slug: "bb",
        x: fx + fw / 2 - position,
        y: fy + fh - position,
      },
    ],
  };
}

export function drawFocuse(element, context, padding, scale) {
  const lineWidth = 1 / scale;
  const square = 10 / scale;
  let round = square;
  const position = square / 2;

  let demention = getFocuseCorners(element, padding, position);
  let { fx, fy, fw, fh } = demention.line;
  let corners = demention.corners;

  // Use traditional canvas for focus elements (selection UI should be crisp)
  context.lineWidth = lineWidth;
  context.strokeStyle = "#211C6A";
  context.fillStyle = "#EEF5FF";

  if (element.tool != "line" && element.tool != "arrow") {
    context.beginPath();
    context.rect(fx, fy, fw, fh);
    context.setLineDash([0, 0]);
    context.stroke();
    context.closePath();
    round = 3 / scale;
  }

  context.beginPath();
  corners.forEach((corner) => {
    context.roundRect(corner.x, corner.y, square, square, round);
  });
  context.fill();
  context.stroke();
  context.closePath();
}

export function draw(element, context) {
  const {
    tool,
    x1,
    y1,
    x2,
    y2,
    strokeWidth,
    strokeColor,
    strokeStyle,
    fill,
    opacity,
  } = element;

  // Create rough canvas instance
  const roughCanvas = rough.canvas(context.canvas);
  
  // Convert stroke style to rough.js options
  let roughnessValue = 1;
  let strokeLineDash = undefined;
  
  if (strokeStyle === "dashed") {
    strokeLineDash = [strokeWidth * 3, strokeWidth * 2];
  } else if (strokeStyle === "dotted") {
    strokeLineDash = [strokeWidth, strokeWidth];
  }

  // Prepare rough.js options
  // Create a consistent numeric seed from element ID to ensure stable sketchy appearance
  let seed = 1;
  if (element.id) {
    // Convert the element ID string to a consistent number
    for (let i = 0; i < element.id.length; i++) {
      seed = (seed * 31 + element.id.charCodeAt(i)) % 1000000;
    }
  }
  
  const options = {
    stroke: rgba(strokeColor, opacity),
    strokeWidth: strokeWidth,
    fill: fill === "transparent" ? undefined : rgba(fill, opacity),
    fillStyle: 'solid',
    roughness: roughnessValue,
    strokeLineDash: strokeLineDash,
    seed: seed, // Use consistent numeric seed for stable appearance
  };

  // Draw the shape using rough.js (only if the tool is a valid drawing tool)
  if (shapes[tool]) {
    shapes[tool](x1, y1, x2, y2, roughCanvas, options, element);
  }
  
  // Handle special rendering for text and image elements
  if (tool === "text" && element.text) {
    // Validate coordinates and font size before rendering
    if (!isFinite(x1) || !isFinite(y1) || !isFinite(x2) || !isFinite(y2)) {
      return; // Skip rendering invalid coordinates
    }
    
    const fontSize = element.fontSize || 24;
    if (!isFinite(fontSize) || fontSize <= 0 || fontSize > 1000) {
      return; // Skip rendering invalid font size
    }
    
    const textWidth = Math.abs(x2 - x1);
    const textHeight = Math.abs(y2 - y1);
    
    // Always render text, even if the box is very small
    // The text may overflow the box boundaries, which is intentional
    
    // Render actual text with wrapping
    context.save();
    try {
      // Ensure font family is valid and fallback to Arial if needed
      const fontFamily = element.fontFamily || 'Arial, sans-serif';
      // Clamp font size to ensure it's always valid
      const clampedFontSize = Math.max(6, Math.min(300, fontSize));
      context.font = `${clampedFontSize}px ${fontFamily}`;
      context.fillStyle = rgba(strokeColor, opacity);
      context.textBaseline = 'top';
      
      const lineHeight = clampedFontSize * 1.2;
      
      // Split text by explicit line breaks first
      const paragraphs = element.text.split('\n');
      let currentY = y1;
    
    paragraphs.forEach((paragraph, paragraphIndex) => {
      if (paragraph.trim() === '') {
        // Empty line - just add spacing (always render, don't clip)
        currentY += lineHeight;
        return;
      }
      
      // Wrap text within the bounding box width
      const words = paragraph.split(' ');
      let currentLine = '';
      
      for (let i = 0; i < words.length; i++) {
        const testLine = currentLine + (currentLine ? ' ' : '') + words[i];
        const metrics = context.measureText(testLine);
        
        if (metrics.width > textWidth && currentLine !== '') {
          // Current line is too wide, render it and start new line
          // Always render text, even if it goes beyond box height
          context.fillText(currentLine, x1, currentY);
          currentY += lineHeight;
          currentLine = words[i];
        } else {
          currentLine = testLine;
        }
        
        // Handle long single words that don't fit in width
        if (currentLine && context.measureText(currentLine).width > textWidth) {
          // For very long words, render them anyway (they'll overflow horizontally)
          // This ensures no text is ever hidden due to width constraints
          context.fillText(currentLine, x1, currentY);
          currentY += lineHeight;
          currentLine = '';
          continue;
        }
      }
      
      // Render the last line (always render, no height clipping)
      if (currentLine) {
        context.fillText(currentLine, x1, currentY);
        currentY += lineHeight;
      }
    });
    
    } catch (error) {
      console.warn("Error rendering text:", error);
    } finally {
      context.restore();
    }
  }
    if (tool === "image" && element.imageData) {
    // Render actual image with caching to prevent flickering
    let cachedImage = imageCache.get(element.imageData);
    
    if (!cachedImage) {
      // Create and cache the image only once per unique imageData
      cachedImage = new Image();
      cachedImage.src = element.imageData;
      imageCache.set(element.imageData, cachedImage);
    }
    
    // Check if image is loaded before drawing
    if (cachedImage.complete && cachedImage.naturalWidth > 0) {
      const width = x2 - x1;
      const height = y2 - y1;
      context.drawImage(cachedImage, x1, y1, width, height);
    }
    // Note: If image is still loading, it will appear on the next redraw
  }
  if (tool === "stickyNote") {
    // Render sticky note with custom styling
    context.save();
    try {
      const width = Math.abs(x2 - x1);
      const height = Math.abs(y2 - y1);
      const minX = Math.min(x1, x2);
      const minY = Math.min(y1, y2);
      
      // Set note opacity
      const noteOpacity = element.opacity || 0.85;
      
      // Draw note background with corner fold effect
      context.globalAlpha = noteOpacity;
      
      // Main note rectangle
      context.fillStyle = element.noteColor || "#fef3c7";
      context.fillRect(minX, minY, width, height);
      
      // Draw corner fold (top-right corner)
      const foldSize = Math.min(20, width * 0.15, height * 0.15);
      context.fillStyle = element.noteColor ? 
        adjustColorBrightness(element.noteColor, -20) : "#fbbf24";
      
      context.beginPath();
      context.moveTo(minX + width - foldSize, minY);
      context.lineTo(minX + width, minY);
      context.lineTo(minX + width, minY + foldSize);
      context.closePath();
      context.fill();
      
      // Draw fold line
      context.strokeStyle = element.noteColor ? 
        adjustColorBrightness(element.noteColor, -40) : "#f59e0b";
      context.lineWidth = 1;
      context.beginPath();
      context.moveTo(minX + width - foldSize, minY);
      context.lineTo(minX + width, minY + foldSize);
      context.stroke();
        // Reset opacity for text
      context.globalAlpha = 1;
      
      // Render title and content without height restrictions (auto-resize will handle sizing)
      const padding = 12;
      const foldAreaPadding = foldSize + 4; // Extra padding to avoid the fold area
      const textX = minX + padding;
      let textY = minY + padding;
      const maxTextWidth = width - padding * 2 - foldAreaPadding;
      
      context.fillStyle = element.textColor || "#451a03";
      context.textBaseline = 'top';
        // Render title (bold)
      if (element.title && element.title.trim() && maxTextWidth > 0) {
        const titleSize = Math.max(11, Math.min(16, width / 12));
        context.font = `bold ${titleSize}px Arial, sans-serif`;
        const titleLineHeight = titleSize * 1.3;
        
        // Wrap title text
        const titleLines = wrapText(context, element.title, maxTextWidth);
        for (const line of titleLines) {
          context.fillText(line, textX, textY);
          textY += titleLineHeight;
        }
        
        // Add space between title and content
        if (element.content && element.content.trim()) {
          textY += titleSize * 0.4;
        }
      }
      
      // Render content (normal weight)
      if (element.content && element.content.trim() && maxTextWidth > 0) {
        const contentSize = Math.max(9, Math.min(13, width / 15));
        context.font = `${contentSize}px Arial, sans-serif`;
        const contentLineHeight = contentSize * 1.3;
        
        // Wrap content text
        const contentLines = wrapText(context, element.content, maxTextWidth);
        for (const line of contentLines) {
          context.fillText(line, textX, textY);
          textY += contentLineHeight;
        }
      }
      
    } catch (error) {
      console.warn("Error rendering sticky note:", error);
    } finally {
      context.restore();
    }
  }
}

function rgba(color, opacity) {
  if (color == "transparent") return "transparent";

  // Handle hex colors (e.g., #fff3a0, #333)
  if (color.startsWith('#')) {
    let hex = color.substring(1);
    
    // Convert 3-digit hex to 6-digit
    if (hex.length === 3) {
      hex = hex.split('').map(char => char + char).join('');
    }
    
    if (hex.length === 6) {
      const red = parseInt(hex.substring(0, 2), 16);
      const green = parseInt(hex.substring(2, 4), 16);
      const blue = parseInt(hex.substring(4, 6), 16);
      const alpha = opacity / 100;
      
      return `rgba(${red}, ${green}, ${blue}, ${alpha})`;
    }
  }

  // Handle rgb/rgba colors
  let matches = color.match(
    /^rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*(\d+(?:\.\d+)?))?\)$/
  );
  if (!matches) {
    throw new Error(
      "Invalid color format. Please provide a color in RGB, RGBA, or hex format."
    );
  }
  opacity /= 100;
  let red = parseInt(matches[1]);
  let green = parseInt(matches[2]);
  let blue = parseInt(matches[3]);
  let alpha = parseFloat(matches[4] * opacity || opacity);

  let newColor = `rgba(${red}, ${green}, ${blue}, ${alpha})`;

  return newColor;
}

export function inSelectedCorner(element, x, y, padding, scale) {
  padding = element.tool == "line" || element.tool == "arrow" ? 0 : padding;

  const square = 10 / scale;
  const position = square / 2;

  const corners = getFocuseCorners(element, padding, position).corners;

  const hoveredCorner = corners.find(
    (corner) =>
      x - corner.x <= square &&
      x - corner.x >= 0 &&
      y - corner.y <= square &&
      y - corner.y >= 0
  );

  return hoveredCorner;
}

export function cornerCursor(corner) {
  switch (corner) {
    case "tt":
    case "bb":
      return "s-resize";
    case "ll":
    case "rr":
      return "e-resize";
    case "tl":
    case "br":
      return "se-resize";
    case "tr":
    case "bl":
      return "ne-resize";
    case "l1":
    case "l2":
      return "pointer";
  }
}

export function drawMultiSelection(selectedElements, context, scale) {
  if (selectedElements.length <= 1) return;

  const lineWidth = 1 / scale;
  
  selectedElements.forEach((element) => {
    const { x1, y1, x2, y2 } = element;
    
    // Draw selection border using traditional canvas for crisp UI
    context.lineWidth = lineWidth;
    context.strokeStyle = "#3b82f6"; // Blue color for multi-selection
    context.setLineDash([4 / scale, 4 / scale]); // Dashed line
    
    context.beginPath();
    
    if (element.tool === "line" || element.tool === "arrow") {
      // For lines and arrows, draw a simple line highlight
      context.moveTo(x1, y1);
      context.lineTo(x2, y2);
    } else {
      // For shapes, draw a rectangle around them
      const minX = Math.min(x1, x2);
      const maxX = Math.max(x1, x2);
      const minY = Math.min(y1, y2);
      const maxY = Math.max(y1, y2);
      
      context.rect(minX, minY, maxX - minX, maxY - minY);
    }
    
    context.stroke();
    context.closePath();
  });
  
  // Reset line dash
  context.setLineDash([]);
}

// Enhanced draw function with auto-resize capability for sticky notes
export function drawWithAutoResize(element, context, setElements, elements) {
  // For sticky notes, check if auto-resize is needed before drawing
  if (element.tool === "stickyNote" && setElements && elements) {
    // Auto-resize the element if needed
    element = autoResizeStickyNote(element, context, setElements, elements);
  }
  
  // Use the regular draw function
  return draw(element, context);
}

// Helper function to adjust color brightness for sticky note fold effect
function adjustColorBrightness(color, amount) {
  const matches = color.match(/^#([0-9a-f]{6})$/i);
  if (matches) {
    const [, hex] = matches;
    let r = parseInt(hex.substr(0, 2), 16);
    let g = parseInt(hex.substr(2, 2), 16);
    let b = parseInt(hex.substr(4, 2), 16);
    
    r = Math.max(0, Math.min(255, r + amount));
    g = Math.max(0, Math.min(255, g + amount));
    b = Math.max(0, Math.min(255, b + amount));
    
    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
  }
  return color;
}

// Helper function to wrap text for sticky notes
function wrapText(context, text, maxWidth) {
  if (!text) return [];
  
  // Split by explicit line breaks first (handle Shift+Enter)
  const paragraphs = text.split('\n');
  const lines = [];

  paragraphs.forEach((paragraph, paragraphIndex) => {
    if (paragraph.trim() === '') {
      // Empty line - preserve the spacing
      lines.push('');
      return;
    }

    const words = paragraph.split(' ');
    if (words.length === 0) return;
    
    let currentLine = words[0] || '';

    for (let i = 1; i < words.length; i++) {
      const word = words[i];
      const testLine = currentLine + " " + word;
      const width = context.measureText(testLine).width;
      
      if (width < maxWidth) {
        currentLine = testLine;
      } else {
        // Current line is full, push it and start new line
        lines.push(currentLine);
        currentLine = word;
        
        // Handle very long words that exceed maxWidth
        while (context.measureText(currentLine).width > maxWidth && currentLine.length > 1) {
          // Break the word if it's too long
          const breakPoint = Math.floor(currentLine.length * maxWidth / context.measureText(currentLine).width);
          lines.push(currentLine.substring(0, breakPoint) + '-');
          currentLine = currentLine.substring(breakPoint);
        }
      }
    }
    
    // Push the last line of this paragraph
    if (currentLine) {
      lines.push(currentLine);
    }
  });

  return lines;
}

// Helper function to calculate required height for sticky note content
function calculateStickyNoteRequiredHeight(element, context) {
  if (!element.title && !element.content) {
    return Math.abs(element.y2 - element.y1); // Return current height if no content
  }
  
  const width = Math.abs(element.x2 - element.x1);
  const padding = 12;
  const foldSize = Math.min(20, width * 0.15);
  const foldAreaPadding = foldSize + 4;
  const maxTextWidth = width - padding * 2 - foldAreaPadding;
  
  if (maxTextWidth <= 0) {
    return Math.abs(element.y2 - element.y1); // Return current height if no space for text
  }
  
  let totalHeight = padding * 2; // Top and bottom padding
  
  // Calculate title height
  if (element.title && element.title.trim()) {
    const titleSize = Math.max(11, Math.min(16, width / 12));
    context.font = `bold ${titleSize}px Arial, sans-serif`;
    const titleLineHeight = titleSize * 1.3;
    const titleLines = wrapText(context, element.title, maxTextWidth);
    totalHeight += titleLines.length * titleLineHeight;
    
    // Add space between title and content if both exist
    if (element.content && element.content.trim()) {
      totalHeight += titleSize * 0.4;
    }
  }
  
  // Calculate content height
  if (element.content && element.content.trim()) {
    const contentSize = Math.max(9, Math.min(13, width / 15));
    context.font = `${contentSize}px Arial, sans-serif`;
    const contentLineHeight = contentSize * 1.3;
    const contentLines = wrapText(context, element.content, maxTextWidth);
    totalHeight += contentLines.length * contentLineHeight;
  }
  
  // Add some extra padding to prevent text from being too close to the bottom
  totalHeight += 8;
  
  return Math.max(totalHeight, 100); // Minimum height of 100px
}

// Helper function to auto-resize sticky note if needed
function autoResizeStickyNote(element, context, setElements, elements) {
  const currentHeight = Math.abs(element.y2 - element.y1);
  const requiredHeight = calculateStickyNoteRequiredHeight(element, context);
  
  // Only resize if content requires more height than current
  if (requiredHeight > currentHeight) {
    const heightDifference = requiredHeight - currentHeight;
    
    // Update the element's height
    const updatedElement = {
      ...element,
      y2: element.y1 < element.y2 ? element.y2 + heightDifference : element.y2 - heightDifference
    };
    
    // Update the elements array
    if (setElements && elements) {
      const updatedElements = elements.map(el => 
        el.id === element.id ? updatedElement : el
      );
      setElements(updatedElements);
    }
    
    return updatedElement;
  }
  
  return element;
}
