const express = require('express');
const cors = require('cors');
require('dotenv').config();

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
const supabase = require('./config/db');

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
  'https://dclubfarmers-frontend.vercel.app', // Adding Vercel default domain just in case
  'http://localhost:5173',
  'http://localhost:3000'
];

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    // Check if the origin is allowed
    const isAllowed = allowedOrigins.some(allowed => {
      // Direct match
      if (allowed === origin) return true;
      // Match even if the origin has a trailing slash
      if (allowed === origin.replace(/\/$/, '')) return true;
      return false;
    });

    if (isAllowed) {
      callback(null, true);
    } else {
      console.log('CORS blocked origin:', origin);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept']
}));

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

// Root endpoint - Live System Dashboard
app.get('/', async (req, res) => {
  const start = Date.now();
  let dbStatus = 'Disconnected';
  let latency = 'N/A';
  let counts = { jobs: 0, blogs: 0, applications: 0, admins: 0 };

  try {
    if (!supabase) {
      throw new Error('Database client not initialized');
    }

    // Run multiple checks in parallel for a faster status page
    const results = await Promise.allSettled([
      supabase.from('jobs').select('id', { count: 'exact', head: true }),
      supabase.from('blogs').select('id', { count: 'exact', head: true }),
      supabase.from('applications').select('id', { count: 'exact', head: true }),
      supabase.from('admins').select('id', { count: 'exact', head: true })
    ]);

    const [jobsRes, blogsRes, appsRes, adminsRes] = results.map(r => r.status === 'fulfilled' ? r.value : { error: r.reason });

    if (jobsRes && !jobsRes.error) {
      dbStatus = 'Connected';
      latency = `${Date.now() - start}ms`;
      counts = {
        jobs: jobsRes.count || 0,
        blogs: blogsRes.count || 0,
        applications: appsRes.count || 0,
        admins: adminsRes.count || 0
      };
    } else {
      dbStatus = `Restricted: ${jobsRes?.error?.message || 'Unknown error'}`;
    }
  } catch (e) {
    dbStatus = `Exception: ${e.message}`;
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
      provider: 'Supabase'
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
  console.error('Unhandled Error:', err);
  res.status(err.status || 500).json({
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
