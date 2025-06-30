import React, { useRef, useEffect, useState } from 'react';
import { useAppContext } from "../hooks/useAppContext.js";
import {
  Copy,
  Cut,
  Paste,
  Delete,
  Duplicate,
  Group,
  Ungroup,
  Lock,
  Unlock,
  SendToBack,
  BringToFront,
  SendBackward,
  BringForward,
  Frame,
  Export,
  FlipHorizontal,
  FlipVertical,
  CopyStyles,
  Library,
  ZoomIn,
  ZoomOut,
  Grid,
  Undo,
  Redo,
  SelectAll,
  ClearCanvas
} from '../assets/icons';
import {
  copyElements,
  pasteElements,
  deleteElement,
  deleteMultipleElements,
  duplicateElement,
  duplicateMultipleElements,
  moveElementLayer
} from '../helper/element';

// Import clipboard data check
const hasClipboardData = () => {
  try {
    // Check if the copyElements function has set clipboard data
    // This is a simple check - in a real app you might want to import the clipboard state
    return localStorage.getItem('clipboardData') !== null;
  } catch {
    return false;
  }
};

export default function ContextMenu() {
  const {
    contextMenu,
    setContextMenu,
    selectedElement,
    selectedElements,
    elements,
    setElements,
    setSelectedElement,
    setSelectedElements,
    currentMousePosition,
    undo,
    redo,
    showGrid,
    setShowGrid,
    onZoom,
    scale,
    zoomToFitContent
  } = useAppContext();
  const menuRef = useRef(null);
  const [copiedStyles, setCopiedStyles] = useState(null);

  // Close context menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setContextMenu(null);
      }
    };

    const handleScroll = () => {
      setContextMenu(null);
    };

    const handleEscapeKey = (event) => {
      if (event.key === 'Escape') {
        setContextMenu(null);
      }
    };

    if (contextMenu) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('wheel', handleScroll);
      document.addEventListener('keydown', handleEscapeKey);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('wheel', handleScroll);
      document.removeEventListener('keydown', handleEscapeKey);
    };
  }, [contextMenu, setContextMenu]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (!contextMenu) return;

      const menuItems = getMenuItems().filter(item => item.type !== 'separator' && !item.disabled);
      const focusedIndex = menuItems.findIndex(item => item.focused);

      switch (event.key) {
        case 'ArrowDown':
          event.preventDefault();
          const nextIndex = (focusedIndex + 1) % menuItems.length;
          menuItems.forEach((item, index) => {
            item.focused = index === nextIndex;
          });
          break;
        case 'ArrowUp':
          event.preventDefault();
          const prevIndex = (focusedIndex - 1 + menuItems.length) % menuItems.length;
          menuItems.forEach((item, index) => {
            item.focused = index === prevIndex;
          });
          break;
        case 'Enter':
          event.preventDefault();
          const focusedItem = menuItems[focusedIndex];
          if (focusedItem) {
            focusedItem.action();
          }
          break;
      }
    };

    if (contextMenu) {
      document.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [contextMenu]);

  if (!contextMenu) return null;

  const { x, y, type } = contextMenu;

  // Position adjustment to prevent overflow
  const adjustPosition = (x, y) => {
    const menuWidth = 280; // Estimated menu width
    const menuHeight = 400; // Estimated menu height
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    let adjustedX = x;
    let adjustedY = y;

    if (x + menuWidth > viewportWidth) {
      adjustedX = viewportWidth - menuWidth - 10;
    }

    if (y + menuHeight > viewportHeight) {
      adjustedY = viewportHeight - menuHeight - 10;
    }

    return { x: Math.max(10, adjustedX), y: Math.max(10, adjustedY) };
  };

  const { x: adjustedX, y: adjustedY } = adjustPosition(x, y);

  const handleCut = () => {
    if (selectedElements && selectedElements.length > 0) {
      copyElements(selectedElements);
      deleteMultipleElements(selectedElements, setElements, setSelectedElement, setSelectedElements);
    } else if (selectedElement) {
      copyElements([selectedElement]);
      deleteElement(selectedElement, setElements, setSelectedElement);
    }
    setContextMenu(null);
  };
  const handleCopy = () => {
    if (selectedElements && selectedElements.length > 0) {
      copyElements(selectedElements);
    } else if (selectedElement) {
      copyElements([selectedElement]);
    }
    setContextMenu(null);
  };

  const handlePaste = () => {
    const pastePosition = { x: currentMousePosition.x, y: currentMousePosition.y };
    pasteElements(setElements, setSelectedElements, setSelectedElement, pastePosition);
    setContextMenu(null);
  };

  const handleDelete = () => {
    if (selectedElements && selectedElements.length > 0) {
      deleteMultipleElements(selectedElements, setElements, setSelectedElement, setSelectedElements);
    } else if (selectedElement) {
      deleteElement(selectedElement, setElements, setSelectedElement);
    }
    setContextMenu(null);
  };

  const handleDuplicate = () => {
    if (selectedElements && selectedElements.length > 0) {
      duplicateMultipleElements(selectedElements, setElements, setSelectedElements, 20);
    } else if (selectedElement) {
      duplicateElement(selectedElement, setElements, setSelectedElement, 20);
    }
    setContextMenu(null);
  };
  const handleSendToBack = () => {
    if (selectedElement) {
      moveElementLayer(selectedElement.id, 0, setElements, elements);
    }
    setContextMenu(null);
  };

  const handleBringToFront = () => {
    if (selectedElement) {
      moveElementLayer(selectedElement.id, 2, setElements, elements);
    }
    setContextMenu(null);
  };

  const handleSendBackward = () => {
    if (selectedElement) {
      moveElementLayer(selectedElement.id, -1, setElements, elements);
    }
    setContextMenu(null);
  };

  const handleBringForward = () => {
    if (selectedElement) {
      moveElementLayer(selectedElement.id, 1, setElements, elements);
    }
    setContextMenu(null);
  };
  const handleGroup = () => {
    if (selectedElements && selectedElements.length > 1) {
      // TODO: Implement grouping functionality
    }
    setContextMenu(null);
  };

  const handleUngroup = () => {
    if (selectedElement && selectedElement.type === 'group') {
      // TODO: Implement ungrouping functionality
    }
    setContextMenu(null);
  };
  const handleLock = () => {
    if (selectedElements && selectedElements.length > 0) {
      const updatedElements = elements.map(el => {
        if (selectedElements.some(sel => sel.id === el.id)) {
          return { ...el, locked: true };
        }
        return el;
      });
      setElements(updatedElements);
      // Update selected elements state
      const lockedElements = selectedElements.map(sel => ({ ...sel, locked: true }));
      setSelectedElements(lockedElements);
    } else if (selectedElement) {
      const lockedElement = { ...selectedElement, locked: true };
      const updatedElements = elements.map(el => 
        el.id === selectedElement.id ? lockedElement : el
      );
      setElements(updatedElements);
      setSelectedElement(lockedElement);
    }
    setContextMenu(null);
  };

  const handleUnlock = () => {
    if (selectedElements && selectedElements.length > 0) {
      const updatedElements = elements.map(el => {
        if (selectedElements.some(sel => sel.id === el.id)) {
          return { ...el, locked: false };
        }
        return el;
      });
      setElements(updatedElements);
      // Update selected elements state
      const unlockedElements = selectedElements.map(sel => ({ ...sel, locked: false }));
      setSelectedElements(unlockedElements);
    } else if (selectedElement && selectedElement.locked) {
      const unlockedElement = { ...selectedElement, locked: false };
      const updatedElements = elements.map(el => 
        el.id === selectedElement.id ? unlockedElement : el
      );
      setElements(updatedElements);
      setSelectedElement(unlockedElement);
    }
    setContextMenu(null);
  };
  const handleCreateFrame = () => {
    const elementsToFrame = selectedElements && selectedElements.length > 0 
      ? selectedElements 
      : selectedElement 
      ? [selectedElement] 
      : [];
    
    if (elementsToFrame.length > 0) {
      // Calculate bounds of selected elements
      let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
      
      elementsToFrame.forEach(el => {
        minX = Math.min(minX, el.x1, el.x2);
        minY = Math.min(minY, el.y1, el.y2);
        maxX = Math.max(maxX, el.x1, el.x2);
        maxY = Math.max(maxY, el.y1, el.y2);
      });
      
      // Add padding around the frame
      const padding = 20;
      const frameElement = {
        id: crypto.randomUUID ? crypto.randomUUID() : `frame-${Date.now()}`,
        tool: 'rectangle',
        x1: minX - padding,
        y1: minY - padding,
        x2: maxX + padding,
        y2: maxY + padding,
        strokeWidth: 2,
        strokeColor: '#666666',
        strokeStyle: 'solid',
        fill: 'transparent',
        opacity: 100,
        isFrame: true
      };
      
      // Add the frame to elements
      setElements(prev => [...prev, frameElement]);
      setSelectedElement(frameElement);
      setSelectedElements([]);
    }
    setContextMenu(null);
  };
  const handleCopyToPNG = async () => {
    try {
      const canvas = document.getElementById('canvas');
      if (canvas) {
        // Convert canvas to blob
        canvas.toBlob(async (blob) => {
          if (blob && navigator.clipboard && window.ClipboardItem) {
            try {              await navigator.clipboard.write([
                new ClipboardItem({ 'image/png': blob })
              ]);
            } catch (err) {
              console.error('Failed to copy to clipboard:', err);
              // Fallback: show user they can manually copy
              alert('Canvas rendered. Right-click and "Copy Image" to save to clipboard.');
            }
          }
        }, 'image/png');
      }
    } catch (error) {
      console.error('Failed to copy as PNG:', error);
    }
    setContextMenu(null);
  };

  const handleCopyToSVG = async () => {
    try {
      // Create SVG representation
      const svgContent = generateSVGFromElements(selectedElements || (selectedElement ? [selectedElement] : elements));
        if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(svgContent);
      } else {
        // Fallback for older browsers
        const textArea = document.createElement('textarea');
        textArea.value = svgContent;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
      }
    } catch (error) {
      console.error('Failed to copy as SVG:', error);
    }
    setContextMenu(null);
  };

  // Helper function to generate SVG from elements
  const generateSVGFromElements = (elementsToExport) => {
    if (!elementsToExport || elementsToExport.length === 0) return '';
    
    // Calculate bounds
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    elementsToExport.forEach(el => {
      minX = Math.min(minX, el.x1, el.x2);
      minY = Math.min(minY, el.y1, el.y2);
      maxX = Math.max(maxX, el.x1, el.x2);
      maxY = Math.max(maxY, el.y1, el.y2);
    });
    
    const width = maxX - minX + 20; // Add padding
    const height = maxY - minY + 20;
    
    let svgContent = `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">`;
    
    elementsToExport.forEach(el => {
      const offsetX = -minX + 10; // Padding offset
      const offsetY = -minY + 10;
      
      switch (el.tool) {
        case 'rectangle':
          svgContent += `<rect x="${Math.min(el.x1, el.x2) + offsetX}" y="${Math.min(el.y1, el.y2) + offsetY}" width="${Math.abs(el.x2 - el.x1)}" height="${Math.abs(el.y2 - el.y1)}" stroke="${el.strokeColor}" stroke-width="${el.strokeWidth}" fill="${el.fill}" opacity="${(el.opacity || 100) / 100}" />`;
          break;
        case 'circle':
          const cx = (el.x1 + el.x2) / 2 + offsetX;
          const cy = (el.y1 + el.y2) / 2 + offsetY;
          const rx = Math.abs(el.x2 - el.x1) / 2;
          const ry = Math.abs(el.y2 - el.y1) / 2;
          svgContent += `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" stroke="${el.strokeColor}" stroke-width="${el.strokeWidth}" fill="${el.fill}" opacity="${(el.opacity || 100) / 100}" />`;
          break;
        case 'line':
          svgContent += `<line x1="${el.x1 + offsetX}" y1="${el.y1 + offsetY}" x2="${el.x2 + offsetX}" y2="${el.y2 + offsetY}" stroke="${el.strokeColor}" stroke-width="${el.strokeWidth}" opacity="${(el.opacity || 100) / 100}" />`;
          break;
        default:
          // Handle other shapes as needed
          break;
      }
    });
    
    svgContent += '</svg>';
    return svgContent;
  };

  const handleCopyStyles = () => {
    if (selectedElement) {
      setCopiedStyles({
        strokeWidth: selectedElement.strokeWidth,
        strokeColor: selectedElement.strokeColor,
        strokeStyle: selectedElement.strokeStyle,
        fill: selectedElement.fill,
        opacity: selectedElement.opacity
      });
    }
    setContextMenu(null);
  };

  const handlePasteStyles = () => {
    if (copiedStyles && selectedElements && selectedElements.length > 0) {
      const updatedElements = elements.map(el => {
        if (selectedElements.some(sel => sel.id === el.id)) {
          return { ...el, ...copiedStyles };
        }
        return el;
      });
      setElements(updatedElements);
    } else if (copiedStyles && selectedElement) {
      const updatedElements = elements.map(el => {
        if (el.id === selectedElement.id) {
          return { ...el, ...copiedStyles };
        }
        return el;
      });
      setElements(updatedElements);
    }
    setContextMenu(null);
  };
  const handleFlipHorizontal = () => {
    if (selectedElements && selectedElements.length > 0) {
      const updatedElements = elements.map(el => {
        if (selectedElements.some(sel => sel.id === el.id)) {
          const centerX = (el.x1 + el.x2) / 2;
          return {
            ...el,
            x1: centerX + (centerX - el.x1),
            x2: centerX + (centerX - el.x2)
          };
        }
        return el;
      });
      setElements(updatedElements);
      // Update selected elements to reflect changes
      const newSelectedElements = selectedElements.map(sel => {
        const centerX = (sel.x1 + sel.x2) / 2;
        return {
          ...sel,
          x1: centerX + (centerX - sel.x1),
          x2: centerX + (centerX - sel.x2)
        };
      });
      setSelectedElements(newSelectedElements);
    } else if (selectedElement) {
      const centerX = (selectedElement.x1 + selectedElement.x2) / 2;
      const flippedElement = {
        ...selectedElement,
        x1: centerX + (centerX - selectedElement.x1),
        x2: centerX + (centerX - selectedElement.x2)
      };
      const updatedElements = elements.map(el => 
        el.id === selectedElement.id ? flippedElement : el
      );
      setElements(updatedElements);
      setSelectedElement(flippedElement);
    }
    setContextMenu(null);
  };

  const handleFlipVertical = () => {
    if (selectedElements && selectedElements.length > 0) {
      const updatedElements = elements.map(el => {
        if (selectedElements.some(sel => sel.id === el.id)) {
          const centerY = (el.y1 + el.y2) / 2;
          return {
            ...el,
            y1: centerY + (centerY - el.y1),
            y2: centerY + (centerY - el.y2)
          };
        }
        return el;
      });
      setElements(updatedElements);
      // Update selected elements to reflect changes
      const newSelectedElements = selectedElements.map(sel => {
        const centerY = (sel.y1 + sel.y2) / 2;
        return {
          ...sel,
          y1: centerY + (centerY - sel.y1),
          y2: centerY + (centerY - sel.y2)
        };
      });
      setSelectedElements(newSelectedElements);
    } else if (selectedElement) {
      const centerY = (selectedElement.y1 + selectedElement.y2) / 2;
      const flippedElement = {
        ...selectedElement,
        y1: centerY + (centerY - selectedElement.y1),
        y2: centerY + (centerY - selectedElement.y2)
      };
      const updatedElements = elements.map(el => 
        el.id === selectedElement.id ? flippedElement : el
      );
      setElements(updatedElements);
      setSelectedElement(flippedElement);
    }
    setContextMenu(null);
  };
  const handleAddToLibrary = () => {
    if (selectedElements && selectedElements.length > 0) {
      // TODO: Implement add to library
    } else if (selectedElement) {
      // TODO: Implement add to library
    }
    setContextMenu(null);
  };

  const handleUndo = () => {
    undo();
    setContextMenu(null);
  };

  const handleRedo = () => {
    redo();
    setContextMenu(null);
  };

  const handleSelectAll = () => {
    setSelectedElements(elements);
    setSelectedElement(null);
    setContextMenu(null);
  };

  const handleZoomIn = () => {
    onZoom(0.1, window.innerWidth / 2, window.innerHeight / 2);
    setContextMenu(null);
  };

  const handleZoomOut = () => {
    onZoom(-0.1, window.innerWidth / 2, window.innerHeight / 2);
    setContextMenu(null);
  };

  const handleResetZoom = () => {
    zoomToFitContent();
    setContextMenu(null);
  };

  const handleToggleGrid = () => {
    setShowGrid(!showGrid);
    setContextMenu(null);
  };
  const handleExportAsImage = () => {
    const canvas = document.getElementById('canvas');
    if (canvas) {
      // Create a temporary link element for download
      const link = document.createElement('a');
      link.download = 'canvas-export.png';
      link.href = canvas.toDataURL('image/png');
      
      // Trigger download
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
    setContextMenu(null);
  };

  const handleClearCanvas = () => {
    if (window.confirm('Are you sure you want to clear the canvas? This action cannot be undone.')) {
      setElements([]);
      setSelectedElement(null);
      setSelectedElements([]);
    }
    setContextMenu(null);
  };  const getMenuItems = () => {
    const hasSelection = selectedElement || (selectedElements && selectedElements.length > 0);
    const hasMultipleSelection = selectedElements && selectedElements.length > 1;
    const hasClipboard = hasClipboardData();
    const isLocked = selectedElement?.locked || (selectedElements && selectedElements.some(el => el.locked));
    const hasUnlockedElements = selectedElement && !selectedElement.locked || 
                               (selectedElements && selectedElements.some(el => !el.locked));

    switch (type) {
      case 'canvas':
        return [
          {
            label: 'Paste',
            icon: Paste,
            action: handlePaste,
            shortcut: 'Ctrl+V',
            disabled: !hasClipboard
          },
          { type: 'separator' },
          {
            label: 'Undo',
            icon: Undo,
            action: handleUndo,
            shortcut: 'Ctrl+Z'
          },
          {
            label: 'Redo',
            icon: Redo,
            action: handleRedo,
            shortcut: 'Ctrl+Y'
          },
          { type: 'separator' },
          {
            label: 'Select all',
            icon: SelectAll,
            action: handleSelectAll,
            shortcut: 'Ctrl+A'
          },
          { type: 'separator' },
          {
            label: 'Zoom in',
            icon: ZoomIn,
            action: handleZoomIn
          },
          {
            label: 'Zoom out',
            icon: ZoomOut,
            action: handleZoomOut
          },
          {
            label: 'Reset zoom',
            icon: ZoomIn,
            action: handleResetZoom
          },
          { type: 'separator' },
          {
            label: 'Toggle grid',
            icon: Grid,
            action: handleToggleGrid
          },
          { type: 'separator' },
          {
            label: 'Export as image',
            icon: Export,
            action: handleExportAsImage
          },
          {
            label: 'Clear canvas',
            icon: ClearCanvas,
            action: handleClearCanvas
          }
        ];

      case 'single':
        return [
          {
            label: 'Cut',
            icon: Cut,
            action: handleCut,
            shortcut: 'Ctrl+X'
          },
          {
            label: 'Copy',
            icon: Copy,
            action: handleCopy,
            shortcut: 'Ctrl+C'
          },
          {
            label: 'Paste',
            icon: Paste,
            action: handlePaste,
            shortcut: 'Ctrl+V',
            disabled: !hasClipboard
          },
          { type: 'separator' },
          {
            label: 'Wrap selection in frame',
            icon: Frame,
            action: handleCreateFrame
          },
          { type: 'separator' },
          {
            label: 'Copy to clipboard as PNG',
            icon: Export,
            action: handleCopyToPNG,
            shortcut: 'Shift+Alt+C'
          },
          {
            label: 'Copy to clipboard as SVG',
            icon: Export,
            action: handleCopyToSVG
          },
          { type: 'separator' },
          {
            label: 'Copy styles',
            icon: CopyStyles,
            action: handleCopyStyles,
            shortcut: 'Ctrl+Alt+C'
          },
          {
            label: 'Paste styles',
            icon: CopyStyles,
            action: handlePasteStyles,
            shortcut: 'Ctrl+Alt+V',
            disabled: !copiedStyles
          },
          { type: 'separator' },
          {
            label: 'Group selection',
            icon: Group,
            action: handleGroup,
            shortcut: 'Ctrl+G',
            disabled: !hasMultipleSelection
          },
          {
            label: 'Add to library',
            icon: Library,
            action: handleAddToLibrary
          },
          { type: 'separator' },
          {
            label: 'Send backward',
            icon: SendBackward,
            action: handleSendBackward,
            shortcut: 'Ctrl+['
          },
          {
            label: 'Bring forward',
            icon: BringForward,
            action: handleBringForward,
            shortcut: 'Ctrl+]'
          },
          {
            label: 'Send to back',
            icon: SendToBack,
            action: handleSendToBack,
            shortcut: 'Ctrl+Shift+['
          },
          {
            label: 'Bring to front',
            icon: BringToFront,
            action: handleBringToFront,
            shortcut: 'Ctrl+Shift+]'
          },
          { type: 'separator' },
          {
            label: 'Flip horizontal',
            icon: FlipHorizontal,
            action: handleFlipHorizontal,
            shortcut: 'Shift+H'
          },
          {
            label: 'Flip vertical',
            icon: FlipVertical,
            action: handleFlipVertical,
            shortcut: 'Shift+V'
          },
          { type: 'separator' },
          {
            label: 'Duplicate',
            icon: Duplicate,
            action: handleDuplicate,
            shortcut: 'Ctrl+D'          },
          {
            label: isLocked ? 'Unlock' : 'Lock',
            icon: isLocked ? Unlock : Lock,
            action: isLocked ? handleUnlock : handleLock,
            shortcut: 'Ctrl+Shift+L'
          },
          {
            label: 'Delete',
            icon: Delete,
            action: handleDelete,
            shortcut: 'Delete'
          }
        ];

      case 'multi':
        return [
          {
            label: 'Cut',
            icon: Cut,
            action: handleCut,
            shortcut: 'Ctrl+X'
          },
          {
            label: 'Copy',
            icon: Copy,
            action: handleCopy,
            shortcut: 'Ctrl+C'
          },
          {
            label: 'Paste',
            icon: Paste,
            action: handlePaste,
            shortcut: 'Ctrl+V',
            disabled: !hasClipboard
          },
          { type: 'separator' },
          {
            label: 'Wrap selection in frame',
            icon: Frame,
            action: handleCreateFrame
          },
          { type: 'separator' },
          {
            label: 'Copy to clipboard as PNG',
            icon: Export,
            action: handleCopyToPNG,
            shortcut: 'Shift+Alt+C'
          },
          {
            label: 'Copy to clipboard as SVG',
            icon: Export,
            action: handleCopyToSVG
          },
          { type: 'separator' },
          {
            label: 'Copy styles',
            icon: CopyStyles,
            action: handleCopyStyles,
            shortcut: 'Ctrl+Alt+C'
          },
          {
            label: 'Paste styles',
            icon: CopyStyles,
            action: handlePasteStyles,
            shortcut: 'Ctrl+Alt+V',
            disabled: !copiedStyles
          },
          { type: 'separator' },
          {
            label: 'Group selection',
            icon: Group,
            action: handleGroup,
            shortcut: 'Ctrl+G'
          },
          {
            label: 'Add to library',
            icon: Library,
            action: handleAddToLibrary
          },
          { type: 'separator' },
          {
            label: 'Duplicate',
            icon: Duplicate,
            action: handleDuplicate,
            shortcut: 'Ctrl+D'          },
          {
            label: hasUnlockedElements ? 'Lock' : 'Unlock',
            icon: hasUnlockedElements ? Lock : Unlock,
            action: hasUnlockedElements ? handleLock : handleUnlock,
            shortcut: 'Ctrl+Shift+L'
          },
          {
            label: 'Delete',
            icon: Delete,
            action: handleDelete,
            shortcut: 'Delete'
          }
        ];

      default:
        return [];
    }
  };

  const menuItems = getMenuItems();

  return (
    <div
      ref={menuRef}
      className="context-menu"
      style={{
        position: 'fixed',
        left: `${adjustedX}px`,
        top: `${adjustedY}px`,
        zIndex: 10000
      }}
    >
      {menuItems.map((item, index) => {
        if (item.type === 'separator') {
          return <div key={index} className="context-menu-separator" />;
        }

        return (
          <button
            key={index}
            className={`context-menu-item ${item.disabled ? 'disabled' : ''} ${item.focused ? 'focused' : ''}`}
            onClick={item.action}
            disabled={item.disabled}
            onMouseEnter={() => {
              menuItems.forEach(mi => mi.focused = false);
              item.focused = true;
            }}
          >
            <div className="context-menu-item-content">
              <item.icon />
              <span className="context-menu-label">{item.label}</span>
              {item.shortcut && (
                <span className="context-menu-shortcut">{item.shortcut}</span>
              )}
            </div>
          </button>
        );
      })}
    </div>
  );
}
