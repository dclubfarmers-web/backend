const Admin = require('../models/adminModel');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const sendEmail = require('../config/mailer');
const supabase = require('../config/db');

const generateToken = (user) => {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role, name: user.full_name }, 
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
    const admin = await Admin.findByEmail(email);

    if (admin && (await bcrypt.compare(password, admin.password))) {
      res.json({
        message: 'Login successful',
        user: {
          id: admin.id,
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
      const { data: isInit } = await supabase.from('settings').select('*').eq('key', 'system_initialized').single();
      if (isInit) return res.status(403).json({ message: 'System is already initialized' });
  
      const admin = await Admin.create({
        full_name: fullName,
        email,
        password,
        role: 'admin'
      });
  
      await supabase.from('settings').upsert([
        { key: 'system_initialized', value: { date: new Date(), by: email } },
        { key: 'seo', value: { title: siteName || 'DJAIRINDIA', description: 'Premier Aviation Solutions' } },
        { key: 'contact', value: { email: email, phone: '', address: '' } }
      ]);
  
      // 4. Send Confirmation Email
      try {
        await sendEmail({
          to: email,
          subject: 'DJAIRINDIA: Root System Initialized',
          text: `Hi ${fullName}, your master administrative account has been created and the system is live.`,
          html: `
            <div style="font-family: sans-serif; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
              <h2 style="color: #0891B2;">System Initialization Successful</h2>
              <p>Hi ${fullName},</p>
              <p>Your master administrator account for **${siteName || 'DJAIRINDIA'}** has been established successfully.</p>
              <p>The system setup portal has been permanently locked for security. You can now manage your platform via the admin dashboard.</p>
              <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/admin/login" style="display: inline-block; background: #0891B2; color: white; padding: 10px 20px; border-radius: 5px; text-decoration: none; font-weight: bold;">Access Command Center</a>
            </div>
          `,
        });
      } catch (mailErr) {
        console.error('Setup confirmation email failed:', mailErr);
      }
  
      res.status(201).json({ 
        message: 'First admin created', 
        user: admin,
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
    const { count: jobs } = await supabase.from('jobs').select('*', { count: 'exact', head: true });
    const { count: applications } = await supabase.from('applications').select('*', { count: 'exact', head: true });
    const { count: dprs } = await supabase.from('dprs').select('*', { count: 'exact', head: true });
    const { count: users } = await supabase.from('users').select('*', { count: 'exact', head: true });

    res.json({
      jobs: jobs || 0,
      applications: applications || 0,
      dprs: dprs || 0,
      users: users || 0,
    });
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch stats' });
  }
};

// @desc    Register a new admin
// @route   POST /api/auth/register-admin
const registerAdmin = async (req, res) => {
  const { name, email, password } = req.body;
  try {
    const admin = await Admin.create({ full_name: name, email, password, role: 'admin' });
    res.status(201).json(admin);
  } catch (err) {
    res.status(500).json({ message: 'Registration failed', error: err.message });
  }
};

// @desc    Get all admins
// @route   GET /api/auth/admins
const getAllAdmins = async (req, res) => {
  try {
    const admins = await Admin.findAll();
    res.json(admins);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch admins' });
  }
};

// @desc    Delete an admin
// @route   DELETE /api/auth/admins/:id
const deleteAdmin = async (req, res) => {
  try {
    const { id } = req.params;
    await Admin.delete(id);
    res.json({ message: 'Admin removed successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Deletion failed' });
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
