const Application = require('../models/applicationModel');
const Job = require('../models/jobModel');
const sendEmail = require('../config/mailer');

// @desc    Apply for a job (High-Fidelity Eater)
// @route   POST /api/applications
// @access  Public
const applyToJob = async (req, res) => {
  const { jobId, fullName, email, phone, summary, resumeUrl } = req.body;

  try {
    const job = await Job.findById(jobId);
    
    // Step 1: Prepare the most basic payload possible to avoid FK issues
    const applicationData = {
      job_id: jobId,
      status: 'applied',
      resume_url: fullName ? `[GUEST: ${fullName}] ${resumeUrl}` : resumeUrl
    };

    // ONLY add applicant_id if we have a real user to avoid FK violations on null or stale IDs
    // CRITICAL: We also check if the user is NOT an admin, because admins are in a different table!
    if (req.user?.id && req.user.role !== 'admin') {
        applicationData.applicant_id = req.user.id;
    }

    let application;
    try {
        // Attempt 1: Advanced Ingestion (Assuming migration was run)
        const fullData = { 
            ...applicationData,
            guest_name: fullName,
            guest_email: email,
            guest_phone: phone,
            applicant_summary: summary
        };
        application = await Application.create(fullData);
    } catch (dbErr) {
        console.warn('Advanced schema columns missing or FK rejected, falling back to minimal ingestion...');
        // Attempt 2: Basic Ingestion (Legacy Schema)
        application = await Application.create(applicationData);
    }

    const applicantName = fullName || req.user?.full_name || 'Candidate';
    const applicantEmail = email || req.user?.email || 'N/A';

    // TRIGGER NOTIFICATIONS (The 'Eater' part)
    try {
      // 1. Confirmation to Candidate
      await sendEmail({
        to: applicantEmail,
        subject: `Application Transmission Successful: ${job?.title || 'Position'}`,
        html: `
          <div style="font-family: sans-serif; padding: 25px; border: 1px solid #E2E8F0; border-radius: 12px; max-width: 600px;">
            <h2 style="color: #0369A1; margin-top: 0;">Hello ${applicantName},</h2>
            <p>Your application for the position of <strong>${job?.title || 'Open Role'}</strong> has been successfully ingested by our recruitment system.</p>
            <p>Our talent acquisition team will review your credentials and reach out if there is a strategic alignment.</p>
            <div style="margin-top: 20px; padding: 15px; background: #F8FAFC; border-left: 4px solid #0369A1;">
                <p style="margin: 0; font-size: 0.9rem;"><strong>Position:</strong> ${job?.title}</p>
                <p style="margin: 0; font-size: 0.9rem;"><strong>Status:</strong> Under Review</p>
            </div>
            <p style="margin-top: 25px; font-size: 0.8rem; color: #94A3B8;">Powered by DCLUB FARMERS Career Engine.</p>
          </div>
        `,
      });

      // 2. Alert to Admin
      await sendEmail({
        to: process.env.EMAIL_USER,
        subject: `🚨 NEW APPLICATION: ${job?.title || 'Position'} - ${applicantName}`,
        html: `
          <div style="font-family: sans-serif; padding: 25px; border: 2px solid #0369A1; border-radius: 12px; max-width: 600px;">
            <h2 style="color: #0369A1; margin-top: 0;">New Talent Signal</h2>
            <table style="width: 100%; border-collapse: collapse;">
                <tr><td style="padding: 8px 0; border-bottom: 1px solid #F1F5F9;"><strong>Name:</strong></td><td style="padding: 8px 0; border-bottom: 1px solid #F1F5F9;">${applicantName}</td></tr>
                <tr><td style="padding: 8px 0; border-bottom: 1px solid #F1F5F9;"><strong>Email:</strong></td><td style="padding: 8px 0; border-bottom: 1px solid #F1F5F9;">${applicantEmail}</td></tr>
                <tr><td style="padding: 8px 0; border-bottom: 1px solid #F1F5F9;"><strong>Phone:</strong></td><td style="padding: 8px 0; border-bottom: 1px solid #F1F5F9;">${phone || 'N/A'}</td></tr>
                <tr><td style="padding: 8px 0; border-bottom: 1px solid #F1F5F9;"><strong>Job:</strong></td><td style="padding: 8px 0; border-bottom: 1px solid #F1F5F9;">${job?.title}</td></tr>
            </table>
            <div style="margin-top: 20px;">
                <strong>Summary:</strong>
                <p style="background: #F8FAFC; padding: 12px; border-radius: 8px; font-style: italic;">${summary || 'No summary provided.'}</p>
            </div>
            <div style="margin-top: 20px;">
                <strong>Resume Link:</strong><br/>
                <a href="${resumeUrl}" style="color: #0369A1; word-break: break-all;">${resumeUrl}</a>
            </div>
            <a href="${process.env.FRONTEND_URL || 'https://www.dclubfarmers.com'}/admin/applications" style="display: inline-block; margin-top: 25px; background: #0369A1; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold;">Ingest to Dashboard</a>
          </div>
        `,
      });
    } catch (mailErr) {
      console.error('Eater notification system failed:', mailErr);
    }

    res.status(201).json({ message: 'Application ingested successfully.', id: application.id });
  } catch (err) {
    console.error('Critical Eater Failure:', err.message);
    res.status(500).json({ message: 'Internal Eater Failure', error: err.message });
  }
};

const getApplications = async (req, res) => {
  try {
    const applications = await Application.findAll();
    res.status(200).json(applications);
  } catch (err) {
    res.status(500).json({ message: 'Failed to retrieve applications' });
  }
};

module.exports = {
  applyToJob,
  getApplications,
};
