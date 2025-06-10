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
  },  line: (x1, y1, x2, y2, roughCanvas, options) => {
    // Handle dotted lines with custom round dots
    if (options.strokeLineDash && options.strokeLineDash.length === 2) {
      const context = roughCanvas.canvas.getContext('2d');
      const dotSize = options.strokeLineDash[0];
      const spacing = options.strokeLineDash[1];
      
      // Check if this looks like a dotted pattern (small dot size)
      if (dotSize < options.strokeWidth * 1.2) {
        context.save();
        context.fillStyle = options.stroke;
        
        // Calculate line properties
        const lineLength = Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
        const angle = Math.atan2(y2 - y1, x2 - x1);
        const totalSpacing = dotSize + spacing;
        const numDots = Math.floor(lineLength / totalSpacing) + 1;
        
        // Draw round dots along the line
        for (let i = 0; i < numDots; i++) {
          const distance = i * totalSpacing;
          if (distance > lineLength) break;
          
          const dotX = x1 + Math.cos(angle) * distance;
          const dotY = y1 + Math.sin(angle) * distance;
          
          context.beginPath();
          context.arc(dotX, dotY, dotSize / 2, 0, Math.PI * 2);
          context.fill();
        }
        
        context.restore();
        return;
      }
    }
    
    // Default line rendering
    roughCanvas.line(x1, y1, x2, y2, options);
  },  rectangle: (x1, y1, x2, y2, roughCanvas, options, element) => {
    const width = x2 - x1;
    const height = y2 - y1;
    // Fallback to "rounded" for elements that don't have cornerStyle property (backwards compatibility)
    const cornerStyle = element?.cornerStyle !== undefined ? element.cornerStyle : "rounded";
    const sloppiness = options.roughness || 1;
    
    // If we want sharp corners OR very low sloppiness, use native canvas for crisp rendering
    if (cornerStyle === "sharp" && sloppiness <= 0.5) {
      const context = roughCanvas.canvas.getContext('2d');
      context.save();
      
      // Set up stroke properties for clean corners
      context.strokeStyle = options.stroke;
      context.lineWidth = options.strokeWidth;
      context.lineJoin = 'miter';
      context.miterLimit = 10;
      context.lineCap = 'round';
      
      // Handle fill
      if (options.fill) {
        context.fillStyle = options.fill;
        context.fillRect(x1, y1, width, height);
      }
      
      // Handle stroke with dash patterns
      if (options.strokeLineDash) {
        context.setLineDash(options.strokeLineDash);
      }
      
      // Draw rectangle stroke
      context.strokeRect(x1, y1, width, height);
      
      context.restore();
    } else if (cornerStyle === "rounded") {
      // For rounded corners, we need to create a custom path and let rough.js render it
      const cornerRadius = Math.min(20, Math.min(Math.abs(width), Math.abs(height)) * 0.15);
      const r = Math.min(cornerRadius, Math.abs(width) / 2, Math.abs(height) / 2);
      
      if (r > 0) {
        // Create rounded rectangle path as a series of lines and arcs
        // We'll use rough.js curve and line functions to maintain the hand-drawn effect
        const context = roughCanvas.canvas.getContext('2d');
        
        // Calculate the path points for rounded rectangle
        const path = [];
        
        // Top edge (left to right, starting after left corner)
        path.push(['M', x1 + r, y1]);
        path.push(['L', x1 + width - r, y1]);
        
        // Top-right corner (arc)
        path.push(['Q', x1 + width, y1, x1 + width, y1 + r]);
        
        // Right edge (top to bottom)
        path.push(['L', x1 + width, y1 + height - r]);
        
        // Bottom-right corner (arc)
        path.push(['Q', x1 + width, y1 + height, x1 + width - r, y1 + height]);
        
        // Bottom edge (right to left)
        path.push(['L', x1 + r, y1 + height]);
        
        // Bottom-left corner (arc)
        path.push(['Q', x1, y1 + height, x1, y1 + height - r]);
        
        // Left edge (bottom to top)
        path.push(['L', x1, y1 + r]);
        
        // Top-left corner (arc)
        path.push(['Q', x1, y1, x1 + r, y1]);
        
        // Close the path
        path.push(['Z']);
        
        // Convert path to rough.js path format
        const pathString = path.map(segment => {
          if (segment[0] === 'M' || segment[0] === 'L') {
            return `${segment[0]} ${segment[1]} ${segment[2]}`;
          } else if (segment[0] === 'Q') {
            return `${segment[0]} ${segment[1]} ${segment[2]} ${segment[3]} ${segment[4]}`;
          } else {
            return segment[0];
          }
        }).join(' ');
        
        // Use rough.js to draw the path with sloppiness
        roughCanvas.path(pathString, options);
      } else {
        // If radius is 0, just draw a regular rectangle
        roughCanvas.rectangle(x1, y1, width, height, options);
      }
    } else {
      // Use rough.js for thinner strokes to maintain hand-drawn aesthetic
      // Note: rough.js doesn't support rounded corners, so use regular rectangle
      roughCanvas.rectangle(x1, y1, width, height, options);
    }
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

  if (tool == "line" || tool == "arrow") {
    // For lines and arrows, calculate proper bounding box dimensions
    const minX = Math.min(x1, x2);
    const maxX = Math.max(x1, x2);
    const minY = Math.min(y1, y2);
    const maxY = Math.max(y1, y2);
    
    // Add minimum dimensions for very short lines/arrows to ensure they're selectable
    const width = Math.max(maxX - minX, 10);
    const height = Math.max(maxY - minY, 10);
    
    return { 
      fx: minX - padding, 
      fy: minY - padding, 
      fw: width + padding * 2, 
      fh: height + padding * 2 
    };
  }

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
    // For lines and arrows, use the actual start and end points for corner positions
    const { x1, y1, x2, y2 } = element;
    return {
      line: { fx, fy, fw, fh },
      corners: [
        {
          slug: "l1",
          x: x1 - position,
          y: y1 - position,
        },
        {
          slug: "l2",
          x: x2 - position,
          y: y2 - position,
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

  if (element.tool == "line" || element.tool == "arrow") {
    // For lines and arrows, draw a highlighted line along the actual path
    context.save();
    context.lineWidth = Math.max(3 / scale, lineWidth * 2); // Slightly thicker than normal
    context.strokeStyle = "#211C6A";
    context.setLineDash([]);
    context.globalAlpha = 0.7;
    
    context.beginPath();
    context.moveTo(element.x1, element.y1);
    context.lineTo(element.x2, element.y2);
    context.stroke();
    context.closePath();
    
    context.restore();
  } else {
    // For other shapes, draw the bounding box
    context.beginPath();
    context.rect(fx, fy, fw, fh);
    context.setLineDash([0, 0]);
    context.stroke();
    context.closePath();
    round = 3 / scale;
  }

  // Draw corner handles for resizing
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
    sloppiness,
    cornerStyle,
  } = element;

  // Create rough canvas instance
  const roughCanvas = rough.canvas(context.canvas);  // Convert stroke style to rough.js options
  let roughnessValue = sloppiness !== undefined ? sloppiness : 1;
  let strokeLineDash = undefined;
  
  if (strokeStyle === "dashed") {
    strokeLineDash = [strokeWidth * 8, strokeWidth * 5];
  } else if (strokeStyle === "dotted") {
    strokeLineDash = [strokeWidth * 0.8, strokeWidth * 1.5];
  }

  // Prepare rough.js options
  // Create a consistent numeric seed from element ID to ensure stable sketchy appearance
  let seed = 1;
  if (element.id) {
    // Convert the element ID string to a consistent number
    for (let i = 0; i < element.id.length; i++) {
      seed = (seed * 31 + element.id.charCodeAt(i)) % 1000000;
    }
  }  // Handle fill patterns for transparent fills
  let fillColor = fill;
  let fillStyle = "solid";
  
  if (fill === "transparent" && element.fillPattern && element.fillPattern !== "solid") {
    // For transparent backgrounds with patterns, use a semi-transparent stroke color
    fillColor = rgba(strokeColor, 0.3);
    fillStyle = element.fillPattern === "cross-hatch" ? "cross-hatch" : "hachure";
  } else if (fill !== "transparent") {
    fillColor = rgba(fill, opacity);
    fillStyle = element.fillPattern === "hachure" ? "hachure" : 
               element.fillPattern === "cross-hatch" ? "cross-hatch" : "solid";
  }

  const options = {
    stroke: rgba(strokeColor, opacity),
    strokeWidth: strokeWidth,
    fill: fill === "transparent" && element.fillPattern === "solid" ? undefined : fillColor,
    fillStyle: fillStyle,
    roughness: roughnessValue,
    strokeLineDash: strokeLineDash,
    seed: seed, // Use consistent numeric seed for stable appearance
  };
  // Draw the shape using rough.js (only if the tool is a valid drawing tool)
  if (shapes[tool]) {
    shapes[tool](x1, y1, x2, y2, roughCanvas, options, element);
  }
  
  // Handle text rendering for ALL elements that have text content (not just text tool)
  if (element.text && element.text.trim() && (tool === "text" || tool === "rectangle" || tool === "circle" || tool === "diamond")) {
    // Validate coordinates and font size before rendering
    if (!isFinite(x1) || !isFinite(y1) || !isFinite(x2) || !isFinite(y2)) {
      return; // Skip rendering invalid coordinates
    }
    
    // Calculate text rendering properties
    const width = Math.abs(x2 - x1);
    const height = Math.abs(y2 - y1);
    const centerX = x1 + (x2 - x1) / 2;
    const centerY = y1 + (y2 - y1) / 2;
    
    // Determine font size based on element size (responsive text)
    let fontSize = 16;
    if (tool === "text") {
      fontSize = element.fontSize || 24;
    } else {
      // For shapes, calculate responsive font size
      fontSize = Math.max(10, Math.min(24, Math.min(width, height) / 8));
    }
    
    if (!isFinite(fontSize) || fontSize <= 0 || fontSize > 1000) {
      return; // Skip rendering invalid font size
    }
    
    // Render text centered in the shape
    context.save();
    try {
      const fontFamily = element.fontFamily || 'Arial, sans-serif';
      const clampedFontSize = Math.max(6, Math.min(300, fontSize));
      context.font = `${clampedFontSize}px ${fontFamily}`;
      
      // Use contrasting text color for shapes
      if (tool === "text") {
        context.fillStyle = rgba(strokeColor, opacity);
      } else {
        // For shapes, use white text if shape is dark, black text if shape is light
        const isDarkShape = fill !== "transparent" && isColorDark(fill);
        context.fillStyle = isDarkShape ? "white" : "black";
      }
      
      context.textAlign = tool === "text" ? "left" : "center";
      context.textBaseline = tool === "text" ? "top" : "middle";
      
      const lineHeight = clampedFontSize * 1.2;
      
      // Split text by line breaks
      const lines = element.text.split('\n');
      const totalTextHeight = lines.length * lineHeight;
      
      // Calculate starting Y position for centered text
      let startY = tool === "text" ? y1 : centerY - totalTextHeight / 2 + lineHeight / 2;
      
      lines.forEach((line, index) => {
        if (line.trim()) {
          const textX = tool === "text" ? x1 : centerX;
          const textY = startY + (index * lineHeight);
          
          // For shapes, ensure text fits within boundaries
          if (tool !== "text") {
            const textWidth = context.measureText(line).width;
            if (textWidth > width * 0.9) {
              // If text is too wide, reduce font size and re-render
              const scaleFactor = (width * 0.9) / textWidth;
              const newFontSize = Math.max(8, clampedFontSize * scaleFactor);
              context.font = `${newFontSize}px ${fontFamily}`;
            }
          }
          
          context.fillText(line, textX, textY);
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

// Helper function to determine if a color is dark
function isColorDark(color) {
  if (!color || color === "transparent") return false;
  
  // Handle hex colors
  if (color.startsWith('#')) {
    let hex = color.substring(1);
    // Convert 3-digit hex to 6-digit
    if (hex.length === 3) {
      hex = hex.split('').map(char => char + char).join('');
    }
    
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    
    // Calculate relative luminance
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    return luminance < 0.5;
  }
  
  // Handle rgb colors
  if (color.startsWith('rgb')) {
    const matches = color.match(/\d+/g);
    if (matches && matches.length >= 3) {
      const r = parseInt(matches[0]);
      const g = parseInt(matches[1]);
      const b = parseInt(matches[2]);
      const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
      return luminance < 0.5;
    }
  }
  
  return false;
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
