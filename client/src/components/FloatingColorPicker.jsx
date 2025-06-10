import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { useAppContext } from '../provider/AppStates';
import { updateElement, updateMultipleElements } from '../helper/element';

const FloatingColorPicker = ({ selectedElement, selectedElements = [] }) => {
  const { elements, setElements } = useAppContext();
  const [isOpen, setIsOpen] = useState(false);
  const [activeColorType, setActiveColorType] = useState(null); // 'stroke' or 'fill'
  const [currentColor, setCurrentColor] = useState('#000000');
  const pickerRef = useRef(null);

  const isMultiSelection = selectedElements && selectedElements.length > 1;
  const hasSelection = selectedElement || isMultiSelection;

  // Convert hex to RGB
  const hexToRgb = (hex) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : null;
  };

  // Convert RGB to hex
  const rgbToHex = (r, g, b) => {
    return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
  };
  // Generate color variations for the palette
  const generateColorPalette = () => {
    const colors = [];
    
    // Primary colors with better organization
    const primaryColors = [
      '#000000', '#333333', '#666666', '#999999', '#CCCCCC', '#FFFFFF',
      '#FF0000', '#FF6600', '#FFCC00', '#00FF00', '#00CCFF', '#0066FF', 
      '#6600FF', '#FF00CC', '#FF0066', '#CC0000'
    ];
    
    // Add primary colors
    colors.push(...primaryColors);

    // Generate additional shades for popular colors
    const baseHues = [0, 30, 60, 120, 180, 240, 270, 300]; // Red, Orange, Yellow, Green, Cyan, Blue, Purple, Magenta
    
    baseHues.forEach(hue => {
      // Light versions
      colors.push(`hsl(${hue}, 70%, 85%)`);
      colors.push(`hsl(${hue}, 70%, 70%)`);
      // Standard versions
      colors.push(`hsl(${hue}, 70%, 50%)`);
      // Dark versions
      colors.push(`hsl(${hue}, 70%, 30%)`);
    });

    // Remove duplicates and limit to reasonable number
    return [...new Set(colors)].slice(0, 48);
  };
  const colorPalette = useMemo(() => generateColorPalette(), []);

  const handleColorChange = useCallback((color) => {
    setCurrentColor(color);
    
    if (activeColorType === 'stroke') {
      if (isMultiSelection) {
        updateMultipleElements(
          selectedElements,
          { strokeColor: color },
          setElements,
          elements
        );
      } else {
        updateElement(
          selectedElement.id,
          { strokeColor: color },
          setElements,
          elements
        );
      }
    } else if (activeColorType === 'fill') {
      if (isMultiSelection) {
        updateMultipleElements(
          selectedElements,
          { fill: color },
          setElements,
          elements
        );
      } else {
        updateElement(
          selectedElement.id,
          { fill: color },
          setElements,
          elements
        );
      }
    }
  }, [activeColorType, isMultiSelection, selectedElements, selectedElement, setElements, elements]);

  const openColorPicker = useCallback((colorType) => {
    setActiveColorType(colorType);
    setCurrentColor(
      colorType === 'stroke' 
        ? selectedElement?.strokeColor || '#000000'
        : selectedElement?.fill === 'transparent' ? '#ffffff' : selectedElement?.fill || '#ffffff'
    );
    setIsOpen(true);
  }, [selectedElement]);
  // Close picker when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (pickerRef.current && !pickerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleEscape);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
        document.removeEventListener('keydown', handleEscape);
      };
    }
  }, [isOpen]);

  if (!hasSelection || selectedElement?.tool === "stickyNote") {
    return null;
  }

  return (
    <div className="floating-color-picker">
      {/* Color Picker Trigger Buttons */}
      <div className="color-picker-triggers">
        <button
          className="color-trigger stroke-trigger"
          onClick={() => openColorPicker('stroke')}
          title="Change stroke color"
          style={{ '--color': selectedElement?.strokeColor || '#000000' }}
        >
          <div className="color-preview stroke-preview"></div>
          <span>Stroke</span>
        </button>
        
        {selectedElement?.tool !== 'line' && (
          <button
            className="color-trigger fill-trigger"
            onClick={() => openColorPicker('fill')}
            title="Change fill color"
            style={{ '--color': selectedElement?.fill === 'transparent' ? '#ffffff' : selectedElement?.fill || '#ffffff' }}
          >
            <div className="color-preview fill-preview"></div>
            <span>Fill</span>
          </button>
        )}
      </div>

      {/* Color Picker Panel */}
      {isOpen && (
        <div className="color-picker-panel" ref={pickerRef}>
          <div className="color-picker-header">
            <h4>{activeColorType === 'stroke' ? 'Stroke Color' : 'Fill Color'}</h4>
            <button 
              className="close-button"
              onClick={() => setIsOpen(false)}
            >
              ×
            </button>
          </div>
          
          {/* RGB Input */}
          <div className="rgb-input-section">
            <label htmlFor="color-input">Custom Color:</label>
            <input
              id="color-input"
              type="color"
              value={currentColor}
              onChange={(e) => handleColorChange(e.target.value)}
              className="color-input"
            />
          </div>

          {/* Color Palette */}
          <div className="color-palette-grid">
            {colorPalette.map((color, index) => (
              <button
                key={index}
                className={`palette-color ${currentColor === color ? 'selected' : ''}`}
                style={{ backgroundColor: color }}
                onClick={() => handleColorChange(color)}
                title={color}
              />
            ))}
          </div>

          {/* Transparent option for fill */}
          {activeColorType === 'fill' && (
            <button
              className="transparent-button"
              onClick={() => handleColorChange('transparent')}
            >
              No Fill (Transparent)
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default FloatingColorPicker;
