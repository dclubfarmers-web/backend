const mongoose = require('mongoose');

const dprSchema = new mongoose.Schema({
  job_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Job',
    required: true,
  },
  applicant_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  title: {
    type: String,
    required: true,
  },
  details: {
    type: String,
  },
  dream_value: {
    type: Number,
  },
  dpr_url: {
    type: String,
  },
  dpr_key: {
    type: String,
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
  status: {
    type: String,
    default: 'pending',
  },
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

dprSchema.set('toJSON', { virtuals: true });
dprSchema.set('toObject', { virtuals: true });
dprSchema.virtual('id').get(function() { return this._id.toHexString(); });

const DPR = mongoose.models.DPR || mongoose.model('DPR', dprSchema);

module.exports = DPR;
