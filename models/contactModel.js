const supabase = require('../config/db');

const Contact = {
  async findAll() {
    const { data, error } = await supabase
      .from('contacts')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data;
  },

  async create(contactData) {
    const { data, error } = await supabase
      .from('contacts')
      .insert([contactData])
      .select();
    if (error) throw error;
    return data[0];
  },

  async markAsRead(id) {
    const { data, error } = await supabase
      .from('contacts')
      .update({ is_read: true })
      .eq('id', id)
      .select();
    if (error) throw error;
    return data[0];
  },

  async delete(id) {
    const { error } = await supabase
      .from('contacts')
      .delete()
      .eq('id', id);
    if (error) throw error;
    return true;
  }
};

module.exports = Contact;
