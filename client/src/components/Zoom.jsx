import React from "react";
import { useAppContext } from "../provider/AppStates";
import GridToggle from "./GridToggle";

export default function Zoom() {
  const { scale, onZoom, zoomToFitContent } = useAppContext();
  
  const handleZoomIn = () => {
    onZoom(0.1, null, null, { animate: true });
  };

  const handleZoomOut = () => {
    onZoom(-0.1, null, null, { animate: true });
  };

  const handleResetZoom = () => {
    onZoom("default", null, null, { animate: true });
  };

  const handleFitContent = () => {
    zoomToFitContent();
  };

  const handleFastZoomIn = () => {
    onZoom(0.5, null, null, { isFastZoom: true, animate: true });
  };

  const handleFastZoomOut = () => {
    onZoom(-0.5, null, null, { isFastZoom: true, animate: true });
  };
  
  return (
    <section className="zoomOptions">
      <button 
        className="zoom out" 
        onClick={handleZoomOut}
        onDoubleClick={handleFastZoomOut}
        title="Zoom out (Ctrl + -) / Double-click for fast zoom"
      >
        -
      </button>
      <span
        className="zoom text"
        onClick={handleResetZoom}
        title="Reset zoom to 100% (Ctrl + 0)"
      >
        {new Intl.NumberFormat("fr-CA", { style: "percent" }).format(scale)}
      </span>
      <button 
        className="zoom in" 
        onClick={handleZoomIn}
        onDoubleClick={handleFastZoomIn}
        title="Zoom in (Ctrl + +) / Double-click for fast zoom"
      >
        +
      </button>
      <button 
        className="zoom fit" 
        onClick={handleFitContent}
        title="Fit all content to 100% of canvas viewport"
      >
        ⌂
      </button>
      <GridToggle />
    </section>
  );
}
