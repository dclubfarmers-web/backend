
const supabase = require('./config/db');

async function checkJobs() {
    const { data, error } = await supabase.from('jobs').select('*');
    if (error) {
        console.error('Error fetching jobs:', error);
        return;
    }
    console.log('Jobs in DB:', data);
}

checkJobs();
