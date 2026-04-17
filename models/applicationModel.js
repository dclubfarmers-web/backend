const supabase = require('../config/db');

const Application = {
  async findAll() {
    const { data, error } = await supabase
      .from('applications')
      .select(`
        *,
        job:job_id (title, company),
        applicant:applicant_id (email)
      `)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data;
  },

  async findByUserId(userId) {
    const { data, error } = await supabase
      .from('applications')
      .select(`
        *,
        job:job_id (title, company)
      `)
      .eq('applicant_id', userId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data;
  },

  async create(applicationData) {
    const { data, error } = await supabase
      .from('applications')
      .insert([applicationData])
      .select();
    if (error) throw error;
    return data[0];
  },

  async updateStatus(id, status) {
    const { data, error } = await supabase
      .from('applications')
      .update({ status })
      .eq('id', id)
      .select();
    if (error) throw error;
    return data[0];
  }
};

module.exports = Application;
