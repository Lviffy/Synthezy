require("dotenv").config();

const express = require("express");
const app = express();
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
const parser = require("socket.io-msgpack-parser");

const CLIENT_URL = process.env.CLIENT_URL || "http://localhost:5173";
const PORT = process.env.PORT || 8080;

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
  socket.on("join", (room) => {
    socket.join(room);
    
    // If there's existing state for this room, send it to the new user
    if (roomStates.has(room)) {
      const existingState = roomStates.get(room);
      socket.emit("setElements", existingState);
    }
  });
  socket.on("leave", (room) => {
    socket.leave(room);
  });

  socket.on("getElements", ({ elements, room }) => {
    // Store the latest state for this room
    roomStates.set(room, elements);
    
    // Broadcast to all other users in the room
    socket.to(room).emit("setElements", elements);
  });

  socket.on("disconnect", () => {
    // User disconnected
  });
});

app.get("/", (req, res) => {
  res.send(
    `<marquee>To try the app visite : <a href="${CLIENT_URL}">${CLIENT_URL}</a></marquee>`
  );
});

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
