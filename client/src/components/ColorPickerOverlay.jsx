import { useState, useEffect } from "react";
import { useAppContext } from "../hooks/useAppContext.js";
import { updateElement, updateMultipleElements } from "../helper/element";
import ModernColorPicker from "./ModernColorPicker";

export default function ColorPickerOverlay({ selectedElement, selectedElements = [] }) {
  const { elements, setElements } = useAppContext();
  
  const [elementStyle, setElementStyle] = useState({
    fill: selectedElement?.fill,
    strokeColor: selectedElement?.strokeColor,
  });

  const [colorPickerState, setColorPickerState] = useState({
    isOpen: false,
    colorType: null,
    currentColor: '#000000'
  });
  const isMultiSelection = selectedElements && Array.isArray(selectedElements) && selectedElements.length > 1;  useEffect(() => {
    setElementStyle({
      fill: selectedElement?.fill,
      strokeColor: selectedElement?.strokeColor,
    });
  }, [selectedElement]);
  const openColorPicker = (colorType) => {
    const currentColor = colorType === 'stroke' 
      ? elementStyle.strokeColor || '#000000'
      : elementStyle.fill === 'transparent' ? '#ffffff' : elementStyle.fill || '#ffffff';
      
    setColorPickerState({
      isOpen: true,
      colorType,
      currentColor
    });
  };

  const closeColorPicker = () => {
    setColorPickerState({
      isOpen: false,
      colorType: null,
      currentColor: '#000000'
    });
  };

  const handleColorChange = (color) => {
    const { colorType } = colorPickerState;
    
    if (colorType === 'stroke') {
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
    } else if (colorType === 'fill') {
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
  };

  // Expose the openColorPicker function globally so Style component can call it
  useEffect(() => {
    window.openColorPicker = openColorPicker;
    return () => {
      delete window.openColorPicker;
    };
  }, []);

  return (
    <ModernColorPicker
      currentColor={colorPickerState.currentColor}
      onChange={handleColorChange}
      isOpen={colorPickerState.isOpen}
      onClose={closeColorPicker}
      colorType={colorPickerState.colorType}
    />
  );
}
