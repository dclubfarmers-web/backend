const supabase = require('../config/db');

const Blog = {
  async findAll(includeUnpublished = false) {
    let query = supabase.from('blogs').select('*');
    if (!includeUnpublished) {
      query = query.eq('is_published', true);
    }
    const { data, error } = await query.order('created_at', { ascending: false });
    if (error) throw error;
    return data;
  },

  async findBySlug(slug) {
    const { data, error } = await supabase
      .from('blogs')
      .select('*')
      .eq('slug', slug)
      .single();
    if (error) throw error;
    return data;
  },

  async create(blogData) {
    const { data, error } = await supabase
      .from('blogs')
      .insert([blogData])
      .select();
    if (error) throw error;
    return data[0];
  },

  async update(id, blogData) {
    const { data, error } = await supabase
      .from('blogs')
      .update({ ...blogData, updated_at: new Date() })
      .eq('id', id)
      .select();
    if (error) throw error;
    return data[0];
  },

  async delete(id) {
    const { error } = await supabase
      .from('blogs')
      .delete()
      .eq('id', id);
    if (error) throw error;
    return true;
  }
};

module.exports = Blog;
