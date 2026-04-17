const supabase = require('../config/db');

const Job = {
  async findAll() {
    const { data, error } = await supabase
      .from('jobs')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data;
  },

  async findById(id) {
    const { data, error } = await supabase
      .from('jobs')
      .select('*')
      .eq('id', id)
      .maybeSingle();
    if (error) throw error;
    return data;
  },

  async create(jobData) {
    const { data, error } = await supabase
      .from('jobs')
      .insert([jobData])
      .select();
    if (error) throw error;
    return data[0];
  },

  async update(id, jobData) {
    const { data, error } = await supabase
      .from('jobs')
      .update(jobData)
      .eq('id', id)
      .select();
    if (error) throw error;
    return data[0];
  },

  async delete(id) {
    const { error } = await supabase
      .from('jobs')
      .delete()
      .eq('id', id);
    if (error) throw error;
    return true;
  }
};

module.exports = Job;
