const supabase = require('../config/db');

const logActivity = async (req, action, entity, details) => {
  try {
    await supabase.from('activity_logs').insert([{
      admin_id: req.user?.id,
      action,
      entity,
      details,
      ip_address: req.ip || req.headers['x-forwarded-for'] || ''
    }]);
  } catch (error) {
    console.error('Failed to log activity:', error);
  }
};

module.exports = logActivity;
