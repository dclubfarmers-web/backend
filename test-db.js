const supabase = require('./config/db');

async function testConnection() {
  console.log('Testing Supabase connection...');
  console.log('URL:', process.env.SUPABASE_URL);
  
  try {
    const { data, error, count } = await supabase.from('jobs').select('*', { count: 'exact' });
    
    if (error) {
      console.error('Connection failed:', error.message);
    } else {
      console.log('Connection successful!');
      console.log('Total jobs:', count);
      console.log('Data fetched:', data ? data.length : 0, 'rows');
    }
  } catch (err) {
    console.error('An error occurred:', err.message);
  }
}

testConnection();
