const mongoose = require('mongoose');

const jobSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  description: {
    type: String,
  },
  company: {
    type: String,
  },
  salary: {
    type: String,
  },
  location: {
    type: String,
  },
  job_type: {
    type: String,
  },
  created_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin',
  },
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

jobSchema.set('toJSON', { virtuals: true });
jobSchema.set('toObject', { virtuals: true });
jobSchema.virtual('id').get(function() { return this._id.toHexString(); });

const Job = mongoose.model('Job', jobSchema);

module.exports = Job;
