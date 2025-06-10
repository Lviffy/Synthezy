import React, { useState, useRef, useEffect, useCallback } from 'react';
import '../styles/modern-color-picker.css';

const ModernColorPicker = ({ 
  currentColor, 
  onChange, 
  isOpen, 
  onClose, 
  colorType = 'stroke' // 'stroke' or 'fill'
}) => {
  const [localColor, setLocalColor] = useState(currentColor);
  const [rgbValues, setRgbValues] = useState({ r: 0, g: 0, b: 0 });
  const pickerRef = useRef(null);
  // Convert RGB string to hex
  const rgbStringToHex = useCallback((rgbString) => {
    if (rgbString === 'transparent') return 'transparent';
    if (rgbString.startsWith('#')) return rgbString; // Already hex
    
    // Parse rgb(r, g, b) format
    const match = rgbString.match(/rgb\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)/);
    if (match) {
      const r = parseInt(match[1], 10);
      const g = parseInt(match[2], 10);
      const b = parseInt(match[3], 10);
      return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
    }
    
    return '#000000'; // Fallback
  }, []);

  // Convert hex to RGB
  const hexToRgb = useCallback((hex) => {
    if (hex === 'transparent') return { r: 255, g: 255, b: 255 };
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : { r: 0, g: 0, b: 0 };
  }, []);

  // Convert RGB to hex
  const rgbToHex = useCallback((r, g, b) => {
    return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
  }, []);
  // Generate preset colors - minimal essential set
  const generatePresetColors = useCallback(() => {
    // Curated essential colors - minimal set
    const essentialColors = [
      '#000000', '#FFFFFF', '#808080', '#C0C0C0', // Grayscale
      '#FF0000', '#00FF00', '#0000FF', '#FFFF00', // Primary colors
      '#FF00FF', '#00FFFF', '#FFA500', '#800080', // Secondary colors
      '#2563EB', '#DC2626', '#16A34A', '#CA8A04'  // Modern accent colors
    ];

    return essentialColors;
  }, []);

  const presetColors = generatePresetColors();
  // Update local state when currentColor changes
  useEffect(() => {
    // Convert RGB string to hex if needed
    const hexColor = rgbStringToHex(currentColor);
    setLocalColor(hexColor);
    const rgb = hexToRgb(hexColor);
    setRgbValues(rgb);
  }, [currentColor, hexToRgb, rgbStringToHex]);
  // Handle RGB input changes
  const handleRgbChange = (component, value) => {
    const newRgb = { ...rgbValues, [component]: Math.max(0, Math.min(255, parseInt(value) || 0)) };
    setRgbValues(newRgb);
    const newHex = rgbToHex(newRgb.r, newRgb.g, newRgb.b);
    setLocalColor(newHex);
    onChange(newHex);
  };

  // Handle preset color selection
  const handlePresetClick = (color) => {
    setLocalColor(color);
    const rgb = hexToRgb(color);
    setRgbValues(rgb);
    onChange(color);
  };

  // Handle transparent selection (for fill only)
  const handleTransparent = () => {
    setLocalColor('transparent');
    onChange('transparent');
  };
  // Close picker when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (pickerRef.current && !pickerRef.current.contains(event.target)) {
        onClose();
      }
    };

    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleEscape);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
        document.removeEventListener('keydown', handleEscape);
      };
    }  }, [isOpen, onClose]);  if (!isOpen) return null;
  
  // Dynamic positioning based on color type
  const overlayStyle = {
    animation: 'overlayFadeIn 0.3s ease-out',
    // Position stroke color picker higher up, fill color picker lower
    top: colorType === 'stroke' ? '15%' : '25%'
  };
    return (
    <div 
      className={`modern-color-picker-overlay ${colorType === 'stroke' ? 'stroke-position' : 'fill-position'}`} 
      style={overlayStyle}
    >
      <div className="modern-color-picker" ref={pickerRef}>        <div className={`color-picker-header ${colorType === 'stroke' ? 'stroke-header' : 'fill-header'}`}>
          <h4>
            {colorType === 'stroke' ? '🖊️ Stroke Color' : '🎨 Fill Color'}
          </h4>
          <button 
            className="color-picker-close"
            onClick={onClose}
            aria-label="Close color picker"
          >
            ×
          </button>
        </div>        <div className="color-picker-content">
          {/* Compact Color Display & HTML5 Picker Combined */}
          <div className="compact-color-section">
            <div className="color-display-row">
              <div 
                className="current-color-display"
                style={{ 
                  backgroundColor: localColor === 'transparent' ? 'transparent' : localColor,
                  backgroundImage: localColor === 'transparent' ? 
                    'linear-gradient(45deg, #ccc 25%, transparent 25%), linear-gradient(-45deg, #ccc 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #ccc 75%), linear-gradient(-45deg, transparent 75%, #ccc 75%)' : 
                    'none',
                  backgroundSize: localColor === 'transparent' ? '6px 6px' : 'auto',
                  backgroundPosition: localColor === 'transparent' ? '0 0, 0 3px, 3px -3px, -3px 0px' : 'auto'
                }}
              />
              <div className="color-info">
                <span className="color-value">
                  {localColor === 'transparent' ? 'Transparent' : localColor.toUpperCase()}
                </span>
                {localColor !== 'transparent' && (
                  <input
                    type="color"
                    value={localColor.startsWith('#') ? localColor : '#000000'}
                    onChange={(e) => {
                      const newColor = e.target.value;
                      setLocalColor(newColor);
                      const rgb = hexToRgb(newColor);
                      setRgbValues(rgb);
                      onChange(newColor);
                    }}
                    className="compact-color-input"
                  />
                )}
              </div>
            </div>
          </div>          {/* Compact RGB Inputs Row */}
          {localColor !== 'transparent' && (
            <div className="compact-inputs-section">
              <div className="rgb-compact-row">
                <input
                  type="number"
                  min="0"
                  max="255"
                  value={rgbValues.r}
                  onChange={(e) => handleRgbChange('r', e.target.value)}
                  placeholder="R"
                />
                <input
                  type="number"
                  min="0"
                  max="255"
                  value={rgbValues.g}
                  onChange={(e) => handleRgbChange('g', e.target.value)}
                  placeholder="G"
                />
                <input
                  type="number"
                  min="0"
                  max="255"
                  value={rgbValues.b}
                  onChange={(e) => handleRgbChange('b', e.target.value)}
                  placeholder="B"
                />
              </div>
            </div>
          )}{/* Compact Preset Colors */}
          <div className="preset-colors-compact">
            <div className="preset-colors-grid">
              {presetColors.map((color, index) => (
                <button
                  key={index}
                  className={`preset-color ${localColor === color ? 'selected' : ''}`}
                  style={{ backgroundColor: color }}
                  onClick={() => handlePresetClick(color)}
                  title={color}
                />
              ))}
            </div>
          </div>

          {/* Transparent Option (for fill only) */}
          {colorType === 'fill' && (
            <button
              className={`transparent-compact ${localColor === 'transparent' ? 'selected' : ''}`}
              onClick={handleTransparent}
            >
              <div className="transparent-pattern-mini"></div>
              Transparent
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ModernColorPicker;
