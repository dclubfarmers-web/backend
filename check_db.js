const supabase = require('./config/db');

async function checkAdmins() {
    const { data, error } = await supabase.from('admins').select('*');
    if (error) console.error('Error checking admins:', error);
    else console.log('Current Admins in DB:', data.length);
}

checkAdmins();
