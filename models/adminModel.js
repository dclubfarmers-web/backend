const supabase = require('../config/db');
const bcrypt = require('bcryptjs');

const Admin = {
  async findByEmail(email) {
    const { data, error } = await supabase
      .from('admins')
      .select('*')
      .eq('email', email)
      .single();
    if (error && error.code !== 'PGRST116') throw error;
    return data;
  },

  async findById(id) {
    const { data, error } = await supabase
      .from('admins')
      .select('*')
      .eq('id', id)
      .single();
    if (error) throw error;
    return data;
  },

  async create(adminData) {
    const hashedPassword = await bcrypt.hash(adminData.password, 10);
    const { data, error } = await supabase
      .from('admins')
      .insert([{
        ...adminData,
        password: hashedPassword
      }])
      .select();
    if (error) throw error;
    return data[0];
  },

  async getAll() {
    const { data, error } = await supabase
      .from('admins')
      .select('id, full_name, email, role, created_at')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data;
  }
};

module.exports = Admin;
