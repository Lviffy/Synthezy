import { io } from "socket.io-client";

// Get server URL from environment variable or use default
const SOCKET_URL = "http://localhost:8080"; // Hardcode for now to eliminate variables
console.log("Connecting to Socket.IO server at:", SOCKET_URL);

// Create socket with minimal configuration
export const socket = io(SOCKET_URL, {
  transports: ['polling', 'websocket'], // Try polling first, then websocket
  autoConnect: true,
  reconnection: true,
  reconnectionAttempts: 5,
  timeout: 20000
});

socket.on("connect", () => {
  console.log("✅ Socket connected successfully! ID:", socket.id);
});

socket.on("disconnect", (reason) => {
  console.log("❌ Socket disconnected. Reason:", reason);
});

socket.on("connect_error", (error) => {
  console.error("🔴 Socket connection error:", error.message);
  console.log("Make sure the server is running at", SOCKET_URL);
});

// Export connection check function
export const checkConnection = () => {
  console.log("Socket connected status:", socket.connected);
  return socket.connected;
};

// Export reconnect function
export const forceReconnect = () => {
  if (!socket.connected) {
    console.log("Forcing reconnection...");
    socket.connect();
  }
};