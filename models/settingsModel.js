const supabase = require('../config/db');

const Settings = {
  async getAll() {
    const { data, error } = await supabase
      .from('settings')
      .select('*');
    if (error) throw error;
    
    // Transform array to object for easier use
    return data.reduce((acc, current) => {
      acc[current.key] = current.value;
      return acc;
    }, {});
  },

  async update(key, value) {
    const { data, error } = await supabase
      .from('settings')
      .upsert({ key, value, updated_at: new Date() })
      .select();
    if (error) throw error;
    return data[0];
  }
};

module.exports = Settings;
