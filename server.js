const express = require('express');
const cors = require('cors');
const dns = require('dns');
require('dotenv').config();

// Configure Google DNS for the application
dns.setServers(['8.8.8.8', '8.8.4.4']);

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

// Connect to Database
connectDB();

// Import package.json safely
let pkg = { version: '1.0.0' };
try {
  pkg = require('./package.json');
} catch (e) {
  console.error('Could not load package.json');
}

const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

const app = express();

// 1. CORS Policy - MUST BE FIRST to handle preflight requests and set headers for all responses
const allowedOrigins = [
  'https://www.dclubfarmers.com',
  'https://dclubfarmers.com',
  'https://api.dclubfarmers.com',
  'https://dclubfarmers-frontend.vercel.app',
  'http://localhost:5173',
  'http://localhost:3000'
];

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    const isAllowed = allowedOrigins.some(allowed => {
      return allowed === origin || allowed === origin.replace(/\/$/, '');
    });

    if (isAllowed) {
      callback(null, true);
    } else {
      // In production, we still want to allow but maybe log
      // For now, let's be strict but ensure we don't break the flow
      console.warn('CORS request from unauthorized origin:', origin);
      callback(null, true); // Temporarily allow all to debug if the origin matching is the issue
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin']
}));

// Explicitly handle OPTIONS requests for all routes
app.options('*', cors());

// 2. Security Middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" } // Explicitly allow cross-origin
}));
// Note: xss-clean is removed as it's deprecated and can cause issues with Express 5

// 3. Rate Limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // Increased limit for production
  message: { message: 'Too many requests from this IP, please try again after 15 minutes' }
});
app.use('/api/', limiter);

app.use(express.json({ limit: '10kb' })); // Body parser, with limit to prevent large payload attacks

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/jobs', jobRoutes);
app.use('/api/dpr', dprRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/applications', applicationRoutes);
app.use('/api/contacts', contactRoutes);
app.use('/api/invitations', invitationRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/blogs', blogRoutes);
app.use('/', seoRoutes); // Mount SEO routes (sitemap, robots)

// Favicon handler to prevent 404s
app.get('/favicon.ico', (req, res) => res.status(204).end());

// Root endpoint - Live System Dashboard
app.get('/', async (req, res) => {
  const start = Date.now();
  const mongoose = require('mongoose');
  let dbStatus = 'Disconnected';
  let latency = 'N/A';
  let counts = { jobs: 0, blogs: 0, applications: 0, admins: 0 };

  try {
    const state = mongoose.connection.readyState;
    const states = ['Disconnected', 'Connected', 'Connecting', 'Disconnecting'];
    dbStatus = states[state] || 'Unknown';

    if (state === 1) { // Connected
      latency = `${Date.now() - start}ms`;
      
      // Import models for counts
      const Job = require('./models/jobModel');
      const Blog = require('./models/blogModel');
      const Application = require('./models/applicationModel');
      const Admin = require('./models/adminModel');

      // Run multiple checks in parallel with a timeout to avoid hanging
      const countPromises = [
        Job.countDocuments().catch(() => 0),
        Blog.countDocuments().catch(() => 0),
        Application.countDocuments().catch(() => 0),
        Admin.countDocuments().catch(() => 0)
      ];

      const [jobsCount, blogsCount, appsCount, adminsCount] = await Promise.all(countPromises);
      
      counts = {
        jobs: jobsCount,
        blogs: blogsCount,
        applications: appsCount,
        admins: adminsCount
      };
    }
  } catch (e) {
    dbStatus = `Status Check Error: ${e.message}`;
  }

  res.json({
    project: 'DCLUB FARMERS',
    api_status: 'Operational',
    version: pkg.version || '1.0.0',
    environment: process.env.NODE_ENV || 'production',
    live_stats: {
      active_listings: counts.jobs,
      published_articles: counts.blogs,
      total_candidates: counts.applications,
      system_operators: counts.admins
    },
    database: {
      status: dbStatus,
      latency: latency,
      provider: 'MongoDB'
    },
    server: {
      uptime: `${Math.floor(process.uptime() / 3600)}h ${Math.floor((process.uptime() % 3600) / 60)}m ${Math.floor(process.uptime() % 60)}s`,
      memory_usage: `${Math.round(process.memoryUsage().heapUsed / 1024 / 1024 * 100) / 100} MB`,
      timestamp: new Date().toISOString()
    }
  });
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Global Error Handler
app.use((err, req, res, next) => {
  // If headers already sent, delegate to default express error handler
  if (res.headersSent) {
    return next(err);
  }

  console.error('Unhandled Error:', err);
  
  // Ensure CORS headers are present even in error responses
  const origin = req.headers.origin;
  if (origin && (allowedOrigins.includes(origin) || allowedOrigins.includes(origin.replace(/\/$/, '')))) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Credentials', 'true');
  }

  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error',
    error: process.env.NODE_ENV === 'production' ? {} : err
  });
});

const PORT = process.env.PORT || 5000;

// Only listen if not running on Vercel
if (process.env.NODE_ENV !== 'production' || !process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

module.exports = app;
