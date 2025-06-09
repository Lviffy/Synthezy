import { motion } from "framer-motion";
import { Xmark } from "../assets/icons";
import { useState } from "react";
import { useAppContext } from "../provider/AppStates";
import { v4 as uuid } from "uuid";
import { useSearchParams } from "react-router-dom";
import { socket } from "../api/socket";

export default function Collaboration() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { session, setSession } = useAppContext();
  const [open, setOpen] = useState(false);
  const users = 0;

  const startSession = () => {
    const sessionId = uuid();
    console.log("🚀 Starting new collaboration session:", sessionId);
    setSearchParams({ room: sessionId });
    setSession(sessionId);
    socket.emit("join", sessionId);
  };

  const endSession = () => {
    searchParams.delete("room");
    socket.emit("leave", session);
    setSession(null);
    setOpen(false);
    window.history.replaceState(null, null, "/");
  };

  const handleShareClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    console.log("Share button clicked");
    setOpen(true);
  };

  return (
    <div className="collaboration">
      <button
        data-users={users > 99 ? "99+" : users}
        type="button"
        className={"collaborateButton" + `${session ? " active" : ""}`}
        onClick={handleShareClick}
        aria-label={session ? "Manage collaboration session" : "Start collaboration"}
        title={session ? "Active collaboration session" : "Share and collaborate"}
      >
        Share
      </button>

      {open && (
        <CollabBox collabState={[open, setOpen]}>
          {session ? (
            <SessionInfo endSession={endSession} />
          ) : (
            <CreateSession startSession={startSession} />
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

function SessionInfo({ endSession }) {
  const [copyStatus, setCopyStatus] = useState('Copy link');
  const [copyState, setCopyState] = useState('default'); // 'default', 'success', 'error'

  const copy = async () => {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(window.location.href);
        setCopyStatus('Copied!');
        setCopyState('success');
        setTimeout(() => {
          setCopyStatus('Copy link');
          setCopyState('default');
        }, 2000);
      } else {
        // Fallback for older browsers
        const textArea = document.createElement('textarea');
        textArea.value = window.location.href;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        textArea.style.top = '-999999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        const successful = document.execCommand('copy');
        document.body.removeChild(textArea);
        
        if (successful) {
          setCopyStatus('Copied!');
          setCopyState('success');
        } else {
          throw new Error('Copy command failed');
        }
        
        setTimeout(() => {
          setCopyStatus('Copy link');
          setCopyState('default');
        }, 2000);
      }
    } catch (error) {
      console.error('Failed to copy link:', error);
      setCopyStatus('Failed to copy');
      setCopyState('error');
      setTimeout(() => {
        setCopyStatus('Copy link');
        setCopyState('default');
      }, 2000);
    }
  };

  return (
    <div className="collabInfo">
      <h2>Live collaboration</h2>

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
            disabled={copyState !== 'default'}
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
