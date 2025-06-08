import rough from 'roughjs';

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
};

export function distance(a, b) {
  return Math.sqrt(Math.pow(a.x - b.x, 2) + Math.pow(a.y - b.y, 2));
}

export function getFocuseDemention(element, padding) {
  const { x1, y1, x2, y2 } = element;

  if (element.tool == "line" || element.tool == "arrow")
    return { fx: x1, fy: y1, fw: x2, fh: y2 };

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
    shapes[tool](x1, y1, x2, y2, roughCanvas, options);
  }
}

function rgba(color, opacity) {
  if (color == "transparent") return "transparent";

  let matches = color.match(
    /^rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*(\d+(?:\.\d+)?))?\)$/
  );
  if (!matches) {
    throw new Error(
      "Invalid color format. Please provide a color in RGBA format."
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
