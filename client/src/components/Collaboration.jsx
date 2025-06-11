import { motion } from "framer-motion";
import { Xmark } from "../assets/icons"; // Import your icons
import { useState, useEffect } from "react";
import { useAppContext } from "../provider/AppStates";
import { v4 as uuid } from "uuid";
import { useSearchParams } from "react-router-dom";
import { socket } from "../api/socket";

export default function Collaboration() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { session, setSession } = useAppContext();
  const [open, setOpen] = useState(false);
  const [users, setUsers] = useState(0);
  // Initialize connectionStatus based on the current socket state
  const [connectionStatus, setConnectionStatus] = useState(
    socket.connected ? "connected" : "disconnected"
  );

  // Listen to socket events to update connection status
  useEffect(() => {
    const handleConnect = () => {
      console.log("[Collaboration] Socket connected event");
      setConnectionStatus("connected");
    };

    const handleDisconnect = (reason) => {
      console.log("[Collaboration] Socket disconnected event, reason:", reason);
      setConnectionStatus("disconnected");
    };

    const handleConnectError = (error) => {
      console.log("[Collaboration] Socket connect_error event:", error.message);
      setConnectionStatus("disconnected"); // Or a specific "error" state
    };

    // Set initial status correctly
    if (socket.connected) {
      handleConnect();
    } else {
      // If not connected, ensure we attempt a connection if autoConnect was false or failed initially
      // However, socket.js has autoConnect: true, so Socket.IO should be handling this.
      // We log to see if it's trying.
      console.log(
        "[Collaboration] Initial socket state: disconnected. Socket.IO should be attempting to reconnect if configured."
      );
    }

    socket.on("connect", handleConnect);
    socket.on("disconnect", handleDisconnect);
    socket.on("connect_error", handleConnectError);

    return () => {
      socket.off("connect", handleConnect);
      socket.off("disconnect", handleDisconnect);
      socket.off("connect_error", handleConnectError);
    };
  }, []); // Empty dependency array, runs once on mount

  // Handle user count updates
  useEffect(() => {
    if (!socket) return;

    const handleRoomUsers = (count) => {
      console.log("Received roomUsers update:", count);
      setUsers(count > 0 ? count - 1 : 0); // Don't count ourselves
    };

    socket.on("roomUsers", handleRoomUsers);

    return () => {
      socket.off("roomUsers", handleRoomUsers);
    };
  }, []);

  // Check for room in URL when component mounts (this useEffect seems mostly fine)
  useEffect(() => {
    const room = searchParams.get("room");
    if (room && !session) {
      console.log("[Collaboration] Found room in URL, setting session:", room);
      setSession(room);

      // Ensure socket connection before joining
      if (socket.connected) {
        console.log("[Collaboration] Socket connected, joining room:", room);
        socket.emit("join", room);
      } else {
        // If not connected, wait for the 'connect' event to trigger joining.
        // The useCanvas.jsx hook also has logic to join room on connect if session exists.
        console.log(
          "[Collaboration] Socket not connected yet. 'join' will be emitted on successful connection if session is set."
        );
        // Optionally, add a one-time listener for connect here if immediate join is critical
        // and not covered by useCanvas.jsx
        const attemptJoinOnConnect = () => {
          if (socket.connected && session === room) {
            // Check if session is still the one we want to join
            console.log(
              "[Collaboration] Socket connected (detected in room join effect), joining room:",
              room
            );
            socket.emit("join", room);
          }
          socket.off("connect", attemptJoinOnConnect); // Clean up listener
        };
        socket.on("connect", attemptJoinOnConnect);
      }
    }
  }, [searchParams, session, setSession]); // Keep dependencies

  const startSession = () => {
    if (!socket.connected) {
      // Check current socket state
      alert(
        "Cannot start session: not connected to server. Please wait or check connection."
      );
      return;
    }
    createAndJoinSession();
  };

  const createAndJoinSession = () => {
    const sessionId = uuid();
    console.log("Creating new session:", sessionId);
    setSearchParams({ room: sessionId });
    setSession(sessionId);
    socket.emit("join", sessionId);
  };

  const endSession = () => {
    console.log("Ending session:", session);
    if (session) {
      socket.emit("leave", session);
    }
    searchParams.delete("room");
    setSearchParams(searchParams);
    setSession(null);
    setOpen(false);
    window.history.replaceState(null, null, "/");
  };

  const handleShareClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setOpen(true);
  };

  return (
    <div className="collaboration">
      <button
        data-users={users > 99 ? "99+" : users}
        data-status={connectionStatus} // Add connection status as data attribute for styling
        type="button"
        className={"collaborateButton" + `${session ? " active" : ""}`}
        onClick={handleShareClick}
        aria-label={
          session ? "Manage collaboration session" : "Start collaboration"
        }
        title={
          session
            ? `Active collaboration session (${users} other users)${
                connectionStatus !== "connected" ? " - Connection issues" : ""
              }`
            : "Share and collaborate"
        }
      >
        Share {connectionStatus !== "connected" && "(!)"}
      </button>

      {open && (
        <CollabBox collabState={[open, setOpen]}>
          {connectionStatus !== "connected" && (
            // Replace your simple forceReconnect button with this enhanced version
            <div className="connectionWarning">
              Not connected to server. Collaboration may not work.
              <button
                onClick={() => {
                  console.log("Manual reconnect clicked");
                  // First disconnect to clear any problematic connection state
                  socket.disconnect();

                  // Then reconnect after a short delay
                  setTimeout(() => {
                    console.log("Attempting to reconnect now...");
                    socket.connect();

                    // Check if connection was successful after a delay
                    setTimeout(() => {
                      const connected = socket.connected;
                      console.log(
                        "Reconnection attempt result:",
                        connected ? "SUCCESS" : "FAILED"
                      );
                      setConnectionStatus(
                        connected ? "connected" : "disconnected"
                      );

                      // If still not connected, show error details
                      if (!connected) {
                        console.error(
                          "Connection failed again. Check server status and network."
                        );
                      }
                    }, 1000);
                  }, 500);
                }}
              >
                Reconnect
              </button>
            </div>
          )}
          {session ? (
            <SessionInfo endSession={endSession} users={users} />
          ) : (
            <CreateSession
              startSession={startSession}
              connectionStatus={connectionStatus}
            />
          )}
        </CollabBox>
      )}
    </div>
  );
}

function CreateSession({ startSession }) {
  return (
    <div className="collabCreate">
      <h2>Live collaboration</h2>
      <div>
        <p>Invite people to collaborate on your drawing.</p>
        <p>
          Don't worry, the session is end-to-end encrypted, and fully private.
          Not even our server can see what you draw.
        </p>
      </div>
      <button onClick={startSession}>Start session</button>
    </div>
  );
}

function SessionInfo({ endSession, users }) {
  const [copyStatus, setCopyStatus] = useState("Copy link");
  const [copyState, setCopyState] = useState("default"); // 'default', 'success', 'error'

  const copy = async () => {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(window.location.href);
        setCopyStatus("Copied!");
        setCopyState("success");
        setTimeout(() => {
          setCopyStatus("Copy link");
          setCopyState("default");
        }, 2000);
      } else {
        // Fallback for older browsers
        const textArea = document.createElement("textarea");
        textArea.value = window.location.href;
        textArea.style.position = "fixed";
        textArea.style.left = "-999999px";
        textArea.style.top = "-999999px";
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        const successful = document.execCommand("copy");
        document.body.removeChild(textArea);

        if (successful) {
          setCopyStatus("Copied!");
          setCopyState("success");
        } else {
          throw new Error("Copy command failed");
        }

        setTimeout(() => {
          setCopyStatus("Copy link");
          setCopyState("default");
        }, 2000);
      }
    } catch (error) {
      console.error("Failed to copy link:", error);
      setCopyStatus("Failed to copy");
      setCopyState("error");
      setTimeout(() => {
        setCopyStatus("Copy link");
        setCopyState("default");
      }, 2000);
    }
  };

  return (
    <div className="collabInfo">
      <h2>Live collaboration</h2>

      {/* Add active users indicator */}
      <div className="activeUsers">
        <span>
          {users} {users === 1 ? "person" : "people"} collaborating with you
        </span>
      </div>

      <div className="collabGroup">
        <label htmlFor="collabUrl">Link</label>
        <div className="collabLink">
          <input
            id="collabUrl"
            type="url"
            value={window.location.href}
            disabled
          />
          <button
            type="button"
            onClick={copy}
            className={`copy-button copy-button--${copyState}`}
            disabled={copyState !== "default"}
          >
            {copyStatus}
          </button>
        </div>
      </div>
      <div className="endCollab">
        <button type="button" onClick={endSession}>
          Stop session
        </button>
      </div>
    </div>
  );
}

function CollabBox({ collabState, children }) {
  const [Open, setOpen] = collabState;
  const exit = () => setOpen(false);

  return (
    <div className="collaborationContainer">
      <motion.div
        className="collaborationBoxBack"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.2 }}
        onClick={exit}
      ></motion.div>
      <motion.section
        initial={{ scale: 0.7 }}
        animate={{ scale: 1 }}
        transition={{ duration: 0.15 }}
        className="collaborationBox"
      >
        <button onClick={exit} type="button" className="closeCollbBox">
          <Xmark />
        </button>

        {children}
      </motion.section>
    </div>
  );
}
