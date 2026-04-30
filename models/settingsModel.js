const mongoose = require('mongoose');

const settingsSchema = new mongoose.Schema({
  key: {
    type: String,
    required: true,
    unique: true,
  },
  value: {
    type: mongoose.Schema.Types.Mixed,
    required: true,
  },
}, {
  timestamps: { updatedAt: 'updated_at' }
});

const Settings = mongoose.model('Settings', settingsSchema);

module.exports = Settings;
