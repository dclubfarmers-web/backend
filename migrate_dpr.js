
const supabase = require('./config/db');

async function migrateDPR() {
    console.log('Attempting to migrate DPR table...');
    // We try to insert a dummy record with the new columns to see if it works
    // Since we don't have direct SQL access, this is a "vibe check"
    const { error } = await supabase.from('dprs').insert([
        { 
            title: 'MIGRATION_CHECK', 
            guest_name: 'test', 
            dpr_url: 'test',
            user_id: '00000000-0000-4000-a000-000000000000' // Invalid UUID but lets see
        }
    ]);
    
    if (error && error.message.includes('column') && error.message.includes('does not exist')) {
        console.error('MIGRATION FAILED: Columns are missing in Supabase. Please run the following SQL in your Supabase Dashboard:');
        console.log(`
            ALTER TABLE dprs ADD COLUMN IF NOT EXISTS dpr_url TEXT; 
            ALTER TABLE dprs ADD COLUMN IF NOT EXISTS guest_name TEXT; 
            ALTER TABLE dprs ADD COLUMN IF NOT EXISTS guest_email TEXT; 
            ALTER TABLE dprs ADD COLUMN IF NOT EXISTS guest_phone TEXT;
        `);
    } else {
        console.log('Migration status: Table seems ready or had a different error.', error?.message);
    }
}

migrateDPR();
