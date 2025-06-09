import { useState, useRef, useEffect } from "react";
import { useAppContext } from "../provider/AppStates";
import { createElement } from "../helper/element";

export default function StickyNoteInput({ position, onComplete, style, canvasPosition }) {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [noteColor, setNoteColor] = useState("#fff3a0"); // Default yellow sticky note color
  const [textColor, setTextColor] = useState("#333333");
  const [isExpanded, setIsExpanded] = useState(false);
  const titleInputRef = useRef(null);
  const { setElements, setSelectedElement, setSelectedTool, lockTool } = useAppContext();

  useEffect(() => {
    if (titleInputRef.current) {
      titleInputRef.current.focus();
    }
  }, []);
  const handleKeyDown = (e) => {
    if (e.key === "Escape") {
      onComplete();
    }
    // Allow Enter and Shift+Enter for new lines in textareas - no prevention needed
  };
  const handleSave = () => {
    if (title.trim() === "" && content.trim() === "") {
      alert("Please enter either a title or content for the sticky note");
      return;
    }const element = createElement(
      canvasPosition.x,
      canvasPosition.y,
      canvasPosition.x + 240,
      canvasPosition.y + 180,
      {
        ...style,
        fill: noteColor,
        strokeColor: textColor,
        opacity: 85, // Default translucent
      },
      "stickyNote"
    );

    // Add sticky note specific properties
    element.title = title;
    element.content = content;
    element.noteColor = noteColor;
    element.textColor = textColor;

    setElements((prevState) => [...prevState, element]);
    
    if (!lockTool) {
      setSelectedTool("selection");
      setSelectedElement(element);
    }
    
    onComplete();
  };

  const colorOptions = [
    { name: "Yellow", color: "#fff3a0" },
    { name: "Pink", color: "#ffb3d9" },
    { name: "Blue", color: "#a0d8ff" },
    { name: "Green", color: "#b3ffb3" },
    { name: "Orange", color: "#ffcc99" },
    { name: "Purple", color: "#d9b3ff" },
  ];

  return (
    <div
      style={{
        position: "fixed",
        left: position.x + 10,
        top: position.y + 10,
        zIndex: 10000,
        background: "rgba(255, 255, 255, 0.98)",
        border: "1px solid rgba(0, 0, 0, 0.15)",
        borderRadius: "12px",
        padding: "20px",
        boxShadow: "0 8px 32px rgba(0, 0, 0, 0.12)",
        backdropFilter: "blur(20px)",
        fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
        minWidth: "300px",
        maxWidth: "400px",
        animation: "stickyNoteInputFadeIn 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
      }}
    >
      <div style={{
        fontSize: "16px",
        fontWeight: "700",
        color: "#2d3748",
        marginBottom: "16px",
        display: "flex",
        alignItems: "center",
        gap: "8px",
        padding: "4px 0"
      }}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
          <rect width={16} height={16} x={4} y={4} rx={2} />
          <path d="M16 4v16l-4-4H4" />
          <path d="M8 8h8" />
          <path d="M8 12h6" />
        </svg>
        Create Sticky Note
      </div>

      {/* Title Input */}
      <div style={{ marginBottom: "16px" }}>        <label style={{
          display: "block",
          fontSize: "14px",
          fontWeight: "600",
          color: "#4a5568",
          marginBottom: "8px"
        }}>
          Title (Optional)
        </label>
        <input
          ref={titleInputRef}
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Enter note title..."
          style={{
            width: "100%",
            padding: "12px 16px",
            fontSize: "14px",
            fontFamily: "inherit",
            background: "rgba(248, 250, 252, 0.8)",
            color: "#1e293b",
            border: "1px solid rgba(0, 0, 0, 0.08)",
            borderRadius: "8px",
            outline: "none",
            boxSizing: "border-box",
            transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
            boxShadow: "inset 0 1px 3px rgba(0, 0, 0, 0.05)"
          }}
          onFocus={(e) => {
            e.target.style.borderColor = "rgba(0, 0, 0, 0.2)";
            e.target.style.background = "rgba(255, 255, 255, 0.95)";
          }}
          onBlur={(e) => {
            e.target.style.borderColor = "rgba(0, 0, 0, 0.08)";
            e.target.style.background = "rgba(248, 250, 252, 0.8)";
          }}
        />
      </div>

      {/* Expandable Content Section */}
      <div style={{ marginBottom: "16px" }}>
        <button
          type="button"
          onClick={() => setIsExpanded(!isExpanded)}
          style={{
            background: "none",
            border: "none",
            color: "#4a5568",
            fontSize: "14px",
            fontWeight: "600",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: "6px",
            padding: "4px 0",
            marginBottom: "8px"
          }}
        >
          <svg 
            width="14" 
            height="14" 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="currentColor" 
            strokeWidth="2"
            style={{
              transform: isExpanded ? "rotate(90deg)" : "rotate(0deg)",
              transition: "transform 0.2s ease"
            }}
          >
            <path d="m9 18 6-6-6-6"/>
          </svg>
          Content (Optional)
        </button>
        
        {isExpanded && (
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Add additional content... (Enter for new lines)"
            style={{
              width: "100%",
              minHeight: "80px",
              maxHeight: "150px",
              padding: "12px 16px",
              fontSize: "14px",
              fontFamily: "inherit",
              background: "rgba(248, 250, 252, 0.8)",
              color: "#1e293b",
              border: "1px solid rgba(0, 0, 0, 0.08)",
              borderRadius: "8px",
              outline: "none",
              resize: "vertical",
              boxSizing: "border-box",
              transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
              lineHeight: "1.5",
              boxShadow: "inset 0 1px 3px rgba(0, 0, 0, 0.05)"
            }}
            onFocus={(e) => {
              e.target.style.borderColor = "rgba(0, 0, 0, 0.2)";
              e.target.style.background = "rgba(255, 255, 255, 0.95)";
            }}
            onBlur={(e) => {
              e.target.style.borderColor = "rgba(0, 0, 0, 0.08)";
              e.target.style.background = "rgba(248, 250, 252, 0.8)";
            }}
          />
        )}
      </div>

      {/* Color Picker */}
      <div style={{ marginBottom: "20px" }}>
        <label style={{
          display: "block",
          fontSize: "14px",
          fontWeight: "600",
          color: "#4a5568",
          marginBottom: "10px"
        }}>
          Note Color
        </label>
        <div style={{
          display: "flex",
          gap: "8px",
          flexWrap: "wrap"
        }}>
          {colorOptions.map((option) => (
            <button
              key={option.color}
              type="button"
              onClick={() => setNoteColor(option.color)}
              style={{
                width: "32px",
                height: "32px",
                borderRadius: "8px",
                border: noteColor === option.color ? "3px solid #4a5568" : "2px solid rgba(0, 0, 0, 0.1)",
                background: option.color,
                cursor: "pointer",
                transition: "all 0.2s ease",
                boxShadow: "inset 0 1px 3px rgba(0, 0, 0, 0.1)"
              }}
              title={option.name}
            />
          ))}
        </div>
      </div>

      {/* Text Color */}
      <div style={{ marginBottom: "20px" }}>
        <label style={{
          display: "block",
          fontSize: "14px",
          fontWeight: "600",
          color: "#4a5568",
          marginBottom: "8px"
        }}>
          Text Color
        </label>
        <div style={{ display: "flex", gap: "8px" }}>
          {["#333333", "#000000", "#666666", "#993300", "#0066cc"].map((color) => (
            <button
              key={color}
              type="button"
              onClick={() => setTextColor(color)}
              style={{
                width: "28px",
                height: "28px",
                borderRadius: "6px",
                border: textColor === color ? "3px solid #4a5568" : "2px solid rgba(0, 0, 0, 0.1)",
                background: color,
                cursor: "pointer",
                transition: "all 0.2s ease"
              }}
            />
          ))}
        </div>
      </div>

      {/* Action Buttons */}
      <div style={{
        display: "flex",
        gap: "10px",
        justifyContent: "flex-end",
        paddingTop: "16px",
        borderTop: "1px solid rgba(0, 0, 0, 0.06)"
      }}>
        <button
          type="button"
          onClick={onComplete}
          style={{
            padding: "10px 20px",
            fontSize: "14px",
            fontWeight: "600",
            fontFamily: "inherit",
            background: "rgba(248, 250, 252, 0.8)",
            color: "#4a5568",
            border: "1px solid rgba(0, 0, 0, 0.08)",
            borderRadius: "8px",
            cursor: "pointer",
            transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
          }}
          onMouseEnter={(e) => {
            e.target.style.background = "rgba(226, 232, 240, 0.9)";
            e.target.style.transform = "translateY(-1px)";
          }}
          onMouseLeave={(e) => {
            e.target.style.background = "rgba(248, 250, 252, 0.8)";
            e.target.style.transform = "translateY(0)";
          }}
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={handleSave}
          style={{
            padding: "10px 20px",
            fontSize: "14px",
            fontWeight: "600",
            fontFamily: "inherit",
            background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
            color: "white",
            border: "none",
            borderRadius: "8px",
            cursor: "pointer",
            transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
            boxShadow: "0 4px 12px rgba(102, 126, 234, 0.3)"
          }}
          onMouseEnter={(e) => {
            e.target.style.transform = "translateY(-2px)";
            e.target.style.boxShadow = "0 6px 20px rgba(102, 126, 234, 0.4)";
          }}
          onMouseLeave={(e) => {
            e.target.style.transform = "translateY(0)";
            e.target.style.boxShadow = "0 4px 12px rgba(102, 126, 234, 0.3)";
          }}
        >
          Create Note
        </button>
      </div>

      <style>
        {`
          @keyframes stickyNoteInputFadeIn {
            from {
              opacity: 0;
              transform: scale(0.95) translateY(-10px);
            }
            to {
              opacity: 1;
              transform: scale(1) translateY(0);
            }
          }
        `}
      </style>
    </div>
  );
}
