const DPR = require('../models/dprModel');
const sendEmail = require('../config/mailer');

// @desc    Create a new DPR record
// @route   POST /api/dpr
// @access  Private
const createDPR = async (req, res) => {
  const { title, details, dreamValue, dprUrl, fullName, email, phone } = req.body;

  try {
    const dprData = {
      title,
      details,
      dream_value: dreamValue,
      status: 'pending',
      dpr_url: dprUrl
    };

    if (req.user?.id) {
        dprData.user_id = req.user.id;
    } else {
        dprData.guest_name = fullName;
        dprData.guest_email = email;
        dprData.guest_phone = phone;
    }

    const dpr = await DPR.create(dprData);

    // Send Confirmation Email
    try {
      // To User
      await sendEmail({
        to: req.user.email,
        subject: `DPR Request Submitted: ${title}`,
        text: `Your DPR request for ${title} has been submitted for review.`,
        html: `
          <div style="font-family: sans-serif; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
            <h2 style="color: #0891B2;">Request Submitted</h2>
            <p>Hi,</p>
            <p>Your **Dream Achiever (DPR)** request for "<strong>${title}</strong>" has been submitted successfully.</p>
            <p><strong>Dream Value:</strong> ₹${dreamValue.toLocaleString()}</p>
            <p>Our team will review your request and update the status in your dashboard.</p>
          </div>
        `,
      });

      // To Admin
      await sendEmail({
        to: process.env.EMAIL_USER,
        subject: `NEW DPR REQUEST: ${title}`,
        text: `New DPR request from ${req.user.full_name} (${req.user.email}). Vision: ${title}. Value: ₹${dreamValue}`,
        html: `
          <div style="font-family: sans-serif; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
            <h2 style="color: #0891B2;">New Dream Asset Request</h2>
            <p><strong>Dreamer:</strong> ${req.user.full_name} (${req.user.email})</p>
            <p><strong>Vision:</strong> ${title}</p>
            <p><strong>Target Value:</strong> ₹${dreamValue.toLocaleString()}</p>
            <p><strong>Insights:</strong> ${details}</p>
            <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/admin/dprs" style="display: inline-block; margin-top: 20px; background: #0891B2; color: white; padding: 10px 20px; border-radius: 5px; text-decoration: none;">Review in Dashboard</a>
          </div>
        `,
      });
    } catch (mailErr) {
      console.error('DPR email services failed:', mailErr);
    }

    res.status(201).json({ message: 'DPR created successfully', dpr });
  } catch (err) {
    console.error('CREATE DPR ERROR:', err);
    res.status(500).json({ message: err.message || 'Server error' });
  }
};

// @desc    Get all DPR records (Admin or User's own)
// @route   GET /api/dpr
// @access  Private
const getDPRs = async (req, res) => {
  try {
    let dprs;
    const userRole = req.user?.role;
    const userId = req.user?.id;

    console.log(`GET DPRs requested by: ${req.user?.email || 'Unknown'}, Role: ${userRole}`);
    
    // If not admin, only show user's own DPRs
    if (userRole === 'admin') {
      dprs = await DPR.findAll();
    } else {
      if (!userId) {
          return res.status(401).json({ message: 'User identity not found' });
      }
      dprs = await DPR.findByUserId(userId);
    }

    res.status(200).json(dprs || []);
  } catch (err) {
    console.error('GET DPRs ERROR:', err);
    res.status(500).json({ message: 'Failed to fetch DPR records', error: err.message });
  }
};

// @desc    Update DPR status
// @route   PUT /api/dpr/:id/status
// @access  Private/Admin
const updateDPRStatus = async (req, res) => {
  const { status } = req.body;
  const { id } = req.params;

  if (!id || !status) {
      return res.status(400).json({ message: 'ID and Status are required' });
  }

  try {
    const dpr = await DPR.update(id, { status });
    res.status(200).json({ message: 'DPR status updated', dpr });
  } catch (err) {
    console.error('UPDATE DPR STATUS ERROR:', err);
    res.status(500).json({ message: 'Failed to update DPR status', error: err.message });
  }
};

module.exports = {
  createDPR,
  getDPRs,
  updateDPRStatus,
};
