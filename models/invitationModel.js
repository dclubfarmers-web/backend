const supabase = require('../config/db');

const Invitation = {
  async findAll() {
    const { data, error } = await supabase
      .from('invitations')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data;
  },

  async create(invitationData) {
    const { data, error } = await supabase
      .from('invitations')
      .insert([invitationData])
      .select();
    if (error) throw error;
    return data[0];
  },

  async findByToken(token) {
    const { data, error } = await supabase
      .from('invitations')
      .select('*')
      .eq('token', token)
      .single();
    if (error) throw error;
    return data;
  },

  async delete(id) {
    const { error } = await supabase
      .from('invitations')
      .delete()
      .eq('id', id);
    if (error) throw error;
    return true;
  }
};

module.exports = Invitation;
