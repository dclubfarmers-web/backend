const mongoose = require('mongoose');

const applicationSchema = new mongoose.Schema({
  job_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Job',
    required: true,
  },
  applicant_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  guest_name: {
    type: String,
  },
  guest_email: {
    type: String,
  },
  guest_phone: {
    type: String,
  },
  applicant_summary: {
    type: String,
  },
  resume_url: {
    type: String,
  },
  resume_key: {
    type: String,
  },
  status: {
    type: String,
    default: 'applied',
  },
  tenure: {
    type: Number,
    default: 0,
  },
  expected_profit: {
    type: Number,
    default: 1.0,
  },
  investment_value: {
    type: Number,
    default: 0,
  },
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

applicationSchema.set('toJSON', { virtuals: true });
applicationSchema.set('toObject', { virtuals: true });
applicationSchema.virtual('id').get(function() { return this._id.toHexString(); });

const Application = mongoose.models.Application || mongoose.model('Application', applicationSchema);

module.exports = Application;
