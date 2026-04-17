const Invitation = require('../models/invitationModel');
const sendEmail = require('../config/mailer');
const crypto = require('crypto');

// @desc    Invite a new admin
// @route   POST /api/invitations
// @access  Private/Admin
const inviteAdmin = async (req, res) => {
  const { email, role } = req.body;

  try {
    const token = crypto.randomBytes(32).toString('hex');
    const invitation = await Invitation.create({
      email,
      role: role || 'admin',
      token,
      invited_by: req.user.id,
    });

    const inviteLink = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/admin/accept-invite?token=${token}`;

    await sendEmail({
      to: email,
      subject: 'Invitation to Join DJAIRINDIA Admin Panel',
      text: `You have been invited to join the DJAIRINDIA Admin Panel. Click here to register: ${inviteLink}`,
      html: `
        <div style="font-family: sans-serif; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
          <h2 style="color: #0891B2;">DJAIRINDIA Invitation</h2>
          <p>You have been invited to join the **Admin Panel** for DJAIRINDIA.</p>
          <p>This invitation will expire in 7 days.</p>
          <a href="${inviteLink}" style="display: inline-block; background: #0891B2; color: white; padding: 10px 20px; border-radius: 5px; text-decoration: none; font-weight: bold;">Accept Invitation</a>
          <p style="margin-top: 20px; font-size: 12px; color: #666;">If the button doesn't work, copy and paste this link: ${inviteLink}</p>
        </div>
      `,
    });

    res.status(201).json({ message: 'Invitation sent successfully', invitation });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// @desc    Get all invitations
// @route   GET /api/invitations
// @access  Private/Admin
const getInvitations = async (req, res) => {
  try {
    const invitations = await Invitation.findAll();
    res.status(200).json(invitations);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

module.exports = {
  inviteAdmin,
  getInvitations,
};
