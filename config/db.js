const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('CRITICAL: Supabase URL and Key are missing!');
  module.exports = null; 
} else {
  const supabase = createClient(supabaseUrl, supabaseKey);
  module.exports = supabase;
}
