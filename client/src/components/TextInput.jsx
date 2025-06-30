import { useState, useRef, useEffect } from "react";
import { useAppContext } from "../hooks/useAppContext.js";
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
      // Use a default font size for initial text creation - increased for better readability
      const fontSize = 24;
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
  };  return (
    <div      style={{
        position: "fixed",
        left: position.x,
        top: position.y,
        zIndex: 10000,
        background: "rgba(255, 255, 255, 0.98)",
        border: "1px solid rgba(0, 0, 0, 0.12)",
        borderRadius: "12px",
        boxShadow: "0 12px 32px rgba(0, 0, 0, 0.08), 0 4px 12px rgba(0, 0, 0, 0.04)",
        minWidth: "320px",
        maxWidth: "450px",
        padding: "20px",
        fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
        backdropFilter: "blur(20px)",
        animation: "textInputFadeIn 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
      }}
    >      <div style={{
        fontSize: "14px",
        fontWeight: "700",
        color: "#2d3748",
        marginBottom: "12px",
        display: "flex",
        alignItems: "center",
        gap: "8px",
        padding: "4px 0"
      }}><svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
          <path d="M3 5h18a1 1 0 0 1 0 2H13v12a1 1 0 0 1-2 0V7H3a1 1 0 0 1 0-2z"/>
        </svg>
        Add Text
      </div>      <textarea
        ref={inputRef}
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={handleKeyDown}        style={{
          width: "100%",
          minHeight: "90px",
          maxHeight: "240px",
          padding: "14px 18px",
          fontSize: "15px",
          fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
          background: "rgba(248, 250, 252, 0.6)",
          color: "#1e293b",
          border: "1px solid rgba(0, 0, 0, 0.08)",
          borderRadius: "8px",
          outline: "none",
          resize: "vertical",
          boxSizing: "border-box",
          transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
          lineHeight: "1.6",
          boxShadow: "inset 0 1px 3px rgba(0, 0, 0, 0.05)"
        }}        onFocus={(e) => {
          e.target.style.borderColor = "rgba(0, 0, 0, 0.2)";
          e.target.style.background = "rgba(255, 255, 255, 0.95)";
          e.target.style.boxShadow = "0 0 0 3px rgba(0, 0, 0, 0.06), inset 0 1px 3px rgba(0, 0, 0, 0.05)";
          e.target.style.transform = "translateY(-1px)";
        }}
        onBlur={(e) => {
          e.target.style.borderColor = "rgba(0, 0, 0, 0.08)";
          e.target.style.background = "rgba(248, 250, 252, 0.6)";
          e.target.style.boxShadow = "inset 0 1px 3px rgba(0, 0, 0, 0.05)";
          e.target.style.transform = "translateY(0)";
        }}
        placeholder="Start typing your text here... Press Shift+Enter for new lines"
        autoFocus
      />      <div style={{ 
        marginTop: "12px", 
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center"
      }}>        <div style={{
          fontSize: "12px", 
          color: "#64748b",
          display: "flex",
          alignItems: "center",
          gap: "8px"
        }}>          <kbd style={{
            background: "rgba(241, 245, 249, 0.8)",
            border: "1px solid rgba(0, 0, 0, 0.08)", 
            borderRadius: "4px",
            padding: "3px 8px",
            fontSize: "11px",
            fontWeight: "600",
            boxShadow: "0 1px 2px rgba(0, 0, 0, 0.05)"
          }}>Enter</kbd>
          <span>to add text</span>
          <kbd style={{
            background: "rgba(241, 245, 249, 0.8)",
            border: "1px solid rgba(0, 0, 0, 0.08)", 
            borderRadius: "4px",
            padding: "3px 8px",
            fontSize: "11px",
            fontWeight: "600",
            boxShadow: "0 1px 2px rgba(0, 0, 0, 0.05)"
          }}>Esc</kbd>
          <span>to cancel</span>
        </div>        <div style={{
          fontSize: "12px",
          color: "#64748b",
          fontWeight: "600",
          background: "rgba(241, 245, 249, 0.8)",
          padding: "4px 8px",
          borderRadius: "4px",
          border: "1px solid rgba(0, 0, 0, 0.08)"
        }}>
          {text.length} characters
        </div>
      </div>
    </div>
  );
}
