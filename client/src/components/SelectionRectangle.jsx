import { useAppContext } from '../provider/AppStates';

export default function SelectionRectangle() {
  const { action, selectionBounds, scale, translate, scaleOffset } = useAppContext();

  if (action !== 'selecting' || !selectionBounds) {
    return null;
  }

  const { x1, y1, x2, y2 } = selectionBounds;
  
  // Calculate the position and size of the selection rectangle
  const translateX = translate.x * scale - scaleOffset.x;
  const translateY = translate.y * scale - scaleOffset.y;
  
  const startX = x1 * scale + translateX;
  const startY = y1 * scale + translateY;
  const endX = x2 * scale + translateX;
  const endY = y2 * scale + translateY;
  
  const left = Math.min(startX, endX);
  const top = Math.min(startY, endY);
  const width = Math.abs(endX - startX);
  const height = Math.abs(endY - startY);

  return (
    <div
      style={{
        position: 'fixed',
        left: `${left}px`,
        top: `${top}px`,
        width: `${width}px`,
        height: `${height}px`,
        border: '1px dashed #3b82f6',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        pointerEvents: 'none',
        zIndex: 100,
      }}
    />
  );
}
