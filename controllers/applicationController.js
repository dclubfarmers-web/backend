const Application = require('../models/applicationModel');
const Job = require('../models/jobModel');
const DPR = require('../models/dprModel');
const sendEmail = require('../config/mailer');
const { getPresignedUrl, deleteFromS3 } = require('../utils/storageUtils');

// @desc    Apply for a job (High-Fidelity Eater)
// @route   POST /api/applications
// @access  Public
const applyToJob = async (req, res) => {
  let { jobId, fullName, email, phone, summary, resumeUrl, resumeKey, tenure, expected_profit, investment_value, expected_outcome } = req.body;

  try {
    let job;
    // Check if jobId is a valid Mongoose ObjectId
    const mongoose = require('mongoose');
    if (mongoose.Types.ObjectId.isValid(jobId)) {
      job = await Job.findById(jobId);
    }
    
    // Fallback for legacy UUIDs or missing jobs
    if (!job) {
      job = await Job.findOne({ title: 'General Talent Pool' });
      if (job) jobId = job._id;
    }

    if (!job) return res.status(404).json({ message: 'Target job and General Talent Pool not found. System configuration required.' });
    
    const applicationData = {
      job_id: jobId,
      guest_name: fullName,
      guest_email: email,
      guest_phone: phone,
      applicant_summary: summary,
      resume_url: resumeUrl,
      resume_key: resumeKey || req.body.resumeKey,
      status: 'applied',
      tenure: tenure || 0,
      expected_profit: expected_profit || 1.0,
      investment_value: investment_value || 0,
      expected_outcome: expected_outcome || 0
    };

    if (req.user?.id && req.user.role !== 'admin') {
        applicationData.applicant_id = req.user.id;
    }

    const application = await Application.create(applicationData);

    const applicantName = fullName || req.user?.full_name || 'Candidate';
    const applicantEmail = email || req.user?.email || 'N/A';

    // TRIGGER NOTIFICATIONS
    try {
      await sendEmail({
        to: applicantEmail,
        subject: `Application Transmission Successful: ${job.title}`,
        html: `
          <div style="font-family: sans-serif; padding: 25px; border: 1px solid #E2E8F0; border-radius: 12px; max-width: 600px;">
            <h2 style="color: #0369A1; margin-top: 0;">Hello ${applicantName},</h2>
            <p>Your application for the position of <strong>${job.title}</strong> has been successfully ingested by our recruitment system.</p>
            <p>Our talent acquisition team will review your credentials and reach out if there is a strategic alignment.</p>
            <div style="margin-top: 20px; padding: 15px; background: #F8FAFC; border-left: 4px solid #0369A1;">
                <p style="margin: 0; font-size: 0.9rem;"><strong>Position:</strong> ${job.title}</p>
                <p style="margin: 0; font-size: 0.9rem;"><strong>Status:</strong> Under Review</p>
            </div>
            <p style="margin-top: 25px; font-size: 0.8rem; color: #94A3B8;">Powered by DCLUB FARMERS Career Engine.</p>
          </div>
        `,
      });

      await sendEmail({
        to: process.env.EMAIL_USER,
        subject: `🚨 NEW APPLICATION: ${job.title} - ${applicantName}`,
        html: `
          <div style="font-family: sans-serif; padding: 25px; border: 2px solid #0369A1; border-radius: 12px; max-width: 600px;">
            <h2 style="color: #0369A1; margin-top: 0;">New Talent Signal</h2>
            <table style="width: 100%; border-collapse: collapse;">
                <tr><td style="padding: 8px 0; border-bottom: 1px solid #F1F5F9;"><strong>Name:</strong></td><td style="padding: 8px 0; border-bottom: 1px solid #F1F5F9;">${applicantName}</td></tr>
                <tr><td style="padding: 8px 0; border-bottom: 1px solid #F1F5F9;"><strong>Email:</strong></td><td style="padding: 8px 0; border-bottom: 1px solid #F1F5F9;">${applicantEmail}</td></tr>
                <tr><td style="padding: 8px 0; border-bottom: 1px solid #F1F5F9;"><strong>Phone:</strong></td><td style="padding: 8px 0; border-bottom: 1px solid #F1F5F9;">${phone || 'N/A'}</td></tr>
                <tr><td style="padding: 8px 0; border-bottom: 1px solid #F1F5F9;"><strong>Job:</strong></td><td style="padding: 8px 0; border-bottom: 1px solid #F1F5F9;">${job.title}</td></tr>
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

    res.status(201).json({ message: 'Application ingested successfully.', id: application._id });
  } catch (err) {
    console.error('Critical Eater Failure:', err.message);
    res.status(500).json({ message: 'Internal Eater Failure', error: err.message });
  }
};

const getApplications = async (req, res) => {
  try {
    const applications = await Application.find({}).populate('job_id', 'title company').populate('applicant_id', 'full_name email').sort({ created_at: -1 });
    
    // Generate pre-signed URLs
    const enhancedApplications = await Promise.all(applications.map(async (app) => {
      const appObj = app.toObject();
      if (appObj.resume_key) {
        appObj.resume_url = await getPresignedUrl(appObj.resume_key);
      }
      return appObj;
    }));

    res.status(200).json(enhancedApplications);
  } catch (err) {
    console.error('Fetch Applications Error:', err.message);
    res.status(500).json({ message: 'Failed to retrieve applications', error: err.message });
  }
};

const getApplicationById = async (req, res) => {
  try {
    const application = await Application.findById(req.params.id).populate('job_id', 'title company').populate('applicant_id', 'full_name email');
    if (!application) {
      return res.status(404).json({ message: 'Application not found' });
    }

    const appObj = application.toObject();
    if (appObj.resume_key) {
      appObj.resume_url = await getPresignedUrl(appObj.resume_key);
    }

    res.status(200).json(appObj);
  } catch (err) {
    console.error('Fetch Application Error:', err.message);
    res.status(500).json({ message: 'Failed to retrieve application', error: err.message });
  }
};

const updateApplicationStatus = async (req, res) => {
  const { status } = req.body;
  try {
    const application = await Application.findByIdAndUpdate(req.params.id, { status }, { new: true });
    if (!application) {
      return res.status(404).json({ message: 'Application not found' });
    }
    res.status(200).json(application);
  } catch (err) {
    console.error('Update Application Status Error:', err.message);
    res.status(500).json({ message: 'Failed to update application status', error: err.message });
  }
};

// @desc    Delete application
// @route   DELETE /api/applications/:id
// @access  Private/Admin
const deleteApplication = async (req, res) => {
  try {
    const application = await Application.findById(req.params.id);
    if (!application) return res.status(404).json({ message: 'Application not found' });

    if (application.resume_key) {
      await deleteFromS3(application.resume_key);
    }
    
    await Application.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: 'Application and associated resume deleted' });
  } catch (err) {
    console.error('Delete Application Error:', err.message);
    res.status(500).json({ message: 'Failed to delete application', error: err.message });
  }
};

module.exports = {
  applyToJob,
  getApplications,
  getApplicationById,
  updateApplicationStatus,
  deleteApplication,
};
