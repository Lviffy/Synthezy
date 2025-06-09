import React from "react";
import { Redo, Undo } from "../assets/icons";
import { useAppContext } from "../provider/AppStates";

export default function UndoRedo() {
  const { undo, redo, history, historyIndex } = useAppContext();
  
  const canUndo = historyIndex > 0;
  const canRedo = history && historyIndex < history.length - 1;
  
  const handleUndo = (e) => {
    e.preventDefault();
    e.stopPropagation();
    undo();
  };
  
  const handleRedo = (e) => {
    e.preventDefault();
    e.stopPropagation();
    redo();
  };
  
  return (
    <section className="undoRedo">
      <button 
        type="button" 
        onClick={handleUndo}
        disabled={!canUndo}
        aria-label="Undo (Ctrl+Z)"
        title="Undo"
      >
        <Undo />
      </button>
      <button 
        type="button" 
        onClick={handleRedo}
        disabled={!canRedo}
        aria-label="Redo (Ctrl+Y)"
        title="Redo"
      >
        <Redo />
      </button>
    </section>
  );
}
