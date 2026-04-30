const Settings = require('../models/settingsModel');

// @desc    Get all site settings
// @route   GET /api/settings
// @access  Public
const getSettings = async (req, res) => {
  try {
    const settingsRows = await Settings.find({});
    const settings = {};
    settingsRows.forEach(row => {
      settings[row.key] = row.value;
    });
    res.status(200).json(settings);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// @desc    Update site settings
// @route   PUT /api/settings
// @access  Private/Admin
const updateSettings = async (req, res) => {
  const settingsData = req.body; // Expecting { key: value } pairs

  try {
    const promises = Object.entries(settingsData).map(([key, value]) => 
      Settings.findOneAndUpdate({ key }, { value }, { upsert: true, new: true })
    );
    
    await Promise.all(promises);
    res.status(200).json({ message: 'Settings updated successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

module.exports = {
  getSettings,
  updateSettings,
};
