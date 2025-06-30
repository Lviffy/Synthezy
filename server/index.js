const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
require('dotenv').config();

// Import database and models
const { connectDB, checkDBConnection } = require('./config/database');
const Drawing = require('./models/Drawing');

// Import routes
const authRoutes = require('./routes/auth');
const drawingRoutes = require('./routes/drawings');

const app = express();
const PORT = process.env.PORT || 8080;

// Enable CORS for all routes
app.use(
  cors({
    origin: "*", // Allow all origins for testing
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    credentials: false,
  })
);

// Parse JSON bodies
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/drawings', drawingRoutes);

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
  socket.on("join", async (room) => {
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
      // Try to load from database
      try {
        const drawing = await Drawing.findOne({ sessionId: room });
        if (drawing && drawing.data) {
          console.log(`[Server] Loading drawing from database for session ${room}`);
          roomStates.set(room, drawing.data);
          socket.emit("setElements", drawing.data);
        } else {
          console.log(`[Server] Initializing empty state for new room ${room}`);
          roomStates.set(room, []);
        }
      } catch (error) {
        console.error(`[Server] Error loading drawing from database:`, error);
        console.log(`[Server] Initializing empty state for new room ${room}`);
        roomStates.set(room, []);
      }
    }
  });

  // Handle element updates with database persistence
  socket.on("getElements", async ({ elements, room }) => {
    if (!room || !elements) return;

    console.log(
      `[Server] Received ${elements.length} elements for room ${room}`
    );
    roomStates.set(room, elements);

    // Persist to database if we have a valid session
    try {
      // Note: For now, we'll save without authentication in socket
      // In production, you might want to implement socket authentication
      const existingDrawing = await Drawing.findOne({ sessionId: room });
      
      if (existingDrawing) {
        existingDrawing.data = elements;
        existingDrawing.updatedAt = new Date();
        await existingDrawing.save();
        console.log(`[Server] Drawing updated in database for session ${room}`);
      } else {
        // For new sessions without authentication, we'll create a placeholder
        // This will be properly handled when users join through the authenticated flow
        console.log(`[Server] Session ${room} not found in database, keeping in memory only`);
      }
    } catch (error) {
      console.error(`[Server] Error saving drawing to database:`, error);
      // Continue with in-memory storage as fallback
    }

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
  const dbStatus = checkDBConnection();
  res.send(`
    <h1>Socket.IO Server</h1>
    <p>Server is running.</p>
    <p>Database Status: <strong style="color: ${dbStatus.isConnected ? 'green' : 'red'}">${dbStatus.state}</strong></p>
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

// Health check endpoint
app.get('/api/health', (req, res) => {
  const dbStatus = checkDBConnection();
  res.json({
    success: true,
    status: 'Server is running',
    database: dbStatus,
    timestamp: new Date().toISOString()
  });
});

// Connect to MongoDB and start the server
const startServer = async () => {
  try {
    // Connect to MongoDB
    await connectDB();
    console.log('✅ Database connected successfully');

    // Start the server
    server.listen(PORT, () => {
      console.log(`🚀 Server running on http://localhost:${PORT}`);
      console.log(`📊 API endpoints available at http://localhost:${PORT}/api`);
      console.log(`🔌 Socket.IO ready for connections`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

// Start the server
startServer();
