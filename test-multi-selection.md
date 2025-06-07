# Multi-Selection Test Plan

## Testing "Select All and Drag" Feature

### 1. **Marquee Selection Test**
- Draw 3-4 different shapes (rectangle, circle, diamond) on canvas
- Use selection tool and drag to create a marquee selection rectangle
- Verify all shapes within/touching the rectangle get selected (blue dashed borders)
- Click and drag any selected shape to move the entire group together

### 2. **Ctrl+A Select All Test**
- Draw multiple shapes on canvas
- Press Ctrl+A to select all elements
- Verify all shapes show blue dashed selection borders
- Click and drag any shape to move entire group as one unit

### 3. **Shift+Click Multi-Selection Test**
- Draw multiple shapes
- Hold Shift and click individual shapes to add/remove from selection
- Verify selection state toggles correctly
- Drag any selected shape to move the group

### 4. **Keyboard Movement Test**
- Select multiple elements (any method above)
- Use arrow keys to move the group 1 pixel at a time
- Verify all selected elements move together

### 5. **Mixed Selection and Single Element Test**
- Select multiple elements
- Click on a non-selected element (without Shift) to deselect others
- Verify only the clicked element becomes selected
- Then select multiple again and test drag movement

### Expected Behaviors:
✅ **Multi-selection indicators**: Blue dashed borders around all selected elements
✅ **Grouped movement**: All selected elements move together maintaining relative positions
✅ **Smooth interaction**: No jumping or random movement during drag operations
✅ **Proper state management**: Selection states update correctly after operations
✅ **Keyboard shortcuts**: Ctrl+A, Delete, arrow keys work with multi-selection

### Key Implementation Features:
1. **Marquee Selection**: Drag to create selection rectangle
2. **Grouped Dragging**: Click any selected element to drag entire group
3. **Delta-based Movement**: Uses mouse position delta for smooth group movement
4. **State Synchronization**: Keeps selectedElements array updated with current positions
