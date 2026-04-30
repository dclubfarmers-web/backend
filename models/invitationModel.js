const mongoose = require('mongoose');

const invitationSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
  },
  role: {
    type: String,
    default: 'admin',
  },
  token: {
    type: String,
    required: true,
    unique: true,
  },
  invited_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin',
  },
  expires_at: {
    type: Date,
    required: true,
  },
}, {
  timestamps: { createdAt: 'created_at' }
});

const Invitation = mongoose.models.Invitation || mongoose.model('Invitation', invitationSchema);

module.exports = Invitation;
