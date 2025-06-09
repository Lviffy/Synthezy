import { useState, useRef, useCallback } from "react";
import { socket } from "../api/socket";

export default function useHistory(initialState, session) {
  const [history, setHistory] = useState([initialState]);
  const [index, setIndex] = useState(0);
  const lastEmitTime = useRef(0);
  const pendingEmit = useRef(null);

  // Debounced emit function to reduce excessive socket traffic during real-time collaboration
  const debouncedEmit = useCallback((elements, room) => {
    const now = performance.now();
    const timeSinceLastEmit = now - lastEmitTime.current;
    
    // Clear any pending emit
    if (pendingEmit.current) {
      clearTimeout(pendingEmit.current);
    }
    
    // If enough time has passed, emit immediately
    if (timeSinceLastEmit >= 50) { // Allow up to 20 updates per second
      lastEmitTime.current = now;
      socket.emit("getElements", { elements, room });
    } else {
      // Otherwise, schedule a debounced emit
      pendingEmit.current = setTimeout(() => {
        lastEmitTime.current = performance.now();
        socket.emit("getElements", { elements, room });
        pendingEmit.current = null;
      }, 50 - timeSinceLastEmit);
    }
  }, []);

  const setState = (action, overwrite = false, emit = true) => {
    const newState =
      typeof action === "function" ? action(history[index]) : action;

    if (action == "prevState") {
      const updatedState = [...history].slice(0, index + 1);
      setHistory([...updatedState, history[index - 1]]);
      setIndex((prevState) => prevState - 1);
      return;
    }

    if (overwrite) {
      const historyCopy = [...history];
      historyCopy[index] = newState;
      setHistory(historyCopy);
    } else {
      const updatedState = [...history].slice(0, index + 1);
      setHistory([...updatedState, newState]);
      setIndex((prevState) => prevState + 1);
    }

    // Handle collaboration sync after updating local history
    if (session && emit) {
      debouncedEmit(newState, session);
    }
  };

  const undo = () => {
    setIndex((prevState) => {
      const newIndex = prevState > 0 ? prevState - 1 : prevState;
      return newIndex;
    });
  };

  const redo = () => {
    setIndex((prevState) => {
      const newIndex = prevState < history.length - 1 ? prevState + 1 : prevState;
      return newIndex;
    });
  };

  return [history[index], setState, undo, redo, history, index];
}
