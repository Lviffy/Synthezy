require("dotenv").config();

const express = require("express");
const app = express();
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
const parser = require("socket.io-msgpack-parser");

const CLIENT_URL = process.env.CLIENT_URL || "http://localhost:5173";
const PORT = process.env.PORT || 8080;

console.log(`🔧 Environment loaded - CLIENT_URL: ${CLIENT_URL}, PORT: ${PORT}`);

app.use(
  cors({
    origin: [CLIENT_URL, "http://localhost:5173", "http://127.0.0.1:5173"],
    credentials: true
  })
);

const server = http.createServer(app);

const io = new Server(server, {
  parser,
  cors: {
    origin: [CLIENT_URL, "http://localhost:5173", "http://127.0.0.1:5173"],
    credentials: true
  },
});

// Store room states in memory (in production, use Redis or a database)
const roomStates = new Map();

io.on("connection", (socket) => {
  console.log("🔌 User connected:", socket.id);

  socket.on("join", (room) => {
    socket.join(room);
    console.log(`👥 User ${socket.id} joined room ${room}`);
    
    // If there's existing state for this room, send it to the new user
    if (roomStates.has(room)) {
      const existingState = roomStates.get(room);
      console.log(`📤 Sending existing state (${existingState?.length || 0} elements) to new user`);
      socket.emit("setElements", existingState);
    } else {
      console.log("🆕 No existing state for room");
    }
  });

  socket.on("leave", (room) => {
    socket.leave(room);
    console.log(`👋 User ${socket.id} left room ${room}`);
  });

  socket.on("getElements", ({ elements, room }) => {
    console.log(`📤 Broadcasting ${elements?.length || 0} elements to room ${room}`);
    
    // Store the latest state for this room
    roomStates.set(room, elements);
    
    // Broadcast to all other users in the room
    socket.to(room).emit("setElements", elements);
  });

  socket.on("disconnect", () => {
    console.log("🔌 User disconnected:", socket.id);
  });
});

app.get("/", (req, res) => {
  res.send(
    `<marquee>To try the app visite : <a href="${CLIENT_URL}">${CLIENT_URL}</a></marquee>`
  );
});

server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`🔗 Client URL: ${CLIENT_URL}`);
  console.log(`📡 Socket.IO server ready for connections`);
});
