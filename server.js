const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const dns = require('dns');
require('dotenv').config();

// Configure Google DNS
dns.setServers(['8.8.8.8', '8.8.4.4']);

// Import Routes
const authRoutes = require('./routes/authRoutes');
const jobRoutes = require('./routes/jobRoutes');
const dprRoutes = require('./routes/dprRoutes');
const uploadRoutes = require('./routes/uploadRoutes');
const applicationRoutes = require('./routes/applicationRoutes');
const contactRoutes = require('./routes/contactRoutes');
const invitationRoutes = require('./routes/invitationRoutes');
const settingsRoutes = require('./routes/settingsRoutes');
const blogRoutes = require('./routes/blogRoutes');
const seoRoutes = require('./routes/seoRoutes');
const connectDB = require('./config/mongodb');

// Initialize Express
const app = express();

// 1. Database Connection
connectDB();

// 2. CORS Configuration
const allowedOrigins = [
  'https://www.dclubfarmers.com',
  'https://dclubfarmers.com',
  'https://api.dclubfarmers.com',
  'https://dclubfarmers-frontend.vercel.app',
  'http://localhost:5173',
  'http://localhost:3000'
];

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps or curl)
    if (!origin) return callback(null, true);
    
    const isAllowed = allowedOrigins.some(allowed => 
      allowed === origin || allowed === origin.replace(/\/$/, '')
    );

    if (isAllowed) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin']
}));

// Explicitly handle OPTIONS requests for all routes (Express 5 syntax)
app.options(/.*/, cors());

// 3. Security & Parser Middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// 4. Rate Limiting (Optimized for Vercel)
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 2000, 
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many requests, please try again later.' },
  skip: (req) => process.env.NODE_ENV !== 'production'
});
app.use('/api/', limiter);

// 5. API Routes
app.use('/api/auth', authRoutes);
app.use('/api/jobs', jobRoutes);
app.use('/api/dpr', dprRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/applications', applicationRoutes);
app.use('/api/contacts', contactRoutes);
app.use('/api/invitations', invitationRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/blogs', blogRoutes);

// SEO & Root Routes
app.use('/', seoRoutes);
app.get('/favicon.ico', (req, res) => res.status(204).end());

// Root Dashboard
app.get('/', (req, res) => {
  const state = mongoose.connection.readyState;
  const states = ['Disconnected', 'Connected', 'Connecting', 'Disconnecting'];
  
  res.json({
    status: 'Operational',
    project: 'DCLUB FARMERS API',
    database: states[state] || 'Unknown',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Health Check
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'OK' });
});

// 6. 404 Handler
app.use((req, res) => {
  res.status(404).json({ message: `Route ${req.originalUrl} not found` });
});

// 7. Global Error Handler
app.use((err, req, res, next) => {
  if (res.headersSent) return next(err);

  console.error('SERVER_ERROR:', err);
  
  // Re-inject CORS headers if missing
  const origin = req.headers.origin;
  if (origin && allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Credentials', 'true');
  }

  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error',
    stack: process.env.NODE_ENV === 'production' ? '🥞' : err.stack
  });
});

// 8. Server Startup
const PORT = process.env.PORT || 5000;
if (process.env.NODE_ENV !== 'production' || !process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

module.exports = app;
