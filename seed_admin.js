const supabase = require('./config/db');
const bcrypt = require('bcryptjs');

async function seedAdmin() {
    const hashedPassword = await bcrypt.hash('admin123', 10);
    const { data, error } = await supabase.from('admins').insert([{
        full_name: 'System Admin',
        email: 'admin@djairindia.com',
        password: hashedPassword,
        role: 'admin'
    }]).select();

    if (error) console.error('Error seeding admin:', error);
    else console.log('Emergency Admin Created: admin@djairindia.com / admin123');
}

seedAdmin();
