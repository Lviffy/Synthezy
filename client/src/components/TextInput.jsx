import { useState, useRef, useEffect } from "react";
import { useAppContext } from "../provider/AppStates";
import { createElement } from "../helper/element";

export default function TextInput({ position, onComplete, style, canvasPosition }) {
  const [text, setText] = useState("");
  const inputRef = useRef(null);
  const { setElements, setSelectedElement, setSelectedTool, lockTool } = useAppContext();useEffect(() => {
    // Use a timeout to ensure the element is fully rendered before focusing
    const timer = setTimeout(() => {
      if (inputRef.current) {
        inputRef.current.focus();
      }
    }, 100);
    
    return () => clearTimeout(timer);
  }, []);  const handleComplete = () => {
    if (text.trim()) {
      // Use a default font size for initial text creation
      const fontSize = 16;
        // Estimate text dimensions using canvas measureText
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      ctx.font = `${fontSize}px system-ui, -apple-system, sans-serif`;
      
      // Handle multi-line text properly
      const lines = text.split('\n');
      const lineHeight = fontSize * 1.2;
      let maxWidth = 0;
      
      lines.forEach(line => {
        const lineMetrics = ctx.measureText(line);
        maxWidth = Math.max(maxWidth, lineMetrics.width);
      });
      
      const textWidth = maxWidth;
      const textHeight = lines.length * lineHeight;

      // Create text element using the canvas coordinates
      const element = createElement(
        canvasPosition.x,
        canvasPosition.y,
        canvasPosition.x + textWidth,
        canvasPosition.y + textHeight,
        style,
        "text"
      );
      
      // Add text-specific properties
      element.text = text;
      element.fontSize = fontSize;
      element.fontFamily = "system-ui, -apple-system, sans-serif";

      // Add element to canvas
      setElements((prevState) => [...prevState, element]);
      
      // If not in lock mode, switch back to selection tool
      if (!lockTool) {
        setSelectedTool("selection");
        setSelectedElement(element);
      }
    }
    
    onComplete();
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleComplete();
    } else if (e.key === "Escape") {
      onComplete();
    }
  };
  return (
    <div
      style={{
        position: "fixed",
        left: position.x,
        top: position.y,
        zIndex: 10000,
        background: "#ffffff",
        border: "1px solid #e1e5e9",
        borderRadius: "8px",
        boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
        minWidth: "200px",
        padding: "12px",
        fontFamily: "system-ui, -apple-system, sans-serif",
      }}
    >      <textarea
        ref={inputRef}
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={handleKeyDown}
        style={{
          width: "100%",
          minHeight: "60px",
          padding: "8px 12px",
          fontSize: "14px",
          fontFamily: "system-ui, -apple-system, sans-serif",
          background: "#ffffff",
          color: "#1f2937",
          border: "1px solid #d1d5db",
          borderRadius: "6px",
          outline: "none",
          resize: "vertical",
          boxSizing: "border-box"
        }}
        placeholder="Type your text here..."
        autoFocus
      />      <div style={{ 
        marginTop: "8px", 
        fontSize: "11px", 
        color: "#9ca3af",
        textAlign: "right"
      }}>
        Press Enter to add • Escape to cancel
      </div>
    </div>
  );
}
