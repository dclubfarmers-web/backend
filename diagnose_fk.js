const supabase = require('./config/db');

async function testGuestInsert() {
    console.log('Attempting Guest Insert (No applicant_id)...');
    
    // We need a valid job_id to test this
    const { data: jobs } = await supabase.from('jobs').select('id').limit(1);
    if (!jobs || jobs.length === 0) {
        console.error('No jobs found to test with. Create a job first.');
        return;
    }
    
    const jobId = jobs[0].id;
    const { data, error } = await supabase.from('applications').insert([{
        job_id: jobId,
        resume_url: 'http://test-resume.com',
        status: 'applied'
        // applicant_id is omitted
    }]).select();

    if (error) {
        console.error('DATABASE REJECTED GUEST INSERT:', error.message);
        console.error('Error Code:', error.code);
        console.error('Detail:', error.detail);
    } else {
        console.log('SUCCESS: Database accepted Guest Insert.');
    }
}

testGuestInsert();
