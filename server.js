const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const connectDB = require('./config/db');
require('dotenv').config();

// Initialize App
const app = express();

// Global Middleware
app.set('trust proxy', 1);
app.use(cors({
    origin: true, // Allow all origins for debugging, will tighten later
    credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// API Status (Root Dashboard)
app.get('/', (req, res) => {
    const status = {
        project: 'DCLUB FARMERS',
        status: 'Operational',
        database: {
            state: mongoose.connection.readyState === 1 ? 'Connected' : 
                   mongoose.connection.readyState === 2 ? 'Connecting' : 'Disconnected',
            host: mongoose.connection.host || 'N/A'
        },
        environment: process.env.NODE_ENV || 'production',
        vercel: !!process.env.VERCEL,
        system: {
            uptime: Math.floor(process.uptime()) + 's',
            memory: (process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2) + ' MB',
            node: process.version,
            platform: process.platform
        },
        timestamp: new Date().toISOString()
    };
    res.json(status);
});

// Legacy status redirect
app.get('/api/status', (req, res) => res.redirect('/'));

// Lazy Database Connection Middleware
app.use(async (req, res, next) => {
    try {
        await connectDB();
        next();
    } catch (err) {
        next(err);
    }
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



// Mount Routes
app.use('/api/auth', authRoutes);
app.use('/api/jobs', jobRoutes);
app.use('/api/dpr', dprRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/applications', applicationRoutes);
app.use('/api/contacts', contactRoutes);
app.use('/api/invitations', invitationRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/blogs', blogRoutes);
app.use('/', seoRoutes);

app.get('/favicon.ico', (req, res) => res.status(204).end());

// Global Error Handler
app.use((err, req, res, next) => {
    console.error('CRITICAL_SERVER_ERROR:', err);
    res.status(500).json({ success: false, message: 'Internal Server Error' });
});

// Export for Vercel
module.exports = app;

// Local Development
if (process.env.NODE_ENV !== 'production' && !process.env.VERCEL) {
    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => console.log(`Backend running on port ${PORT}`));
}
