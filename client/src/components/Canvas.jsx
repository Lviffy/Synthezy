import useCanvas from "../hooks/useCanvas";
import { useAppContext } from "../hooks/useAppContext.js";
import TextInput from "./TextInput";
import { createPortal } from "react-dom";

export default function Canvas() {  const {
    canvasRef,
    dimension,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    handleWheel,
    handleContextMenu,
    textInputMode,
    setTextInputMode,
  } = useCanvas();
  const { style, scale, translate, scaleOffset, handleTouchStart, handleTouchMove, handleTouchEnd } = useAppContext();

  return (
    <>      <canvas
        id="canvas"
        ref={canvasRef}
        width={dimension.width}
        height={dimension.height}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onContextMenu={handleContextMenu}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        style={{ touchAction: 'none' }} // Prevent default touch behaviors
      />{textInputMode && createPortal(
        <TextInput
          position={{ x: textInputMode.x, y: textInputMode.y }}
          onComplete={() => setTextInputMode(null)}
          style={style}
          canvasPosition={{ x: textInputMode.canvasX, y: textInputMode.canvasY }}
        />,
        document.body
      )}
    </>
  );
}
