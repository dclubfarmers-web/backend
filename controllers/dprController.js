const DPR = require('../models/dprModel');
const Job = require('../models/jobModel');
const sendEmail = require('../config/mailer');
const { getPresignedUrl, deleteFromS3 } = require('../utils/storageUtils');

// @desc    Create a new DPR record
// @route   POST /api/dpr
// @access  Private
const createDPR = async (req, res) => {
  const { title, details, dreamValue, dprUrl, dprKey, fullName, email, phone } = req.body;

  try {
    // Find the Dream Achiever Program job or create a placeholder
    let job = await Job.findOne({ title: 'Dream Achiever Program' });
    if (!job) {
        job = await Job.create({
            title: 'Dream Achiever Program',
            description: 'Elite incubation program for high-impact agricultural visionaries.',
            company: 'DJAIRINDIA',
            location: 'Remote',
            job_type: 'Elite'
        });
    }

    const dprData = {
      job_id: job._id,
      title,
      details,
      dream_value: dreamValue,
      status: 'pending',
      dpr_url: dprUrl,
      dpr_key: dprKey
    };

    if (req.user?.id && req.user.role !== 'admin') {
        dprData.applicant_id = req.user.id;
    } else {
        dprData.guest_name = fullName;
        dprData.guest_email = email;
        dprData.guest_phone = phone;
    }

    const dpr = await DPR.create(dprData);

    const targetEmail = email || req.user?.email;
    const targetName = fullName || req.user?.full_name || 'Visionary';

    // Send Confirmation Email
    try {
      if (targetEmail) {
        await sendEmail({
          to: targetEmail,
          subject: `DPR Request Submitted: ${title}`,
          text: `Your DPR request for ${title} has been submitted for review.`,
          html: `
            <div style="font-family: sans-serif; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
              <h2 style="color: #0891B2;">Request Submitted</h2>
              <p>Hi ${targetName},</p>
              <p>Your **Dream Achiever (DPR)** request for "<strong>${title}</strong>" has been submitted successfully.</p>
              <p><strong>Dream Value:</strong> ₹${dreamValue.toLocaleString()}</p>
              <p>Our team will review your request and update the status in your dashboard.</p>
            </div>
          `,
        });
      }

      await sendEmail({
        to: process.env.EMAIL_USER,
        subject: `NEW DPR REQUEST: ${title}`,
        text: `New DPR request from ${targetName} (${targetEmail || 'Guest'}). Vision: ${title}. Value: ₹${dreamValue}`,
        html: `
          <div style="font-family: sans-serif; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
            <h2 style="color: #0891B2;">New Dream Asset Request</h2>
            <p><strong>Dreamer:</strong> ${targetName} (${targetEmail || 'Guest'})</p>
            <p><strong>Vision:</strong> ${title}</p>
            <p><strong>Target Value:</strong> ₹${dreamValue.toLocaleString()}</p>
            <p><strong>Insights:</strong> ${details}</p>
            <a href="${process.env.FRONTEND_URL || 'https://www.dclubfarmers.com'}/admin/dprs" style="display: inline-block; margin-top: 20px; background: #0891B2; color: white; padding: 10px 20px; border-radius: 5px; text-decoration: none;">Review in Dashboard</a>
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

    if (userRole === 'admin') {
      dprs = await DPR.find({}).sort({ created_at: -1 }).populate('applicant_id', 'full_name email');
    } else {
      if (!userId) {
          return res.status(401).json({ message: 'User identity not found' });
      }
      dprs = await DPR.find({ applicant_id: userId }).sort({ created_at: -1 });
    }

    // Generate pre-signed URLs
    const enhancedDPRs = await Promise.all((dprs || []).map(async (dpr) => {
      const dprObj = dpr.toObject();
      if (dprObj.dpr_key) {
        dprObj.dpr_url = await getPresignedUrl(dprObj.dpr_key);
      }
      return dprObj;
    }));

    res.status(200).json(enhancedDPRs);
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

  try {
    const dpr = await DPR.findByIdAndUpdate(id, { status }, { new: true });
    if (!dpr) return res.status(404).json({ message: 'DPR not found' });
    res.status(200).json({ message: 'DPR status updated', dpr });
  } catch (err) {
    console.error('UPDATE DPR STATUS ERROR:', err);
    res.status(500).json({ message: 'Failed to update DPR status', error: err.message });
  }
};

// @desc    Delete DPR record
// @route   DELETE /api/dpr/:id
// @access  Private/Admin
const deleteDPR = async (req, res) => {
  try {
    const dpr = await DPR.findById(req.params.id);
    if (!dpr) return res.status(404).json({ message: 'DPR not found' });

    if (dpr.dpr_key) {
      await deleteFromS3(dpr.dpr_key);
    }
    
    await DPR.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: 'DPR and associated media deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

module.exports = {
  createDPR,
  getDPRs,
  updateDPRStatus,
  deleteDPR,
};
