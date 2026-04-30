const Admin = require('../models/adminModel');
const Job = require('../models/jobModel');
const Application = require('../models/applicationModel');
const DPR = require('../models/dprModel');
const User = require('../models/userModel');
const Settings = require('../models/settingsModel');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const sendEmail = require('../config/mailer');

const generateToken = (user) => {
  return jwt.sign(
    { id: user._id, email: user.email, role: user.role, name: user.full_name }, 
    process.env.JWT_SECRET || 'secret', 
    { expiresIn: '30d' }
  );
};

// @desc    Admin Login
// @route   POST /api/auth/login
// @access  Public
const login = async (req, res) => {
  const { email, password } = req.body;

  try {
    const admin = await Admin.findOne({ email });

    if (admin && (await admin.matchPassword(password))) {
      res.json({
        message: 'Login successful',
        user: {
          id: admin._id,
          full_name: admin.full_name,
          email: admin.email,
          role: admin.role,
        },
        token: generateToken(admin),
      });
    } else {
      res.status(401).json({ message: 'Invalid email or password' });
    }
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// @desc    Setup the first admin (One-time only)
// @route   POST /api/auth/setup
const setupFirstAdmin = async (req, res) => {
    const { email, password, fullName, siteName } = req.body;
  
    try {
      const isInit = await Settings.findOne({ key: 'system_initialized' });
      if (isInit) return res.status(403).json({ message: 'System is already initialized' });
  
      const admin = await Admin.create({
        full_name: fullName,
        email,
        password,
        role: 'admin'
      });
  
      await Settings.insertMany([
        { key: 'system_initialized', value: { date: new Date(), by: email } },
        { key: 'seo', value: { title: siteName || 'DCLUB FARMERS', description: 'Premier Aviation Solutions' } },
        { key: 'contact', value: { email: email, phone: '', address: '' } }
      ]);
  
      // 4. Send Confirmation Email
      try {
        await sendEmail({
          to: email,
          subject: 'DCLUB FARMERS: Root System Initialized',
          text: `Hi ${fullName}, your master administrative account has been created and the system is live.`,
          html: `
            <div style="font-family: sans-serif; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
              <h2 style="color: #0891B2;">System Initialization Successful</h2>
              <p>Hi ${fullName},</p>
              <p>Your master administrator account for **${siteName || 'DCLUB FARMERS'}** has been established successfully.</p>
              <p>The system setup portal has been permanently locked for security. You can now manage your platform via the admin dashboard.</p>
              <a href="${process.env.FRONTEND_URL || 'https://www.dclubfarmers.com'}/admin/login" style="display: inline-block; background: #0891B2; color: white; padding: 10px 20px; border-radius: 5px; text-decoration: none; font-weight: bold;">Access Command Center</a>
            </div>
          `,
        });
      } catch (mailErr) {
        console.error('Setup confirmation email failed:', mailErr);
      }
  
      res.status(201).json({ 
        message: 'First admin created', 
        user: {
            id: admin._id,
            full_name: admin.full_name,
            email: admin.email,
            role: admin.role
        },
        token: generateToken(admin)
      });
    } catch (err) {
      res.status(500).json({ message: 'Setup failed', error: err.message });
    }
};

// @desc    Get user profile
const getProfile = async (req, res) => {
  res.json({ user: req.user });
};

// @desc    Get dashboard statistics
// @route   GET /api/auth/stats
const getDashboardStats = async (req, res) => {
  try {
    const jobsCount = await Job.countDocuments();
    const applicationsCount = await Application.countDocuments();
    const dprsCount = await DPR.countDocuments();
    const usersCount = await User.countDocuments();

    res.json({
      jobs: jobsCount || 0,
      applications: applicationsCount || 0,
      dprs: dprsCount || 0,
      users: usersCount || 0,
    });
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch stats', error: err.message });
  }
};

// @desc    Register a new admin
// @route   POST /api/auth/register-admin
const registerAdmin = async (req, res) => {
  const { name, email, password } = req.body;
  try {
    const admin = await Admin.create({ full_name: name, email, password, role: 'admin' });
    res.status(201).json({
        id: admin._id,
        full_name: admin.full_name,
        email: admin.email,
        role: admin.role
    });
  } catch (err) {
    res.status(500).json({ message: 'Registration failed', error: err.message });
  }
};

// @desc    Get all admins
// @route   GET /api/auth/admins
const getAllAdmins = async (req, res) => {
  try {
    const admins = await Admin.find({}).select('-password').sort({ created_at: -1 });
    res.json(admins);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch admins', error: err.message });
  }
};

// @desc    Delete an admin
// @route   DELETE /api/auth/admins/:id
const deleteAdmin = async (req, res) => {
  try {
    const { id } = req.params;
    await Admin.findByIdAndDelete(id);
    res.json({ message: 'Admin removed successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Deletion failed', error: err.message });
  }
};

module.exports = {
  login,
  getProfile,
  setupFirstAdmin,
  getDashboardStats,
  registerAdmin,
  getAllAdmins,
  deleteAdmin,
};
