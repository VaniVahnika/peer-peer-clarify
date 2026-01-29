require('dotenv').config();
const http = require('http');
const { Server } = require('socket.io');
const app = require('./app');
const connectDB = require('./db');

const PORT = process.env.PORT || 5000;
const CLIENT_URL = process.env.CLIENT_URL || "https://project-h-frontend.onrender.com";

// Create HTTP server
const server = http.createServer(app);

// Initialize Socket.io
const io = new Server(server, {
  cors: {
    origin: [CLIENT_URL, "http://localhost:5173", "https://project-h-frontend.onrender.com"],
    methods: ["GET", "POST"],
    credentials: true,
  }
});

app.set('io', io);

// Track live sessions in memory
const liveSessions = new Set();
// Track Room Timers: { roomId: { accumulated: 0, lastResume: null, participants: Set } }
const roomTimers = new Map();

const getRoomTimer = (roomId) => {
  if (!roomTimers.has(roomId)) {
    roomTimers.set(roomId, { accumulated: 0, lastResume: null, participants: new Set() });
  }
  return roomTimers.get(roomId);
};

io.on('connection', (socket) => {
  console.log(`User connected: ${socket.id}`);

  socket.on('join-user-room', (userId) => {
    socket.join(`user:${userId}`);
    console.log(`User ${userId} joined personal room user:${userId}`);
  });

  socket.on('join-room', (roomId, userId) => {
    socket.join(roomId);
    console.log(`User ${userId} joined room ${roomId}`);

    // Timer Logic: Add Participant
    // Timer Logic: Add Participant
    const timer = getRoomTimer(roomId);

    // Ignore observers for timer logic
    if (!userId.startsWith('observer-')) {
      timer.participants.add(socket.id);

      // If we have >= 2 people and timer was stopped, RESUME
      if (timer.participants.size >= 2 && !timer.lastResume) {
        timer.lastResume = Date.now();
        console.log(`[Timer] Resumed for room ${roomId} at ${timer.lastResume}`);
      }
    }

    // Emit current timer state to EVERYONE in room (sync)
    io.to(roomId).emit('timer-sync', {
      accumulated: timer.accumulated,
      lastResume: timer.lastResume,
      participants: timer.participants.size
    });

    socket.to(roomId).emit('user-connected', userId);

    socket.on('disconnect', () => {
      console.log(`User disconnected: ${socket.id}`);

      // Timer Logic: Remove Participant
      if (roomTimers.has(roomId)) {
        const t = roomTimers.get(roomId);
        t.participants.delete(socket.id);

        // If dropped below 2 people and was running, PAUSE
        if (t.participants.size < 2 && t.lastResume) {
          const now = Date.now();
          t.accumulated += (now - t.lastResume);
          t.lastResume = null;
          console.log(`[Timer] Paused for room ${roomId}. Total: ${t.accumulated}ms`);
        }

        io.to(roomId).emit('timer-sync', {
          accumulated: t.accumulated,
          lastResume: t.lastResume,
          participants: t.participants.size
        });
      }

      socket.to(roomId).emit('user-disconnected', userId);
    });
  });

  // Signaling
  socket.on('offer', (payload) => {
    // payload: { target, sdp, callerId }
    // If broadcasting to room:
    socket.to(payload.roomId).emit('offer', payload);
  });

  socket.on('answer', (payload) => {
    socket.to(payload.roomId).emit('answer', payload);
  });

  socket.on('ice-candidate', (payload) => {
    socket.to(payload.roomId).emit('ice-candidate', payload);
  });

  // Chat
  socket.on('send-message', (payload) => {
    // payload: { roomId, message, senderName, time }
    io.in(payload.roomId).emit('receive-message', payload);
  });

  // Reactions
  socket.on('send-reaction', (payload) => {
    io.in(payload.roomId).emit('receive-reaction', payload);
  });

  // Notification
  socket.on('instructor-started-stream', (payload) => {
    console.log(`Instructor started stream in room ${payload.roomId}`);
    liveSessions.add(payload.roomId);
    socket.to(payload.roomId).emit('instructor-started-stream', payload);
  });

  // Role-based Signaling Anti-Collision
  socket.on('request-offer', (payload) => {
    socket.to(payload.roomId).emit('request-offer', payload);
  });

  // Session Management
  socket.on('end-session', (payload) => {
    liveSessions.delete(payload.roomId);
    socket.to(payload.roomId).emit('end-session', payload);
  });

  socket.on('check-session-status', (roomId, callback) => {
    const isLive = liveSessions.has(roomId);
    if (callback) callback({ isLive });
  });

  socket.on('sync-time', (payload) => {
    socket.to(payload.roomId).emit('sync-time', payload);
  });

  // Whiteboard / Pen Tool
  socket.on('draw-line', (payload) => {
    // payload: { roomId, prevPoint, currentPoint, color, width }
    socket.to(payload.roomId).emit('draw-line', payload);
  });

  socket.on('clear-canvas', (payload) => {
    socket.to(payload.roomId).emit('clear-canvas', payload);
  });
});

connectDB().then(() => {
  server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}).catch(err => {
  console.error('Database connection failed:', err);
  process.exit(1);
});