const DPR = require('../models/dprModel');
const sendEmail = require('../config/mailer');

// @desc    Create a new DPR record
// @route   POST /api/dpr
// @access  Private
const createDPR = async (req, res) => {
  const { title, details, dreamValue } = req.body;

  try {
    const dpr = await DPR.create({
      title,
      details,
      dream_value: dreamValue,
      user_id: req.user.id,
      status: 'pending',
    });

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
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// @desc    Get all DPR records (Admin or User's own)
// @route   GET /api/dpr
// @access  Private
const getDPRs = async (req, res) => {
  try {
    let dprs;
    // If not admin, only show user's own DPRs
    if (req.user.user_metadata.role !== 'admin') {
      dprs = await DPR.findByUserId(req.user.id);
    } else {
      dprs = await DPR.findAll();
    }

    res.status(200).json(dprs);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// @desc    Update DPR status
// @route   PUT /api/dpr/:id/status
// @access  Private/Admin
const updateDPRStatus = async (req, res) => {
  const { status } = req.body;
  const { id } = req.params;

  try {
    const dpr = await DPR.update(id, { status });
    res.status(200).json({ message: 'DPR status updated', dpr });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

module.exports = {
  createDPR,
  getDPRs,
  updateDPRStatus,
};
