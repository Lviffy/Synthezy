import { useEffect } from "react";
import Canvas from "../components/Canvas";
import Grid from "../components/Grid";
import SelectionRectangle from "../components/SelectionRectangle";
import Ui from "../components/Ui";
import TextInput from "../components/TextInput";
import ContextMenu from "../components/ContextMenu";
import { useSearchParams } from "react-router-dom";
import { useAppContext } from "../provider/AppStates";
import { socket } from "../api/socket";

export default function WorkSpace() {
  const { setSession, textInputMode, setTextInputMode, style } = useAppContext();
  const [searchParams] = useSearchParams();
  useEffect(() => {
    const room = searchParams.get("room");

    if (room) {
      console.log("🔗 Joining collaboration room from URL:", room);
      setSession(room);
      
      // Add a small delay to ensure socket is connected
      setTimeout(() => {
        console.log("📡 Emitting join event for room:", room);
        socket.emit("join", room);
      }, 100);
    } else {
      console.log("No room parameter found in URL");
    }
  }, [searchParams, setSession]);
  return (
    <>
      <Grid />
      <Ui />
      <Canvas />
      <SelectionRectangle />
      <ContextMenu />
    </>
  );
}