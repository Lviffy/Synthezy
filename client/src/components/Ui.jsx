import { useAppContext } from "../hooks/useAppContext.js";
import Style from "./Style";
import ToolBar from "./ToolBar";
import Zoom from "./Zoom";
import UndoRedo from "./UndoRedo";
import Menu from "./Menu";
import Collaboration from "./Collaboration";
import Credits from "./Credits";
import ColorPickerOverlay from "./ColorPickerOverlay";
import AIToolPanel from "./AIToolPanel";

export default function Ui() {
  const { selectedElement, selectedElements, selectedTool, style, showAIPanel } = useAppContext();

  return (
    <main className="ui">
      <header>
        <Menu />
        <ToolBar />
        <Collaboration />
      </header>
      
      {(!["selection", "hand"].includes(selectedTool) || selectedElement || (selectedElements && Array.isArray(selectedElements) && selectedElements.length > 0)) && (
        <Style selectedElement={selectedElement || style} selectedElements={selectedElements} />
      )}      {/* AI Tool Panel */}
      {showAIPanel && <AIToolPanel />}
      
      <footer>
        <div className="footer-left">
          <Zoom />
          <UndoRedo />
        </div>
        <Credits />
      </footer>
      
      {/* Color Picker Overlay - renders as a separate floating component */}
      {(selectedElement || (selectedElements && Array.isArray(selectedElements) && selectedElements.length > 0)) && (
        <ColorPickerOverlay 
          selectedElement={selectedElement || style} 
          selectedElements={selectedElements} 
        />
      )}
    </main>
  );
}
