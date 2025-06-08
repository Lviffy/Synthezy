import useCanvas from "../hooks/useCanvas";
import TextInput from "./TextInput";
import { useAppContext } from "../provider/AppStates";

export default function Canvas() {
  const {
    canvasRef,
    dimension,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    handleWheel,
    textInputMode,
    setTextInputMode,
  } = useCanvas();
  
  const { style, scale, translate, scaleOffset } = useAppContext();

  // Convert canvas coordinates to screen coordinates for text input positioning
  const getScreenPosition = (canvasX, canvasY) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return { x: canvasX, y: canvasY };
    
    const screenX = (canvasX * scale + translate.x * scale - scaleOffset.x) + rect.left;
    const screenY = (canvasY * scale + translate.y * scale - scaleOffset.y) + rect.top;
    
    return { x: screenX, y: screenY };
  };
  return (
    <>
      <canvas
        id="canvas"
        ref={canvasRef}
        width={dimension.width}
        height={dimension.height}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onWheel={handleWheel}
      />
      {textInputMode && (
        <TextInput
          position={getScreenPosition(textInputMode.x, textInputMode.y)}
          onComplete={() => setTextInputMode(null)}
          style={style}
        />
      )}
    </>
  );
}
