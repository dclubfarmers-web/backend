const mongoose = require('mongoose');

const logSchema = new mongoose.Schema({
  admin_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin',
  },
  action: {
    type: String,
    required: true,
  },
  entity: {
    type: String,
    required: true,
  },
  details: {
    type: String,
  },
  ip_address: {
    type: String,
  },
}, {
  timestamps: { createdAt: 'created_at' }
});

const Log = mongoose.model('Log', logSchema);

module.exports = Log;
