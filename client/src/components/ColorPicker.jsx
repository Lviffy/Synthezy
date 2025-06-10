import React, { useState, useRef, useEffect, useCallback } from 'react';

const ColorPicker = ({ 
  color = '#000000', 
  onChange, 
  label = 'Color',
  className = '',
  disabled = false 
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [tempColor, setTempColor] = useState(color);
  const [isDragging, setIsDragging] = useState(false);
  const pickerRef = useRef(null);
  const hueRef = useRef(null);
  const saturationRef = useRef(null);

  // Convert hex to HSV
  const hexToHsv = useCallback((hex) => {
    const r = parseInt(hex.slice(1, 3), 16) / 255;
    const g = parseInt(hex.slice(3, 5), 16) / 255;
    const b = parseInt(hex.slice(5, 7), 16) / 255;

    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const diff = max - min;

    let h = 0;
    let s = max === 0 ? 0 : diff / max;
    let v = max;

    if (diff !== 0) {
      switch (max) {
        case r: h = ((g - b) / diff) % 6; break;
        case g: h = (b - r) / diff + 2; break;
        case b: h = (r - g) / diff + 4; break;
      }
    }

    return {
      h: Math.round(h * 60),
      s: Math.round(s * 100),
      v: Math.round(v * 100)
    };
  }, []);

  // Convert HSV to hex
  const hsvToHex = useCallback((h, s, v) => {
    h = h / 360;
    s = s / 100;
    v = v / 100;

    const i = Math.floor(h * 6);
    const f = h * 6 - i;
    const p = v * (1 - s);
    const q = v * (1 - f * s);
    const t = v * (1 - (1 - f) * s);

    let r, g, b;
    switch (i % 6) {
      case 0: r = v; g = t; b = p; break;
      case 1: r = q; g = v; b = p; break;
      case 2: r = p; g = v; b = t; break;
      case 3: r = p; g = q; b = v; break;
      case 4: r = t; g = p; b = v; break;
      case 5: r = v; g = p; b = q; break;
      default: r = g = b = 0;
    }

    const toHex = (c) => {
      const hex = Math.round(c * 255).toString(16);
      return hex.length === 1 ? '0' + hex : hex;
    };

    return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
  }, []);

  const [hsv, setHsv] = useState(() => hexToHsv(color));

  useEffect(() => {
    setTempColor(color);
    setHsv(hexToHsv(color));
  }, [color, hexToHsv]);

  // Handle mouse events for saturation/value picker
  const handleSaturationMouseDown = useCallback((e) => {
    if (disabled) return;
    setIsDragging(true);
    handleSaturationMove(e);
  }, [disabled]);

  const handleSaturationMove = useCallback((e) => {
    if (!saturationRef.current) return;
    
    const rect = saturationRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(rect.width, e.clientX - rect.left));
    const y = Math.max(0, Math.min(rect.height, e.clientY - rect.top));
    
    const s = (x / rect.width) * 100;
    const v = 100 - (y / rect.height) * 100;
    
    const newHsv = { ...hsv, s, v };
    setHsv(newHsv);
    const newColor = hsvToHex(newHsv.h, newHsv.s, newHsv.v);
    setTempColor(newColor);
    onChange && onChange(newColor);
  }, [hsv, hsvToHex, onChange]);

  // Handle hue slider
  const handleHueChange = useCallback((e) => {
    if (disabled) return;
    const h = parseInt(e.target.value);
    const newHsv = { ...hsv, h };
    setHsv(newHsv);
    const newColor = hsvToHex(newHsv.h, newHsv.s, newHsv.v);
    setTempColor(newColor);
    onChange && onChange(newColor);
  }, [hsv, hsvToHex, onChange, disabled]);

  // Handle RGB input changes
  const handleRgbChange = useCallback((type, value) => {
    if (disabled) return;
    const rgb = {
      r: parseInt(tempColor.slice(1, 3), 16),
      g: parseInt(tempColor.slice(3, 5), 16),
      b: parseInt(tempColor.slice(5, 7), 16)
    };
    
    rgb[type] = Math.max(0, Math.min(255, parseInt(value) || 0));
    
    const toHex = (c) => {
      const hex = c.toString(16);
      return hex.length === 1 ? '0' + hex : hex;
    };
    
    const newColor = `#${toHex(rgb.r)}${toHex(rgb.g)}${toHex(rgb.b)}`;
    setTempColor(newColor);
    setHsv(hexToHsv(newColor));
    onChange && onChange(newColor);
  }, [tempColor, hexToHsv, onChange, disabled]);

  // Mouse event handlers
  useEffect(() => {
    const handleMouseMove = (e) => {
      if (isDragging) {
        handleSaturationMove(e);
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, handleSaturationMove]);

  // Close picker when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (pickerRef.current && !pickerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const rgbValues = {
    r: parseInt(tempColor.slice(1, 3), 16),
    g: parseInt(tempColor.slice(3, 5), 16),
    b: parseInt(tempColor.slice(5, 7), 16)
  };

  return (
    <div className={`color-picker-container ${className}`} ref={pickerRef}>
      {/* Color Preview Button */}
      <button
        type="button"
        className={`color-preview-button ${disabled ? 'disabled' : ''}`}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        title={`${label}: ${tempColor}`}
        style={{
          background: tempColor,
          border: '2px solid rgba(0, 0, 0, 0.12)',
          borderRadius: '6px',
          width: '32px',
          height: '32px',
          cursor: disabled ? 'not-allowed' : 'pointer',
          transition: 'all 0.2s ease',
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        {/* Transparent pattern for transparent colors */}
        {tempColor === 'transparent' && (
          <div style={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(45deg, #ccc 25%, transparent 25%), linear-gradient(-45deg, #ccc 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #ccc 75%), linear-gradient(-45deg, transparent 75%, #ccc 75%)',
            backgroundSize: '8px 8px',
            backgroundPosition: '0 0, 0 4px, 4px -4px, -4px 0px'
          }} />
        )}
      </button>

      {/* Color Picker Dropdown */}
      {isOpen && !disabled && (
        <div className="color-picker-dropdown" style={{
          position: 'absolute',
          top: '40px',
          left: '0',
          background: 'rgba(255, 255, 255, 0.98)',
          border: '1px solid rgba(0, 0, 0, 0.12)',
          borderRadius: '12px',
          padding: '16px',
          zIndex: 10000,
          minWidth: '280px',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12), 0 4px 16px rgba(0, 0, 0, 0.08)',
          backdropFilter: 'blur(20px)'
        }}>
          {/* Saturation/Value Picker */}
          <div
            ref={saturationRef}
            className="saturation-picker"
            style={{
              width: '100%',
              height: '160px',
              borderRadius: '8px',
              background: `linear-gradient(to top, #000, transparent), linear-gradient(to right, #fff, hsl(${hsv.h}, 100%, 50%))`,
              position: 'relative',
              cursor: 'crosshair',
              marginBottom: '12px',
              border: '1px solid rgba(0, 0, 0, 0.1)'
            }}
            onMouseDown={handleSaturationMouseDown}
          >
            {/* Picker dot */}
            <div
              style={{
                position: 'absolute',
                left: `${hsv.s}%`,
                top: `${100 - hsv.v}%`,
                width: '12px',
                height: '12px',
                borderRadius: '50%',
                border: '2px solid white',
                boxShadow: '0 0 0 1px rgba(0, 0, 0, 0.3), 0 2px 4px rgba(0, 0, 0, 0.2)',
                transform: 'translate(-50%, -50%)',
                pointerEvents: 'none'
              }}
            />
          </div>

          {/* Hue Slider */}
          <div style={{ marginBottom: '16px' }}>
            <input
              type="range"
              min="0"
              max="360"
              value={hsv.h}
              onChange={handleHueChange}
              style={{
                width: '100%',
                height: '8px',
                borderRadius: '4px',
                background: 'linear-gradient(to right, #ff0000 0%, #ffff00 17%, #00ff00 33%, #00ffff 50%, #0000ff 67%, #ff00ff 83%, #ff0000 100%)',
                outline: 'none',
                cursor: 'pointer',
                WebkitAppearance: 'none',
                border: '1px solid rgba(0, 0, 0, 0.1)'
              }}
            />
          </div>

          {/* RGB Inputs */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr 1fr',
            gap: '8px',
            marginBottom: '12px'
          }}>
            {['r', 'g', 'b'].map((component) => (
              <div key={component} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <label style={{
                  fontSize: '11px',
                  fontWeight: '600',
                  color: '#6b7280',
                  marginBottom: '4px',
                  textTransform: 'uppercase'
                }}>
                  {component}
                </label>
                <input
                  type="number"
                  min="0"
                  max="255"
                  value={rgbValues[component]}
                  onChange={(e) => handleRgbChange(component, e.target.value)}
                  style={{
                    width: '100%',
                    padding: '6px 8px',
                    border: '1px solid rgba(0, 0, 0, 0.12)',
                    borderRadius: '4px',
                    fontSize: '12px',
                    textAlign: 'center',
                    background: 'rgba(248, 250, 252, 0.8)'
                  }}
                />
              </div>
            ))}
          </div>

          {/* Hex Input */}
          <div style={{ marginBottom: '12px' }}>
            <label style={{
              fontSize: '11px',
              fontWeight: '600',
              color: '#6b7280',
              marginBottom: '4px',
              display: 'block',
              textTransform: 'uppercase'
            }}>
              Hex
            </label>
            <input
              type="text"
              value={tempColor}
              onChange={(e) => {
                const value = e.target.value;
                if (/^#[0-9A-F]{6}$/i.test(value)) {
                  setTempColor(value);
                  setHsv(hexToHsv(value));
                  onChange && onChange(value);
                }
              }}
              style={{
                width: '100%',
                padding: '8px 12px',
                border: '1px solid rgba(0, 0, 0, 0.12)',
                borderRadius: '6px',
                fontSize: '14px',
                fontFamily: 'monospace',
                background: 'rgba(248, 250, 252, 0.8)'
              }}
            />
          </div>

          {/* Color Preview */}
          <div style={{
            width: '100%',
            height: '24px',
            borderRadius: '6px',
            background: tempColor,
            border: '1px solid rgba(0, 0, 0, 0.12)',
            position: 'relative',
            overflow: 'hidden'
          }}>
            {tempColor === 'transparent' && (
              <div style={{
                position: 'absolute',
                inset: 0,
                background: 'linear-gradient(45deg, #ccc 25%, transparent 25%), linear-gradient(-45deg, #ccc 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #ccc 75%), linear-gradient(-45deg, transparent 75%, #ccc 75%)',
                backgroundSize: '8px 8px',
                backgroundPosition: '0 0, 0 4px, 4px -4px, -4px 0px'
              }} />
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ColorPicker;
