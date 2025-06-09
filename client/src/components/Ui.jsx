import { useAppContext } from "../provider/AppStates";
import Style from "./Style";
import ToolBar from "./ToolBar";
import Zoom from "./Zoom";
import UndoRedo from "./UndoRedo";
import Menu from "./Menu";
import Collaboration from "./Collaboration";
import Credits from "./Credits";

export default function Ui() {
  const { selectedElement, selectedElements, selectedTool, style } = useAppContext();

  return (
    <main className="ui">
      <header>
        <Menu />
        <ToolBar />
        <Collaboration />
      </header>
      {(!["selection", "hand"].includes(selectedTool) || selectedElement || (selectedElements && Array.isArray(selectedElements) && selectedElements.length > 0)) && (
        <Style selectedElement={selectedElement || style} selectedElements={selectedElements} />      )}      <footer>
        <div className="footer-left">
          <Zoom />
          <UndoRedo />
        </div>
        <Credits />
      </footer>
    </main>
  );
}
