import { useEffect } from "react";
import Canvas from "../components/Canvas";
import Grid from "../components/Grid";
// import SelectionRectangle from "../components/SelectionRectangle"; // Assuming this is used
import Ui from "../components/Ui";
// import TextInput from "../components/TextInput"; // Assuming this is used
import ContextMenu from "../components/ContextMenu";
import { useSearchParams } from "react-router-dom";
import { useAppContext } from "../provider/AppStates";
import { socket } from "../api/socket"; // socket is imported but not directly used here for emit

export default function WorkSpace() {
  const { setSession /*, textInputMode, setTextInputMode, style*/ } =
    useAppContext();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const room = searchParams.get("room");
    console.log("[WorkSpace] useEffect - Room from URL:", room);

    if (room) {
      // Setting the session here will trigger the useEffect in useCanvas.jsx
      // which depends on `session` and will handle emitting the "join" event.
      setSession(room);
      console.log("[WorkSpace] Session set from URL param:", room);
    } else {
      // If there's no room in URL, ensure any existing session is cleared
      // This might be handled elsewhere, e.g., when explicitly ending a session
      // setSession(null);
    }
  }, [searchParams, setSession]);

  return (
    <>
      <Grid />
      <Ui />
      <Canvas />
      {/* <SelectionRectangle /> */}
      <ContextMenu />
    </>
  );
}
