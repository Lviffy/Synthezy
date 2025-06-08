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
import { BACKGROUND_COLORS, STROKE_COLORS, STROKE_STYLES } from "../global/var";
import { Backward, Delete, Duplicate, Forward, ToBack, ToFront } from "../assets/icons";

export default function Style({ selectedElement, selectedElements = [] }) {
  const { elements, setElements, setSelectedElement, setSelectedElements, setStyle } =
    useAppContext();
  const [elementStyle, setElementStyle] = useState({
    fill: selectedElement?.fill,
    strokeWidth: selectedElement?.strokeWidth,
    strokeStyle: selectedElement?.strokeStyle,
    strokeColor: selectedElement?.strokeColor,
    opacity: selectedElement?.opacity,
  });

  useEffect(() => {
    setElementStyle({
      fill: selectedElement?.fill,
      strokeWidth: selectedElement?.strokeWidth,
      strokeStyle: selectedElement?.strokeStyle,
      strokeColor: selectedElement?.strokeColor,
      opacity: selectedElement?.opacity,
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
      {isMultiSelection && (
        <div className="group multiSelection">
          <p>Multi-Selection ({selectedElements && Array.isArray(selectedElements) ? selectedElements.length : 0} elements)</p>
          <div className="innerGroup">
            <span style={{ fontSize: '12px', color: '#666' }}>
              Changes will apply to all selected elements
            </span>
          </div>
        </div>
      )}
      <div className="group strokeColor">
        <p>Stroke</p>
        <div className="innerGroup">
          {STROKE_COLORS.map((color, index) => (
            <button
              type="button"
              title={color}
              style={{ "--color": color }}
              key={index}
              className={
                "itemButton color" +
                (color == elementStyle.strokeColor ? " selected" : "")
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
            ></button>
          ))}
        </div>
      </div>
      <div className="group backgroundColor">
        <p>Background</p>
        <div className="innerGroup">
          {BACKGROUND_COLORS.map((fill, index) => (
            <button
              type="button"
              title={fill}
              className={
                "itemButton color" +
                (fill == elementStyle.fill ? " selected" : "")
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
            ></button>
          ))}
        </div>
      </div>
      <div className="group strokeWidth">
        <p>Stroke width</p>
        <div className="innerGroup">
          <input
            type="range"
            className="itemRange"
            min={0}
            max={20}
            value={elementStyle.strokeWidth}
            step="1"
            onChange={({ target }) => {
              const strokeWidth = minmax(+target.value, [0, 20]);
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
            }}
          />
        </div>
      </div>
      <div className="group strokeStyle">
        <p>Stroke style</p>
        <div className="innerGroup">
          {STROKE_STYLES.map((style, index) => (
            <button
              type="button"
              title={style.slug}
              className={
                "itemButton option" +
                (style.slug == elementStyle.strokeStyle ? " selected" : "")
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
      <div className="group opacity">
        <p>Opacity</p>
        <div className="innerGroup">
          <input
            type="range"
            min={0}
            max={100}
            className="itemRange"
            value={elementStyle.opacity}
            step="10"
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
      </div>
      {selectedElement?.id && !isMultiSelection && (
        <React.Fragment>
          <div className="group layers">
            <p>Layers</p>
            <div className="innerGroup">
              <button
                type="button"
                className="itemButton option"
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
              </button>
              <button
                type="button"
                className="itemButton option"
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
              </button>
              <button
                type="button"
                className="itemButton option"
                title="Bring forward"
                onClick={() =>
                  moveElementLayer(selectedElement.id, 1, setElements, elements)
                }
              >
                <Forward />
              </button>
              <button
                type="button"
                className="itemButton option"
                title="Bring to front"
                onClick={() =>
                  moveElementLayer(selectedElement.id, 2, setElements, elements)
                }
              >
                <ToFront />
              </button>
            </div>
          </div>

          <div className="group actions">
            <p>Actions</p>
            <div className="innerGroup">
              <button
                type="button"
                onClick={() => {
                  deleteElement(
                    selectedElement,
                    setElements,
                    setSelectedElement
                  );
                }}
                title="Delete"
                className="itemButton option"
              >
                <Delete />
              </button>
              <button
                type="button"
                className="itemButton option"
                title="Duplicate ~ Ctrl + d"
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
              </button>
            </div>
          </div>
        </React.Fragment>
      )}
      
      {isMultiSelection && (
        <div className="group actions">
          <p>Actions</p>
          <div className="innerGroup">
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
              title={`Delete ${selectedElements && Array.isArray(selectedElements) ? selectedElements.length : 0} elements`}
              className="itemButton option"
            >
              <Delete />
            </button>
            <button
              type="button"
              className="itemButton option"
              title={`Duplicate ${selectedElements && Array.isArray(selectedElements) ? selectedElements.length : 0} elements ~ Ctrl + d`}
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
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
