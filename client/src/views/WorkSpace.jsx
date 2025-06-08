import { useEffect } from "react";
import Canvas from "../components/Canvas";
import Grid from "../components/Grid";
import SelectionRectangle from "../components/SelectionRectangle";
import Ui from "../components/Ui";
import TextInput from "../components/TextInput";
import { useSearchParams } from "react-router-dom";
import { useAppContext } from "../provider/AppStates";
import { socket } from "../api/socket";

export default function WorkSpace() {
  const { setSession, textInputMode, setTextInputMode, style } = useAppContext();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const room = searchParams.get("room");

    if (room) {
      setSession(room);
      socket.emit("join", room);
    }
  }, [searchParams]);

  return (
    <>
      <Grid />
      <Ui />
      <Canvas />
      <SelectionRectangle />
    </>
  );
}