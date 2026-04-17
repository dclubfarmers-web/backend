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

const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const xss = require('xss-clean');

const app = express();

// Security Middleware
app.use(helmet()); // Sets various security-focused HTTP headers
app.use(xss());    // Prevents Cross-Site Scripting (XSS) attacks

// Rate Limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: { message: 'Too many requests from this IP, please try again after 15 minutes' }
});
app.use('/api/', limiter);

// CORS Policy
const allowedOrigins = [
  'https://www.dclubfarmers.com',
  'https://dclubfarmers.com',
  'http://localhost:5173',
  'http://localhost:3000'
];

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) === -1) {
      const msg = 'The CORS policy for this site does not allow access from the specified Origin.';
      return callback(new Error(msg), false);
    }
    return callback(null, true);
  },
  credentials: true
}));

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
  const supabase = require('./config/db');
  const pkg = require('./package.json');
  
  const start = Date.now();
  let dbStatus = 'Disconnected';
  let latency = 'N/A';
  let counts = { jobs: 0, blogs: 0, applications: 0, admins: 0 };

  try {
    // Run multiple checks in parallel for a faster status page
    const [jobsRes, blogsRes, appsRes, adminsRes] = await Promise.all([
      supabase.from('jobs').select('id', { count: 'exact', head: true }),
      supabase.from('blogs').select('id', { count: 'exact', head: true }),
      supabase.from('applications').select('id', { count: 'exact', head: true }),
      supabase.from('admins').select('id', { count: 'exact', head: true })
    ]);

    if (!jobsRes.error) {
      dbStatus = 'Connected';
      latency = `${Date.now() - start}ms`;
      counts = {
        jobs: jobsRes.count,
        blogs: blogsRes.count,
        applications: appsRes.count,
        admins: adminsRes.count
      };
    } else {
      dbStatus = `Restricted: ${jobsRes.error.message}`;
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

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = app;
