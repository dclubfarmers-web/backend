const supabase = require('../config/db');

const DPR = {
  async findAll() {
    const { data, error } = await supabase
      .from('dprs')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data;
  },

  async findByUserId(userId) {
    const { data, error } = await supabase
      .from('dprs')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data;
  },

  async create(dprData) {
    const { data, error } = await supabase
      .from('dprs')
      .insert([dprData])
      .select();
    if (error) throw error;
    return data[0];
  },

  async update(id, dprData) {
    const { data, error } = await supabase
      .from('dprs')
      .update(dprData)
      .eq('id', id)
      .select();
    if (error) throw error;
    return data[0];
  }
};

module.exports = DPR;
