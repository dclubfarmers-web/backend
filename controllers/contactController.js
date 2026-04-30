const Contact = require('../models/contactModel');
const sendEmail = require('../config/mailer');

// @desc    Submit a contact form
// @route   POST /api/contacts
// @access  Public
const submitContact = async (req, res) => {
  const { name, email, subject, message } = req.body;

  try {
    const contact = await Contact.create({ name, email, subject, message });

    // Send Confirmation Email
    try {
      // To User
      await sendEmail({
        to: email,
        subject: `Thank you for contacting DCLUB FARMERS: ${subject || 'General Inquiry'}`,
        text: `Hi ${name}, we have received your message and will get back to you soon.`,
        html: `
          <div style="font-family: sans-serif; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
            <h2 style="color: #0891B2;">Message Received</h2>
            <p>Hi ${name},</p>
            <p>Thank you for reaching out to **DCLUB FARMERS PVT LTD**. We have received your message regarding "<strong>${subject || 'General Inquiry'}</strong>".</p>
            <p>Our team will review your inquiry and get back to you shortly.</p>
            <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
            <p style="font-size: 12px; color: #666;">This is an automated confirmation of your contact form submission.</p>
          </div>
        `,
      });

      // To Admin
      await sendEmail({
        to: process.env.EMAIL_USER,
        subject: `NEW INQUIRY: ${subject || 'General Inquiry'}`,
        text: `New contact form submission from ${name} (${email}). Message: ${message}`,
        html: `
          <div style="font-family: sans-serif; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
            <h2 style="color: #0891B2;">New Contact Lead</h2>
            <p><strong>From:</strong> ${name} (${email})</p>
            <p><strong>Subject:</strong> ${subject || 'N/A'}</p>
            <p><strong>Message:</strong></p>
            <div style="background: #f9f9f9; padding: 15px; border-radius: 5px; border-left: 4px solid #0891B2;">
              ${message}
            </div>
            <a href="${process.env.FRONTEND_URL || 'https://www.dclubfarmers.com'}/admin/inbox" style="display: inline-block; margin-top: 20px; background: #0891B2; color: white; padding: 10px 20px; border-radius: 5px; text-decoration: none;">View in Dashboard</a>
          </div>
        `,
      });
    } catch (mailErr) {
      console.error('Contact email services failed:', mailErr);
    }

    res.status(201).json({ message: 'Message sent successfully', contact });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// @desc    Get all messages (Admin)
// @route   GET /api/contacts
// @access  Private/Admin
const getMessages = async (req, res) => {
  try {
    const messages = await Contact.find({}).sort({ created_at: -1 });
    res.status(200).json(messages);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// @desc    Mark message as read
// @route   PUT /api/contacts/:id/read
// @access  Private/Admin
const markRead = async (req, res) => {
  try {
    const contact = await Contact.findByIdAndUpdate(req.params.id, { is_read: true }, { new: true });
    if (!contact) return res.status(404).json({ message: 'Message not found' });
    res.status(200).json(contact);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// @desc    Delete message
// @route   DELETE /api/contacts/:id
// @access  Private/Admin
const deleteMessage = async (req, res) => {
  try {
    const contact = await Contact.findByIdAndDelete(req.params.id);
    if (!contact) return res.status(404).json({ message: 'Message not found' });
    res.status(200).json({ message: 'Message deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

module.exports = {
  submitContact,
  getMessages,
  markRead,
  deleteMessage,
};
