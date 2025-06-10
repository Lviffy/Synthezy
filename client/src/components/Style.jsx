import React, { useEffect, useState } from "react";
import {
  deleteElement,
  duplicateElement,
  deleteMultipleElements,
  duplicateMultipleElements,
  updateMultipleElements,
  minmax,
  moveElementLayer,
  updateElement,
} from "../helper/element";
import { useAppContext } from "../provider/AppStates";
import { BACKGROUND_COLORS, STROKE_COLORS, STROKE_STYLES, CORNER_STYLES } from "../global/var";
import { Backward, Delete, Duplicate, Forward, ToBack, ToFront } from "../assets/icons";

export default function Style({ selectedElement, selectedElements = [] }) {
  const { elements, setElements, setSelectedElement, setSelectedElements, setStyle } =
    useAppContext();  const [elementStyle, setElementStyle] = useState({
    fill: selectedElement?.fill,
    strokeWidth: selectedElement?.strokeWidth,
    strokeStyle: selectedElement?.strokeStyle,
    strokeColor: selectedElement?.strokeColor,
    opacity: selectedElement?.opacity,
    sloppiness: selectedElement?.sloppiness ?? 1,
    cornerStyle: selectedElement?.cornerStyle ?? "rounded",
    // Sticky note specific properties
    title: selectedElement?.title,
    content: selectedElement?.content,
    noteColor: selectedElement?.noteColor,
    textColor: selectedElement?.textColor,
  });  useEffect(() => {
    setElementStyle({
      fill: selectedElement?.fill,
      strokeWidth: selectedElement?.strokeWidth,
      strokeStyle: selectedElement?.strokeStyle,
      strokeColor: selectedElement?.strokeColor,
      opacity: selectedElement?.opacity,
      sloppiness: selectedElement?.sloppiness ?? 1,
      cornerStyle: selectedElement?.cornerStyle ?? "rounded",
      // Sticky note specific properties
      title: selectedElement?.title,
      content: selectedElement?.content,
      noteColor: selectedElement?.noteColor,
      textColor: selectedElement?.textColor,
    });
  }, [selectedElement]);

  const setStylesStates = (styleObject) => {
    setElementStyle((prevState) => ({ ...prevState, ...styleObject }));
    setStyle((prevState) => ({ ...prevState, ...styleObject }));
  };

  const isMultiSelection = selectedElements && Array.isArray(selectedElements) && selectedElements.length > 1;
  const hasSelection = selectedElement || isMultiSelection;

  if (!hasSelection) return;

  return (
    <section className="styleOptions">
      {/* Header Section */}
      <div className="properties-header">
        <div className="header-content">
          <h3 className="panel-title">Properties</h3>
          {isMultiSelection && (
            <span className="selection-badge">
              {selectedElements?.length || 0}
            </span>
          )}
        </div>
        {isMultiSelection && (
          <p className="selection-info">
            Bulk editing {selectedElements?.length || 0} elements
          </p>
        )}
      </div>      {/* Scrollable Content */}
      <div className="properties-content">        {/* Appearance Section - Hidden for sticky notes */}
        {selectedElement?.tool !== "stickyNote" && (
          <div className="properties-section">
            {/* Stroke Color */}
            <div className="property-group">
              <label className="property-label">
                <span>Stroke Color</span>
              </label>
              <div className="color-palette">
                {STROKE_COLORS.map((color, index) => (
                  <button
                    type="button"
                    title={color}
                    style={{ "--color": color }}
                    key={index}
                    className={
                      "color-swatch" +
                      (color === elementStyle.strokeColor ? " selected" : "")
                    }
                    onClick={() => {
                      setStylesStates({ strokeColor: color });
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
                    }}
                  />
                ))}
              </div>
            </div>

            {/* Background Color */}
            <div className="property-group">
              <label className="property-label">
                <span>Fill Color</span>
              </label>
              <div className="color-palette">
                {BACKGROUND_COLORS.map((fill, index) => (
                  <button
                    type="button"
                    title={fill}
                    className={
                      "color-swatch" +
                      (fill === elementStyle.fill ? " selected" : "")
                    }
                    style={{ "--color": fill }}
                    key={index}
                    onClick={() => {
                      setStylesStates({ fill });
                      if (isMultiSelection) {
                        updateMultipleElements(
                          selectedElements,
                          { fill },
                          setElements,
                          elements
                        );
                      } else {
                        updateElement(
                          selectedElement.id,
                          { fill },
                          setElements,
                          elements
                        );
                      }
                    }}
                  />
                ))}              </div>
            </div>

            {/* Stroke Style */}
            <div className="property-group">
              <label className="property-label">
                <span>Stroke Style</span>
              </label>
              <div className="button-group">
                {STROKE_STYLES.map((style, index) => (
                  <button
                    type="button"
                    title={style.slug}
                    className={
                      "style-button" +
                      (style.slug === elementStyle.strokeStyle ? " selected" : "")
                    }
                    key={index}
                    onClick={() => {
                      setStylesStates({ strokeStyle: style.slug });
                      if (isMultiSelection) {
                        updateMultipleElements(
                          selectedElements,
                          { strokeStyle: style.slug },
                          setElements,
                          elements
                        );
                      } else {
                        updateElement(
                          selectedElement.id,
                          { strokeStyle: style.slug },
                          setElements,
                          elements
                        );
                      }
                    }}
                  >
                    <style.icon />
                  </button>
                ))}
              </div>
            </div>

            {/* Stroke Width */}
            <div className="property-group">
              <label className="property-label">
                <span>Stroke Width</span>
                <span className="property-value">{elementStyle.strokeWidth}px</span>
              </label>
              <div className="slider-container">
                <input
                  type="range"
                  className="property-slider"
                  min={0.5}
                  max={20}
                  value={elementStyle.strokeWidth}
                  step="0.5"
                  style={{
                    '--slider-progress': `${((elementStyle.strokeWidth - 0.5) / (20 - 0.5)) * 100}%`
                  }}
                  onChange={({ target }) => {
                    const strokeWidth = minmax(+target.value, [0.5, 20]);
                    setStylesStates({ strokeWidth });
                    if (isMultiSelection) {
                      updateMultipleElements(
                        selectedElements,
                        { strokeWidth },
                        setElements,
                        elements
                      );
                    } else {
                      updateElement(
                        selectedElement.id,
                        { strokeWidth },
                        setElements,
                        elements
                      );
                    }
                  }}                />
              </div>            </div>

            {/* Corner Style - Only show for rectangles */}
            {((selectedElement?.tool === "rectangle") || 
              (isMultiSelection && selectedElements.some(el => el.tool === "rectangle"))) && (
              <div className="property-group">
                <label className="property-label">
                  <span>Corner Style</span>
                </label>
                <div className="button-group">
                  {CORNER_STYLES.map((style, index) => (
                    <button
                      type="button"
                      title={style.title}
                      className={
                        "style-button" +
                        (style.slug === elementStyle.cornerStyle ? " selected" : "")
                      }
                      key={index}
                      onClick={() => {
                        setStylesStates({ cornerStyle: style.slug });
                        if (isMultiSelection) {
                          updateMultipleElements(
                            selectedElements,
                            { cornerStyle: style.slug },
                            setElements,
                            elements
                          );
                        } else {
                          updateElement(
                            selectedElement.id,
                            { cornerStyle: style.slug },
                            setElements,
                            elements
                          );
                        }
                      }}
                    >
                      <style.icon />
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Opacity */}
            <div className="property-group">
              <label className="property-label">
                <span>Opacity</span>
                <span className="property-value">{elementStyle.opacity}%</span>
              </label>
              <div className="slider-container">
                <input
                  type="range"
                  min={0}
                  max={100}
                  className="property-slider"
                  value={elementStyle.opacity}
                  step="10"
                  style={{
                    '--slider-progress': `${elementStyle.opacity}%`
                  }}
                  onChange={({ target }) => {
                    const opacity = minmax(+target.value, [0, 100]);
                    setStylesStates({ opacity });
                    if (isMultiSelection) {
                      updateMultipleElements(
                        selectedElements,
                        { opacity },
                        setElements,
                        elements
                      );
                    } else {
                      updateElement(
                        selectedElement.id,
                        { opacity },
                        setElements,
                        elements
                      );
                    }
                  }}
                />
              </div>
            </div>            {/* Sloppiness */}
            <div className="property-group">
              <label className="property-label">
                <span>Sloppiness</span>
                <span className="property-value">{(elementStyle.sloppiness ?? 1).toFixed(1)}</span>
              </label>
              <div className="slider-container">
                <input
                  type="range"
                  className="property-slider"
                  min={0}
                  max={3}
                  value={elementStyle.sloppiness ?? 1}
                  step="0.1"
                  style={{
                    '--slider-progress': `${((elementStyle.sloppiness ?? 1) / 3) * 100}%`
                  }}
                  onChange={({ target }) => {
                    const sloppiness = minmax(+target.value, [0, 3]);
                    setStylesStates({ sloppiness });
                    if (isMultiSelection) {
                      updateMultipleElements(
                        selectedElements,
                        { sloppiness },
                        setElements,
                        elements
                      );
                    } else {
                      updateElement(
                        selectedElement.id,
                        { sloppiness },
                        setElements,
                        elements
                      );
                    }
                  }}
                />
              </div>
            </div>
          </div>
        )}

        {/* Sticky Note Section - Only for sticky note elements */}
        {selectedElement?.tool === "stickyNote" && !isMultiSelection && (
          <div className="properties-section">
            <h4 className="section-title">Sticky Note</h4>
            
            {/* Title Input */}            <div className="property-group">
              <label className="property-label">
                <span>Title (Optional)</span>
              </label>
              <input
                type="text"
                value={elementStyle.title || ""}                onChange={(e) => {
                  const title = e.target.value;
                  setElementStyle(prev => ({ ...prev, title }));
                  updateElement(
                    selectedElement.id,
                    { title },
                    setElements,
                    elements
                  );
                  
                  // Trigger auto-resize for sticky notes
                  if (selectedElement.tool === "stickyNote") {
                    // Force re-render to trigger auto-resize
                    setTimeout(() => {
                      // The re-render will trigger auto-resize in the canvas
                    }, 0);
                  }
                }}
                placeholder="Enter title..."
                style={{
                  width: "100%",
                  padding: "8px 12px",
                  border: "1px solid rgba(0, 0, 0, 0.12)",
                  borderRadius: "6px",
                  fontSize: "14px",
                  fontFamily: "inherit"
                }}
              />
            </div>            {/* Content Textarea */}
            <div className="property-group">
              <label className="property-label">
                <span>Content</span>
              </label>
              <textarea
                value={elementStyle.content || ""}                onChange={(e) => {
                  const content = e.target.value;
                  setElementStyle(prev => ({ ...prev, content }));
                  updateElement(
                    selectedElement.id,
                    { content },
                    setElements,
                    elements
                  );
                  
                  // Trigger auto-resize for sticky notes
                  if (selectedElement.tool === "stickyNote") {
                    // Force re-render to trigger auto-resize
                    setTimeout(() => {
                      // The re-render will trigger auto-resize in the canvas
                    }, 0);
                  }
                }}                onKeyDown={(e) => {
                  // Allow both Enter and Shift+Enter for new lines
                  // No need to prevent default Enter behavior for new lines
                }}
                placeholder="Enter content... (Enter or Shift+Enter for new lines)"
                rows={3}
                style={{
                  width: "100%",
                  padding: "8px 12px",
                  border: "1px solid rgba(0, 0, 0, 0.12)",
                  borderRadius: "6px",
                  fontSize: "14px",
                  fontFamily: "inherit",
                  resize: "vertical",
                  minHeight: "60px",
                  lineHeight: "1.4"
                }}
              />
            </div>

            {/* Note Color */}
            <div className="property-group">
              <label className="property-label">
                <span>Note Color</span>
              </label>
              <div className="color-palette">
                {[
                  { name: "Yellow", color: "#fff3a0" },
                  { name: "Pink", color: "#ffb3d9" },
                  { name: "Blue", color: "#a0d8ff" },
                  { name: "Green", color: "#b3ffb3" },
                  { name: "Orange", color: "#ffcc99" },
                  { name: "Purple", color: "#d9b3ff" },
                ].map((colorOption, index) => (
                  <button
                    key={index}
                    type="button"
                    title={colorOption.name}
                    style={{ "--color": colorOption.color }}
                    className={
                      "color-swatch" +
                      (colorOption.color === elementStyle.noteColor ? " selected" : "")
                    }
                    onClick={() => {
                      const noteColor = colorOption.color;
                      setElementStyle(prev => ({ ...prev, noteColor }));
                      updateElement(
                        selectedElement.id,
                        { noteColor, fill: noteColor },
                        setElements,
                        elements
                      );
                    }}
                  />
                ))}
              </div>
            </div>

            {/* Text Color */}
            <div className="property-group">
              <label className="property-label">
                <span>Text Color</span>
              </label>
              <div className="color-palette">
                {[
                  "#000000", "#333333", "#666666", "#999999", 
                  "#2563eb", "#dc2626", "#16a34a", "#ca8a04"
                ].map((color, index) => (
                  <button
                    key={index}
                    type="button"
                    title={color}
                    style={{ "--color": color }}
                    className={
                      "color-swatch" +
                      (color === elementStyle.textColor ? " selected" : "")
                    }
                    onClick={() => {
                      const textColor = color;
                      setElementStyle(prev => ({ ...prev, textColor }));
                      updateElement(
                        selectedElement.id,
                        { textColor, strokeColor: textColor },
                        setElements,
                        elements
                      );
                    }}
                  />
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Layers Section - Only for single selection */}
        {selectedElement?.id && !isMultiSelection && (
          <div className="properties-section">
            <div className="property-group">
              <div className="button-group layers-group">
                <button
                  type="button"
                  className="action-button"
                  title="Send to back"
                  onClick={() =>
                    moveElementLayer(
                      selectedElement.id,
                      0,
                      setElements,
                      elements
                    )
                  }
                >
                  <ToBack />
                  <span>Back</span>
                </button>
                <button
                  type="button"
                  className="action-button"
                  title="Send backward"
                  onClick={() =>
                    moveElementLayer(
                      selectedElement.id,
                      -1,
                      setElements,
                      elements
                    )
                  }
                >
                  <Backward />
                  <span>Backward</span>
                </button>
                <button
                  type="button"
                  className="action-button"
                  title="Bring forward"
                  onClick={() =>
                    moveElementLayer(selectedElement.id, 1, setElements, elements)
                  }
                >
                  <Forward />
                  <span>Forward</span>
                </button>
                <button
                  type="button"
                  className="action-button"
                  title="Bring to front"
                  onClick={() =>
                    moveElementLayer(selectedElement.id, 2, setElements, elements)
                  }
                >
                  <ToFront />
                  <span>Front</span>
                </button>
              </div>
            </div>
          </div>
        )}        {/* Actions Section */}
        <div className="properties-section">
          <div className="property-group">
            {!isMultiSelection ? (
              <div className="action-buttons">
                <button
                  type="button"
                  onClick={() => {
                    deleteElement(
                      selectedElement,
                      setElements,
                      setSelectedElement
                    );
                  }}
                  title="Delete element"
                  className="action-button delete"
                >
                  <Delete />
                  <span>Delete</span>
                </button>
                <button
                  type="button"
                  className="action-button duplicate"
                  title="Duplicate element (Ctrl + D)"
                  onClick={() => {
                    duplicateElement(
                      selectedElement,
                      setElements,
                      setSelectedElement,
                      10
                    );
                  }}
                >
                  <Duplicate />
                  <span>Duplicate</span>
                </button>
              </div>
            ) : (
              <div className="action-buttons">
                <button
                  type="button"
                  onClick={() => {
                    deleteMultipleElements(
                      selectedElements,
                      setElements,
                      setSelectedElement,
                      setSelectedElements
                    );
                  }}
                  title={`Delete ${selectedElements?.length || 0} elements`}
                  className="action-button delete"
                >
                  <Delete />
                  <span>Delete All</span>
                </button>
                <button
                  type="button"
                  className="action-button duplicate"
                  title={`Duplicate ${selectedElements?.length || 0} elements (Ctrl + D)`}
                  onClick={() => {
                    duplicateMultipleElements(
                      selectedElements,
                      setElements,
                      setSelectedElements,
                      10
                    );
                  }}
                >
                  <Duplicate />
                  <span>Duplicate All</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
