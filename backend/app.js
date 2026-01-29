const express = require('express');
const session = require('express-session');
const cookieParser = require('cookie-parser');
const cors = require('cors');

const authRoutes = require('./API/routes/authRoutes');
const doubtRoutes = require('./API/routes/doubtRoutes');
const sessionRequestRoutes = require('./API/routes/sessionRequestRoutes');
const sessionRoutes = require('./API/routes/sessionRoutes');
const adminRoutes = require('./API/routes/adminRoutes');
const instructorRoutes = require('./API/routes/instructorRoutes');
const commentRoutes = require('./API/routes/commentRoutes');
const roadmapRoutes = require('./API/routes/roadmapRoutes');

const MongoStore = require('connect-mongo').default;

const app = express();

// Middleware
app.set('trust proxy', 1); // Required for Render/Heroku to trust the proxy and allow secure cookies
app.use(cors({
  credentials: true,
  origin: ['http://localhost:5173', 'https://project-h-frontend.onrender.com', process.env.CLIENT_URL].filter(Boolean)
}));
app.use(express.json());
app.use(cookieParser());
app.use(session({
  secret: process.env.SESSION,
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({
    mongoUrl: (() => {
      const uri = `${process.env.DB_URI}/${process.env.DB_NAME}`;
      console.log('Initializing MongoStore with URI:', uri.replace(/\/\/.*@/, '//***@')); // Log masked URI
      return uri;
    })(),
    collectionName: 'sessions',
    ttl: 24 * 60 * 60 // 1 day
  }),
  cookie: {
    secure: true, // MUST be true for SameSite: 'none'
    sameSite: 'none', // Required for cross-site (frontend != backend domain)
    maxAge: 24 * 60 * 60 * 1000
  }
}));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/doubts', doubtRoutes);
app.use('/api/session-requests', sessionRequestRoutes);
app.use('/api/sessions', sessionRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/instructors', instructorRoutes);
app.use('/api/comments', commentRoutes);
app.use('/api/roadmaps', roadmapRoutes);
app.use('/api/notifications', require('./API/routes/notificationRoutes'));

module.exports = app;