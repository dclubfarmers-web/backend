const Log = require('../models/logModel');

const logActivity = async (req, action, entity, details) => {
  try {
    await Log.create({
      admin_id: req.user?.id,
      action,
      entity,
      details,
      ip_address: req.ip || req.headers['x-forwarded-for'] || ''
    });
  } catch (error) {
    console.error('Failed to log activity:', error);
  }
};

module.exports = logActivity;
