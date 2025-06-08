import { useState, useRef, useEffect } from "react";
import { useAppContext } from "../provider/AppStates";
import { createElement } from "../helper/element";

export default function TextInput({ position, onComplete, style }) {
  const [text, setText] = useState("");
  const [fontSize, setFontSize] = useState(16);
  const inputRef = useRef(null);
  const { setElements, setSelectedElement, setSelectedTool, lockTool } = useAppContext();

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  const handleComplete = () => {
    if (text.trim()) {
      // Estimate text dimensions
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      ctx.font = `${fontSize}px Arial`;
      const textMetrics = ctx.measureText(text);
      const textWidth = textMetrics.width;
      const textHeight = fontSize;

      const element = createElement(
        position.x,
        position.y,
        position.x + textWidth,
        position.y + textHeight,
        style,
        "text"
      );
      element.text = text;
      element.fontSize = fontSize;
      element.fontFamily = "Arial";

      setElements((prevState) => [...prevState, element]);
      
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
        position: "absolute",
        left: position.x,
        top: position.y,
        zIndex: 1000,
        background: "transparent",
        border: "2px dashed #007acc",
        borderRadius: "4px",
        padding: "4px",
        minWidth: "100px",
        minHeight: "24px",
      }}
    >
      <textarea
        ref={inputRef}
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={handleComplete}
        placeholder="Type text..."
        style={{
          border: "none",
          outline: "none",
          background: "transparent",
          resize: "none",
          fontSize: `${fontSize}px`,
          fontFamily: "Arial",
          color: style.strokeColor || "#000",
          width: "100%",
          minHeight: "20px",
          overflow: "hidden",
        }}
        rows={1}
      />
      <div
        style={{
          position: "absolute",
          top: "-30px",
          left: "0",
          background: "#fff",
          border: "1px solid #ccc",
          borderRadius: "4px",
          padding: "2px 8px",
          fontSize: "12px",
          display: "flex",
          gap: "8px",
          alignItems: "center",
          boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
        }}
      >
        <span>Size:</span>
        <input
          type="number"
          value={fontSize}
          onChange={(e) => setFontSize(Math.max(8, Math.min(72, parseInt(e.target.value) || 16)))}
          style={{ width: "40px", border: "1px solid #ccc", borderRadius: "2px" }}
          min="8"
          max="72"
        />
      </div>
    </div>
  );
}
