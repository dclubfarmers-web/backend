const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
require('dotenv').config();

// Global Error Catching for Serverless Stability
process.on('uncaughtException', (err) => {
  console.error('CRITICAL UNCAUGHT EXCEPTION:', err);
});
process.on('unhandledRejection', (reason, promise) => {
  console.error('CRITICAL UNHANDLED REJECTION:', reason);
});

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

// Trust proxy for Vercel / Load Balancers
app.set('trust proxy', 1);

// 1. Database Connection (Lazy Pattern for Serverless)
app.use(async (req, res, next) => {
  try {
    if (mongoose.connection.readyState === 0) {
      console.log('Serverless Lifecycle: Initializing Lazy Database Connection...');
      await connectDB();
    }
    next();
  } catch (err) {
    console.error('SERVERLESS_DB_INIT_FAILURE:', err);
    next();
  }
});

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

// Handle Preflight globally
app.options(/.*/, cors());

// 3. Parser Middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// 4. Initial Status Route
app.get('/api/status', (req, res) => {
  res.json({ status: 'API_ALIVE', timestamp: new Date().toISOString() });
});

// 5. Root Dashboard (Priority)
app.get('/', (req, res) => {
  const state = mongoose.connection.readyState;
  const states = ['Disconnected', 'Connected', 'Connecting', 'Disconnecting'];
  res.json({
    status: 'Operational',
    project: 'DCLUB FARMERS API',
    database: states[state] || 'Unknown',
    timestamp: new Date().toISOString()
  });
});

// 6. API Routes
app.use('/api/auth', authRoutes);
app.use('/api/jobs', jobRoutes);
app.use('/api/dpr', dprRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/applications', applicationRoutes);
app.use('/api/contacts', contactRoutes);
app.use('/api/invitations', invitationRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/blogs', blogRoutes);

// SEO & Favicon
app.use('/', seoRoutes);
app.get('/favicon.ico', (req, res) => res.status(204).end());

// Health Check
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'OK' });
});

// 7. 404 Handler
app.use((req, res) => {
  res.status(404).json({ message: `Route ${req.originalUrl} not found` });
});

// 8. Global Error Handler
app.use((err, req, res, next) => {
  if (res.headersSent) return next(err);
  console.error('SERVER_ERROR:', err);
  const origin = req.headers.origin;
  if (origin && allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Credentials', 'true');
  }
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error'
  });
});

// 9. Startup
const PORT = process.env.PORT || 5000;
if (process.env.NODE_ENV !== 'production' || !process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

module.exports = app;
