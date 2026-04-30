const Invitation = require('../models/invitationModel');
const Admin = require('../models/adminModel');
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
      expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days from now
    });

    const inviteLink = `${process.env.FRONTEND_URL || 'https://www.dclubfarmers.com'}/admin/accept-invite?token=${token}`;

    await sendEmail({
      to: email,
      subject: 'Invitation to Join DCLUB FARMERS Admin Panel',
      text: `You have been invited to join the DCLUB FARMERS Admin Panel. Click here to register: ${inviteLink}`,
      html: `
        <div style="font-family: sans-serif; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
          <h2 style="color: #0891B2;">DCLUB FARMERS Invitation</h2>
          <p>You have been invited to join the **Admin Panel** for DCLUB FARMERS.</p>
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

// @desc    Accept admin invitation
// @route   POST /api/invitations/accept
// @access  Public
const acceptInvitation = async (req, res) => {
  const { token, fullName, password } = req.body;

  try {
    const invitation = await Invitation.findOne({ token });
    
    if (!invitation) {
      return res.status(404).json({ message: 'Invalid or expired invitation token' });
    }

    if (new Date(invitation.expires_at) < new Date()) {
      await Invitation.findByIdAndDelete(invitation._id);
      return res.status(400).json({ message: 'Invitation has expired' });
    }

    // Create the admin account
    const admin = await Admin.create({
      full_name: fullName,
      email: invitation.email,
      password: password,
      role: invitation.role
    });

    // Delete the invitation
    await Invitation.findByIdAndDelete(invitation._id);

    res.status(201).json({ message: 'Account created successfully', user: admin });
  } catch (err) {
    console.error('Accept Invitation Error:', err);
    res.status(500).json({ message: 'Failed to accept invitation', error: err.message });
  }
};

// @desc    Get all invitations
// @route   GET /api/invitations
// @access  Private/Admin
const getInvitations = async (req, res) => {
  try {
    const invitations = await Invitation.find({}).populate('invited_by', 'full_name email').sort({ created_at: -1 });
    res.status(200).json(invitations);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// @desc    Get invitation by token (Public)
// @route   GET /api/invitations/:token
const getInvitationByToken = async (req, res) => {
  const { token } = req.params;

  try {
    const invitation = await Invitation.findOne({ token });
    
    if (!invitation) {
      return res.status(404).json({ message: 'Invalid or expired invitation token' });
    }

    if (new Date(invitation.expires_at) < new Date()) {
      return res.status(400).json({ message: 'Invitation has expired' });
    }

    res.status(200).json(invitation);
  } catch (err) {
    res.status(500).json({ message: 'Failed to Fetch invitation', error: err.message });
  }
};

module.exports = {
  inviteAdmin,
  acceptInvitation,
  getInvitations,
  getInvitationByToken,
};
