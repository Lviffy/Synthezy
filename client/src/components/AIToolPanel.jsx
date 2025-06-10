import React, { useState, useCallback, useEffect } from 'react';
import { useAppContext } from '../provider/AppStates';
import { aiService } from '../utils/aiService';

/**
 * Position new elements away from existing elements to avoid overlap
 * @param {Array} newElements - Elements to position
 * @param {Array} existingElements - Currently placed elements
 * @param {Object} viewportData - Object containing viewport information (translate, scale, dimension, currentMousePosition)
 * @returns {Array} Elements with updated positions
 */
function positionElementsAwayFromExisting(newElements, existingElements, viewportData) {
  console.log('🎯 Positioning new elements away from existing ones...');
  console.log('📊 Existing elements count:', existingElements.length);
  console.log('🆕 New elements count:', newElements.length);
  console.log('ビューポートデータ:', viewportData); // Log viewport data

  if (!existingElements || existingElements.length === 0) {
    // No existing elements, attempt to position in the center of the viewport
    console.log('✅ No existing elements, positioning in viewport center');
    const { dimension, scale, translate, currentMousePosition } = viewportData;
    const viewportWidth = dimension.width / scale;
    const viewportHeight = dimension.height / scale;
    const viewportCenterX = (-translate.x / scale) + (viewportWidth / 2);
    const viewportCenterY = (-translate.y / scale) + (viewportHeight / 2);

    let targetX = viewportCenterX;
    let targetY = viewportCenterY;

    // If currentMousePosition is available and valid, use it
    if (currentMousePosition && typeof currentMousePosition.x === 'number' && typeof currentMousePosition.y === 'number') {
        // Ensure mouse position is transformed to canvas coordinates if it's not already
        // Assuming currentMousePosition is already in canvas coordinates as per previous context
        targetX = currentMousePosition.x;
        targetY = currentMousePosition.y;
    }
    
    const newBounds = calculateElementGroupBounds(newElements);
    // Calculate offset to center the new elements group at targetX, targetY
    const offsetX = targetX - (newBounds.minX + newBounds.width / 2);
    const offsetY = targetY - (newBounds.minY + newBounds.height / 2);

    return newElements.map(element => {
      const newElement = {
        ...element,
        x1: element.x1 + offsetX,
        y1: element.y1 + offsetY,
        x2: element.x2 + offsetX,
        y2: element.y2 + offsetY
      };
      if (element.tool === 'draw' && element.points && Array.isArray(element.points)) {
        newElement.points = element.points.map(point => ({
          x: point.x + offsetX,
          y: point.y + offsetY
        }));
      }
      return newElement;
    });
  }
  // Calculate bounds of new elements group
  const newBounds = calculateElementGroupBounds(newElements);
  console.log('📐 New elements bounds:', newBounds);
  
  // Find a position that doesn't overlap with any existing elements
  const placement = findNonOverlappingPosition(newBounds, existingElements, viewportData);
  console.log('📍 Selected placement:', placement);
    // Apply the offset to all new elements
  const positionedElements = newElements.map(element => {
    const newElement = {
      ...element,
      x1: element.x1 + placement.offsetX,
      y1: element.y1 + placement.offsetY,
      x2: element.x2 + placement.offsetX,
      y2: element.y2 + placement.offsetY
    };

    // Handle special element types that have additional position data
    if (element.tool === 'draw' && element.points && Array.isArray(element.points)) {
      // Move all points for freehand drawings
      newElement.points = element.points.map(point => ({
        x: point.x + placement.offsetX,
        y: point.y + placement.offsetY
      }));
    }

    return newElement;
  });

  console.log('✅ Elements positioned successfully');
  return positionedElements;
}

/**
 * Calculate the bounding box of a group of elements
 * @param {Array} elements - Elements to calculate bounds for
 * @returns {Object} Bounds with minX, minY, maxX, maxY, width, height
 */
function calculateElementGroupBounds(elements) {
  if (!elements || elements.length === 0) {
    return { minX: 0, minY: 0, maxX: 0, maxY: 0, width: 0, height: 0 };
  }

  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;

  elements.forEach(element => {
    const x1 = Math.min(element.x1, element.x2);
    const y1 = Math.min(element.y1, element.y2);
    const x2 = Math.max(element.x1, element.x2);
    const y2 = Math.max(element.y1, element.y2);

    minX = Math.min(minX, x1);
    minY = Math.min(minY, y1);
    maxX = Math.max(maxX, x2);
    maxY = Math.max(maxY, y2);
  });

  return {
    minX,
    minY,
    maxX,
    maxY,
    width: maxX - minX,
    height: maxY - minY
  };
}

/**
 * Check if two rectangles overlap
 * @param {Object} rect1 - First rectangle with minX, minY, maxX, maxY
 * @param {Object} rect2 - Second rectangle with minX, minY, maxX, maxY
 * @param {number} padding - Minimum distance between rectangles
 * @returns {boolean} True if rectangles overlap (including padding)
 */
function rectanglesOverlap(rect1, rect2, padding = 0) {
  return !(rect1.maxX + padding < rect2.minX || 
           rect2.maxX + padding < rect1.minX || 
           rect1.maxY + padding < rect2.minY || 
           rect2.maxY + padding < rect1.minY);
}

/**
 * Get bounding rectangle of a single element
 * @param {Object} element - Element to get bounds for
 * @returns {Object} Bounds with minX, minY, maxX, maxY
 */
function getElementBounds(element) {
  return {
    minX: Math.min(element.x1, element.x2),
    minY: Math.min(element.y1, element.y2),
    maxX: Math.max(element.x1, element.x2),
    maxY: Math.max(element.y1, element.y2)
  };
}

/**
 * Check if positioned elements would overlap with any existing elements
 * @param {Object} newBounds - Bounds of new element group
 * @param {number} offsetX - X offset to test
 * @param {number} offsetY - Y offset to test
 * @param {Array} existingElements - Array of existing elements
 * @param {number} padding - Minimum distance between elements
 * @returns {boolean} True if there would be overlap
 */
function wouldOverlap(newBounds, offsetX, offsetY, existingElements, padding = 50) {
  const positionedBounds = {
    minX: newBounds.minX + offsetX,
    minY: newBounds.minY + offsetY,
    maxX: newBounds.maxX + offsetX,
    maxY: newBounds.maxY + offsetY
  };

  // Check overlap with each existing element
  for (const existingElement of existingElements) {
    const existingBounds = getElementBounds(existingElement);
    if (rectanglesOverlap(positionedBounds, existingBounds, padding)) {
      return true;
    }
  }

  return false;
}

/**
 * Find a position that doesn't overlap with existing elements
 * @param {Object} newBounds - Bounds of new elements group
 * @param {Array} existingElements - Array of existing elements
 * @param {Object} viewportData - Object containing viewport information
 * @returns {Object} Offset with offsetX and offsetY
 */
function findNonOverlappingPosition(newBounds, existingElements, viewportData) {
  const { dimension, scale, translate, currentMousePosition } = viewportData;

  // Calculate visible viewport dimensions and top-left corner in canvas coordinates
  const viewportWidth = dimension.width / scale;
  const viewportHeight = dimension.height / scale;
  const viewportMinX = -translate.x / scale;
  const viewportMinY = -translate.y / scale;
  const viewportMaxX = viewportMinX + viewportWidth;
  const viewportMaxY = viewportMinY + viewportHeight;

  console.log('Viewport Info:', { viewportWidth, viewportHeight, viewportMinX, viewportMinY, viewportMaxX, viewportMaxY, scale, translateX: translate.x, translateY: translate.y });
  console.log('Current Mouse Position (Canvas Coords):', currentMousePosition);


  const padding = 60; // Space between elements
  const margin = 50;  // Space from viewport edges

  console.log('🔍 Searching for non-overlapping position within viewport...');

  // Calculate overall bounds of existing elements
  const existingBounds = calculateElementGroupBounds(existingElements);
  
  // Determine a starting point for placement, prioritizing mouse position or viewport center
  let initialPlacementX = viewportMinX + viewportWidth / 2;
  let initialPlacementY = viewportMinY + viewportHeight / 2;

  if (currentMousePosition && typeof currentMousePosition.x === 'number' && typeof currentMousePosition.y === 'number') {
    // Ensure mouse position is within the viewport bounds, otherwise default to center
    if (currentMousePosition.x >= viewportMinX && currentMousePosition.x <= viewportMaxX &&
        currentMousePosition.y >= viewportMinY && currentMousePosition.y <= viewportMaxY) {
      initialPlacementX = currentMousePosition.x;
      initialPlacementY = currentMousePosition.y;
      console.log('🎯 Using mouse position as initial placement target:', {initialPlacementX, initialPlacementY});
    } else {
      console.log('🖱️ Mouse position is outside viewport, defaulting to viewport center.');
    }
  } else {
    console.log('🎯 Using viewport center as initial placement target.');
  }


  // Define search areas relative to the viewport and initial placement point
  // These areas are now relative to the viewport, not the fixed canvas.
  const searchAreas = [
    // Centered around initialPlacementX, initialPlacementY (within viewport)
    {
      name: 'aroundInitialPoint',
      startX: Math.max(viewportMinX + margin, initialPlacementX - newBounds.width / 2 - padding * 2),
      endX: Math.min(viewportMaxX - margin - newBounds.width, initialPlacementX + newBounds.width / 2 + padding * 2),
      startY: Math.max(viewportMinY + margin, initialPlacementY - newBounds.height / 2 - padding * 2),
      endY: Math.min(viewportMaxY - margin - newBounds.height, initialPlacementY + newBounds.height / 2 + padding * 2),
      priority: 0 // Highest priority: try near mouse or center first
    },
    // Right of existing elements, within viewport
    {
      name: 'rightInViewport',
      startX: Math.max(viewportMinX + margin, existingBounds.maxX + padding),
      endX: viewportMaxX - margin - newBounds.width,
      startY: viewportMinY + margin,
      endY: viewportMaxY - margin - newBounds.height,
      priority: 1
    },
    // Below existing elements, within viewport
    {
      name: 'belowInViewport',
      startX: viewportMinX + margin,
      endX: viewportMaxX - margin - newBounds.width,
      startY: Math.max(viewportMinY + margin, existingBounds.maxY + padding),
      endY: viewportMaxY - margin - newBounds.height,
      priority: 2
    },
    // Left of existing elements, within viewport
    {
      name: 'leftInViewport',
      startX: viewportMinX + margin,
      endX: Math.min(viewportMaxX - margin - newBounds.width, existingBounds.minX - padding - newBounds.width),
      startY: viewportMinY + margin,
      endY: viewportMaxY - margin - newBounds.height,
      priority: 3
    },
    // Above existing elements, within viewport
    {
      name: 'aboveInViewport',
      startX: viewportMinX + margin,
      endX: viewportMaxX - margin - newBounds.width,
      startY: viewportMinY + margin,
      endY: Math.min(viewportMaxY - margin - newBounds.height, existingBounds.minY - padding - newBounds.height),
      priority: 4
    },
    // Anywhere in the visible viewport (grid search)
    {
      name: 'anywhereInViewport',
      startX: viewportMinX + margin,
      endX: viewportMaxX - margin - newBounds.width,
      startY: viewportMinY + margin,
      endY: viewportMaxY - margin - newBounds.height,
      priority: 5
    }
  ];

  // Try each search area
  for (const area of searchAreas.sort((a, b) => a.priority - b.priority)) {
    console.log(`🎯 Searching in ${area.name} area:`, {startX: area.startX, endX: area.endX, startY: area.startY, endY: area.endY});
    
    // Skip invalid or too small areas
    if (area.startX >= area.endX || area.startY >= area.endY) {
      console.log(`⚠️ ${area.name} area is invalid or too small (startX:${area.startX} >= endX:${area.endX} or startY:${area.startY} >= endY:${area.endY}), skipping`);
      continue;
    }

    // For 'aroundInitialPoint', try the exact point first
    if (area.name === 'aroundInitialPoint') {
        const testX = initialPlacementX - newBounds.width / 2; // Position group center at initialPlacementX
        const testY = initialPlacementY - newBounds.height / 2; // Position group center at initialPlacementY
        const offsetX = testX - newBounds.minX;
        const offsetY = testY - newBounds.minY;
        if (!wouldOverlap(newBounds, offsetX, offsetY, existingElements, padding)) {
            console.log(`✅ Found position at initial target in ${area.name}:`, { offsetX, offsetY });
            return { name: area.name, offsetX, offsetY };
        }
    }

    // Test specific strategic positions within the area (e.g., corners, center)
    // This is more relevant for larger areas like 'rightInViewport', 'belowInViewport', etc.
    if (area.priority >= 1 && area.priority <= 4) { // For directional areas
      const strategicPoints = [
        { x: area.startX, y: area.startY }, // Top-left of area
        { x: area.startX + (area.endX - area.startX) / 2, y: area.startY }, // Top-center
        { x: area.startX, y: area.startY + (area.endY - area.startY) / 2 }, // Middle-left
        { x: area.startX + (area.endX - area.startX) / 2, y: area.startY + (area.endY - area.startY) / 2 }, // Center of area
      ];

      for (const pos of strategicPoints) {
        // Ensure the strategic point itself is within the valid range of the area
        if (pos.x > area.endX || pos.y > area.endY) continue;

        const offsetX = pos.x - newBounds.minX;
        const offsetY = pos.y - newBounds.minY;

        if (!wouldOverlap(newBounds, offsetX, offsetY, existingElements, padding)) {
          console.log(`✅ Found position via strategic point in ${area.name}:`, { offsetX, offsetY });
          return { name: area.name, offsetX, offsetY };
        }
      }
    }

    // Grid search for 'anywhereInViewport' or if specific/strategic positions failed
    // The grid search should cover the defined area.
    const stepX = Math.max(40, (area.endX - area.startX) / 5); // Reduced denominator for more steps
    const stepY = Math.max(40, (area.endY - area.startY) / 5); // Reduced denominator for more steps

    for (let x = area.startX; x <= area.endX; x += stepX) {
      for (let y = area.startY; y <= area.endY; y += stepY) {
        const offsetX = x - newBounds.minX;
        const offsetY = y - newBounds.minY;

        if (!wouldOverlap(newBounds, offsetX, offsetY, existingElements, padding)) {
          console.log(`✅ Found position via grid search in ${area.name}:`, { offsetX, offsetY });
          return { name: `${area.name}-grid`, offsetX, offsetY };
        }
      }
    }
  }

  // Last resort: place near the center of the viewport, slightly offset if still overlapping
  console.log('⚠️ No non-overlapping position found in defined areas, using viewport center fallback');
  let fallbackX = viewportMinX + viewportWidth / 2 - newBounds.width / 2;
  let fallbackY = viewportMinY + viewportHeight / 2 - newBounds.height / 2;
  
  let attempts = 0;
  const maxAttempts = 10;
  let finalOffsetX = fallbackX - newBounds.minX;
  let finalOffsetY = fallbackY - newBounds.minY;

  while(wouldOverlap(newBounds, finalOffsetX, finalOffsetY, existingElements, padding) && attempts < maxAttempts) {
    finalOffsetX += padding / 2; // Shift slightly right
    finalOffsetY += padding / 2; // Shift slightly down
    attempts++;
  }
  
  if (attempts === maxAttempts) {
      console.warn('⚠️ Fallback position still overlaps after multiple attempts. Placing at last attempted offset.');
  }

  return {
    name: 'viewport-fallback',
    offsetX: finalOffsetX,
    offsetY: finalOffsetY
  };
}

export default function AIToolPanel() {
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [diagramType, setDiagramType] = useState('flowchart');
  const [layoutStyle, setLayoutStyle] = useState('symmetric');
  const [error, setError] = useState(null);
  const [isVisible, setIsVisible] = useState(true);
  const { 
    setElements, 
    elements, 
    setSelectedTool, 
    showAIPanel, 
    setShowAIPanel,
    translate, // Added
    scale,     // Added
    currentMousePosition // Added
  } = useAppContext();

  const diagramTypes = [
    { value: 'flowchart', label: 'Flowchart', icon: '📊', desc: 'Process flows and decisions' },
    { value: 'mindmap', label: 'Mind Map', icon: '🧠', desc: 'Ideas and concepts' },
    { value: 'process', label: 'Process Diagram', icon: '⚙️', desc: 'Step-by-step procedures' },
    { value: 'organization', label: 'Org Chart', icon: '🏢', desc: 'Hierarchical structures' },
    { value: 'timeline', label: 'Timeline', icon: '📅', desc: 'Chronological events' },
    { value: 'network', label: 'Network Diagram', icon: '🌐', desc: 'Connected systems' },
    { value: 'system', label: 'System Architecture', icon: '🏗️', desc: 'Technical architecture' }  ];

  const layoutStyles = [
    { value: 'symmetric', label: 'Symmetric & Balanced', icon: '🎯', desc: 'Perfect alignment and spacing' },
    { value: 'compact', label: 'Compact Layout', icon: '📐', desc: 'Space-efficient arrangement' },
    { value: 'spacious', label: 'Spacious Layout', icon: '🌟', desc: 'Extra breathing room' },
    { value: 'creative', label: 'Creative Flow', icon: '🎨', desc: 'Artistic and dynamic' }
  ];

  // Clear error when prompt changes
  useEffect(() => {
    if (error) setError(null);
  }, [prompt, error]);

  // Close panel when showAIPanel becomes false
  useEffect(() => {
    setIsVisible(showAIPanel);
  }, [showAIPanel]);
  const handleGenerate = useCallback(async () => {
    if (!prompt.trim()) {
      setError('Please enter a description for your diagram');
      return;
    }
    
    console.log('🤖 Starting AI diagram generation...');
    setIsGenerating(true);
    setError(null);
    
    try {      console.log('📝 Prompt:', prompt.trim());
      console.log('📊 Diagram type:', diagramType);
      console.log('🎨 Layout style:', layoutStyle);
      console.log('📋 Current elements count:', elements.length);
      
      const generatedElements = await aiService.generateDiagram(prompt.trim(), diagramType, layoutStyle);
        console.log('✨ Generated elements:', generatedElements);
      console.log('🔢 Number of elements generated:', generatedElements.length);
      
      // Debug: Log the first few elements to see their content
      console.log('📄 Sample element details:');
      generatedElements.slice(0, 3).forEach((el, i) => {
        console.log(`Element ${i}:`, {
          id: el.id,
          tool: el.tool,
          text: el.text,
          x1: el.x1,
          y1: el.y1,
          x2: el.x2,
          y2: el.y2
        });
      });
        if (!generatedElements || generatedElements.length === 0) {
        throw new Error('No elements were generated. Please try a different description.');
      }
      
      // Prepare viewport data to pass down
      const viewportDimension = { width: window.innerWidth, height: window.innerHeight };
      const viewportData = {
        dimension: viewportDimension, // Use window dimensions
        scale,
        translate,
        currentMousePosition // This should be in canvas coordinates
      };
      console.log("Viewport Data being passed to positionElementsAwayFromExisting:", viewportData);


      // Find a good position to place new elements (avoid overlap)
      const positionedElements = positionElementsAwayFromExisting(generatedElements, elements, viewportData);
      
      console.log('📍 Positioned elements:', positionedElements);
      
      // Add generated elements to canvas
      console.log('📝 Before setElements - current count:', elements.length);
      setElements(prev => {
        const newElements = [...prev, ...positionedElements];
        console.log('📝 After setElements - new count:', newElements.length);
        console.log('🎨 New elements added to canvas:', positionedElements.map(e => e.id));
        return newElements;
      });
      
      // Switch to selection tool
      setSelectedTool('selection');
      
      // Clear prompt and show success
      setPrompt('');
      
      console.log(`✅ Successfully generated ${positionedElements.length} elements`);
      
    } catch (error) {
      console.error('Generation failed:', error);
      setError(error.message || 'Failed to generate diagram. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  }, [prompt, diagramType, elements, setElements, setSelectedTool, /* dimension, */ scale, translate, currentMousePosition, layoutStyle]);

  const handleClose = useCallback(() => {
    setIsVisible(false);
    if (setShowAIPanel) {
      setShowAIPanel(false);
    }
  }, [setShowAIPanel]);

  const handleKeyPress = useCallback((e) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      handleGenerate();
    }
    if (e.key === 'Escape') {
      handleClose();
    }
  }, [handleGenerate, handleClose]);

  const quickExamples = [
    'User registration and login flow',
    'E-commerce checkout process',
    'Project management workflow',
    'Software development lifecycle',
    'Customer support ticket system',
    'Team organizational structure',
    'Data processing pipeline',
    'System architecture overview'
  ];

  if (!isVisible) return null;

  return (    <div 
      className="ai-tool-panel"
      style={{
        position: 'fixed',
        right: '20px',
        top: '100px',
        width: '360px',
        maxHeight: 'calc(100vh - 120px)',
        background: 'rgba(255, 255, 255, 0.98)',
        backdropFilter: 'blur(20px)',
        borderRadius: '16px',
        border: '1px solid rgba(0, 0, 0, 0.08)',
        padding: '24px',
        boxShadow: '0 20px 40px rgba(0, 0, 0, 0.15)',
        zIndex: 1000,
        overflowY: 'auto',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        animation: 'slideInRight 0.3s ease-out',
        pointerEvents: 'auto'
      }}
      onKeyDown={handleKeyPress}
      tabIndex={-1}
    >
      {/* Header */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: '20px'
      }}>
        <h3 style={{ 
          margin: '0', 
          fontSize: '18px', 
          fontWeight: '700',
          color: '#1a202c',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          🤖 AI Diagram Generator
        </h3>
        <button
          onClick={handleClose}
          style={{
            background: 'none',
            border: 'none',
            fontSize: '20px',
            cursor: 'pointer',
            color: '#718096',
            padding: '4px 8px',
            borderRadius: '6px',
            transition: 'background 0.2s ease'
          }}
          onMouseOver={(e) => e.target.style.background = 'rgba(0,0,0,0.05)'}
          onMouseOut={(e) => e.target.style.background = 'none'}
          title="Close AI Panel (Esc)"
        >
          ×
        </button>
      </div>

      {/* Error Display */}
      {error && (
        <div style={{
          background: 'rgba(254, 226, 226, 0.8)',
          border: '1px solid #feb2b2',
          borderRadius: '8px',
          padding: '12px',
          marginBottom: '16px',
          fontSize: '14px',
          color: '#c53030',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <span>⚠️</span>
          {error}
        </div>
      )}

      {/* Diagram Type Selector */}
      <div style={{ marginBottom: '20px' }}>
        <label style={{ 
          display: 'block', 
          fontSize: '14px', 
          fontWeight: '600', 
          marginBottom: '8px',
          color: '#2d3748'
        }}>
          Diagram Type
        </label>
        <select 
          value={diagramType}
          onChange={(e) => setDiagramType(e.target.value)}
          style={{
            width: '100%',
            padding: '12px 16px',
            border: '1px solid rgba(0, 0, 0, 0.12)',
            borderRadius: '8px',
            fontSize: '14px',
            background: 'white',
            cursor: 'pointer',
            transition: 'border-color 0.2s ease'
          }}
          onFocus={(e) => e.target.style.borderColor = '#667eea'}
          onBlur={(e) => e.target.style.borderColor = 'rgba(0, 0, 0, 0.12)'}
        >
          {diagramTypes.map(type => (
            <option key={type.value} value={type.value}>
              {type.icon} {type.label} - {type.desc}
            </option>
          ))}
        </select>
      </div>

      {/* Layout Style Selector */}
      <div style={{ marginBottom: '20px' }}>
        <label style={{ 
          display: 'block', 
          fontSize: '14px', 
          fontWeight: '600', 
          marginBottom: '8px',
          color: '#2d3748'
        }}>
          Layout Style
        </label>
        <select 
          value={layoutStyle}
          onChange={(e) => setLayoutStyle(e.target.value)}
          style={{
            width: '100%',
            padding: '12px 16px',
            border: '1px solid rgba(0, 0, 0, 0.12)',
            borderRadius: '8px',
            fontSize: '14px',
            background: 'white',
            cursor: 'pointer',
            transition: 'border-color 0.2s ease'
          }}
          onFocus={(e) => e.target.style.borderColor = '#667eea'}
          onBlur={(e) => e.target.style.borderColor = 'rgba(0, 0, 0, 0.12)'}
        >
          {layoutStyles.map(style => (
            <option key={style.value} value={style.value}>
              {style.icon} {style.label} - {style.desc}
            </option>
          ))}
        </select>
      </div>

      {/* Prompt Input */}
      <div style={{ marginBottom: '20px' }}>
        <label style={{ 
          display: 'block', 
          fontSize: '14px', 
          fontWeight: '600', 
          marginBottom: '8px',
          color: '#2d3748'
        }}>
          Describe your diagram
        </label>
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          onKeyDown={handleKeyPress}
          placeholder="e.g., 'Create a user login process with email verification and password reset'"
          rows={4}
          style={{
            width: '100%',
            padding: '12px 16px',
            border: '1px solid rgba(0, 0, 0, 0.12)',
            borderRadius: '8px',
            fontSize: '14px',
            resize: 'vertical',
            fontFamily: 'inherit',
            lineHeight: '1.5',
            transition: 'border-color 0.2s ease'
          }}
          onFocus={(e) => e.target.style.borderColor = '#667eea'}
          onBlur={(e) => e.target.style.borderColor = 'rgba(0, 0, 0, 0.12)'}
        />
        <p style={{
          fontSize: '12px',
          color: '#718096',
          margin: '8px 0 0 0',
          display: 'flex',
          alignItems: 'center',
          gap: '4px'
        }}>
          <span>💡</span>
          Press Ctrl/Cmd + Enter to generate • Esc to close
        </p>
      </div>

      {/* Generate Button */}
      <button
        onClick={handleGenerate}
        disabled={!prompt.trim() || isGenerating}
        style={{
          width: '100%',
          padding: '14px',
          background: isGenerating ? '#e2e8f0' : '#667eea',
          color: isGenerating ? '#718096' : 'white',
          border: 'none',
          borderRadius: '8px',
          fontSize: '15px',
          fontWeight: '600',
          cursor: isGenerating ? 'not-allowed' : 'pointer',
          transition: 'all 0.2s ease',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px',
          opacity: !prompt.trim() ? 0.6 : 1
        }}
        onMouseOver={(e) => {
          if (!isGenerating && prompt.trim()) {
            e.target.style.background = '#5a67d8';
            e.target.style.transform = 'translateY(-1px)';
          }
        }}
        onMouseOut={(e) => {
          if (!isGenerating) {
            e.target.style.background = '#667eea';
            e.target.style.transform = 'translateY(0)';
          }
        }}
      >
        {isGenerating ? (
          <>
            <span style={{ 
              animation: 'spin 1s linear infinite',
              display: 'inline-block'
            }}>🔄</span>
            Generating...
          </>
        ) : (
          <>
            <span>✨</span>
            Generate Diagram
          </>
        )}
      </button>

      {/* Quick Examples */}
      <div style={{ marginTop: '24px' }}>
        <p style={{ 
          fontSize: '13px', 
          color: '#4a5568', 
          marginBottom: '12px',
          fontWeight: '600',
          display: 'flex',
          alignItems: 'center',
          gap: '4px'
        }}>
          <span>💡</span>
          Quick Examples:
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {quickExamples.map((example, index) => (
            <button
              key={index}
              onClick={() => setPrompt(example)}
              style={{
                textAlign: 'left',
                background: 'rgba(102, 126, 234, 0.05)',
                border: '1px solid rgba(102, 126, 234, 0.15)',
                borderRadius: '6px',
                padding: '8px 12px',
                fontSize: '13px',
                color: '#5a67d8',
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
              onMouseOver={(e) => {
                e.target.style.background = 'rgba(102, 126, 234, 0.1)';
                e.target.style.borderColor = 'rgba(102, 126, 234, 0.3)';
                e.target.style.transform = 'translateX(2px)';
              }}
              onMouseOut={(e) => {
                e.target.style.background = 'rgba(102, 126, 234, 0.05)';
                e.target.style.borderColor = 'rgba(102, 126, 234, 0.15)';
                e.target.style.transform = 'translateX(0)';
              }}
            >
              "{example}"
            </button>
          ))}
        </div>
      </div>

      {/* API Key Status */}
      <div style={{ 
        marginTop: '20px', 
        padding: '12px', 
        background: 'rgba(59, 130, 246, 0.05)', 
        borderRadius: '8px',
        border: '1px solid rgba(59, 130, 246, 0.15)'
      }}>
        <p style={{ 
          fontSize: '12px', 
          color: '#3b82f6', 
          margin: 0,
          display: 'flex',
          alignItems: 'center',
          gap: '6px'
        }}>
          <span>ℹ️</span>
          {aiService.apiKey ? 'AI-powered generation active' : 'Using demo mode - add VITE_GEMINI_API_KEY for full AI features'}
        </p>
      </div>      {/* Inline styles for animations */}
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        
        @keyframes slideInRight {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
        
        .ai-tool-panel::-webkit-scrollbar {
          width: 6px;
        }
        
        .ai-tool-panel::-webkit-scrollbar-track {
          background: rgba(0, 0, 0, 0.05);
          border-radius: 3px;
        }
        
        .ai-tool-panel::-webkit-scrollbar-thumb {
          background: rgba(0, 0, 0, 0.2);
          border-radius: 3px;
        }
        
        .ai-tool-panel::-webkit-scrollbar-thumb:hover {
          background: rgba(0, 0, 0, 0.3);
        }
      `}</style>
    </div>
  );
}
