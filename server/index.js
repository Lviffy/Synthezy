const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");

const app = express();
const PORT = 8080;

// Enable CORS for all routes
app.use(
  cors({
    origin: "*", // Allow all origins for testing
    methods: ["GET", "POST", "OPTIONS"],
    credentials: false,
  })
);

const server = http.createServer(app);

// Create Socket.IO server with minimal configuration
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST", "OPTIONS"],
    credentials: false,
  },
  transports: ["polling", "websocket"], // Support both
});

// Simple data storage
const roomStates = new Map();
const clientRooms = new Map();
const roomUsers = new Map();

// Socket.IO connection handler
io.on("connection", (socket) => {
  console.log(`[Server] Client connected: ${socket.id}`);

  // Send a welcome message to confirm connection
  socket.emit("welcome", { message: "Connected to server" });

  // Basic room join handler
  socket.on("join", (room) => {
    if (!room) {
      console.log(
        `[Server] Client ${socket.id} tried to join null/undefined room.`
      );
      return;
    }

    // Check if socket is already in this room
    if (socket.rooms.has(room)) {
      console.log(
        `[Server] Client ${socket.id} is already in room: ${room}. Ignoring redundant join.`
      );
      // Optionally, still send current state or user count if needed for robustness
      // if (roomStates.has(room)) {
      //   socket.emit("setElements", roomStates.get(room));
      // }
      // if (roomUsers.has(room)) {
      //   io.to(room).emit("roomUsers", roomUsers.get(room).size);
      // }
      return;
    }

    console.log(`[Server] Client ${socket.id} joining room: ${room}`);
    socket.join(room);
    clientRooms.set(socket.id, room);

    if (!roomUsers.has(room)) {
      roomUsers.set(room, new Set());
    }
    roomUsers.get(room).add(socket.id);
    const userCount = roomUsers.get(room).size;
    console.log(`[Server] Room ${room} now has ${userCount} users`);
    io.to(room).emit("roomUsers", userCount);

    if (roomStates.has(room)) {
      const existingState = roomStates.get(room);
      console.log(
        `[Server] Sending existing state (${existingState.length} elements) to client ${socket.id} in room ${room}`
      );
      socket.emit("setElements", existingState);
    } else {
      console.log(`[Server] Initializing empty state for new room ${room}`);
      roomStates.set(room, []);
      // Optionally send empty elements if that's the desired behavior for a new client in an empty room state
      // socket.emit("setElements", []);
    }
  });

  // Handle element updates
  socket.on("getElements", ({ elements, room }) => {
    if (!room || !elements) return;

    console.log(
      `[Server] Received ${elements.length} elements for room ${room}`
    );
    roomStates.set(room, elements);

    // Broadcast to other clients in the room
    socket.to(room).emit("setElements", elements);
  });

  // Handle disconnection
  socket.on("disconnect", () => {
    console.log(`[Server] Client disconnected: ${socket.id}`);

    // Clean up room membership if needed
    const room = clientRooms.get(socket.id);
    if (room && roomUsers.has(room)) {
      roomUsers.get(room).delete(socket.id);
      const userCount = roomUsers.get(room).size;
      io.to(room).emit("roomUsers", userCount);
    }

    clientRooms.delete(socket.id);
  });

  // Add ping handler for connection testing
  socket.on("ping", () => {
    socket.emit("pong");
  });
});

// Add a simple test page
app.get("/", (req, res) => {
  res.send(`
    <h1>Socket.IO Server</h1>
    <p>Server is running.</p>
    <button id="testBtn">Test Connection</button>
    <div id="status">Disconnected</div>
    
    <script src="https://cdn.socket.io/4.5.4/socket.io.min.js"></script>
    <script>
      const socket = io();
      const status = document.getElementById('status');
      
      socket.on('connect', () => {
        status.textContent = 'Connected: ' + socket.id;
        status.style.color = 'green';
      });
      
      socket.on('disconnect', () => {
        status.textContent = 'Disconnected';
        status.style.color = 'red';
      });
      
      document.getElementById('testBtn').addEventListener('click', () => {
        socket.emit('ping');
      });
      
      socket.on('pong', () => {
        alert('Received pong from server!');
      });
    </script>
  `);
});

// Start the server
server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
