const Job = require('./models/jobModel');

async function test() {
    try {
        const jobs = await Job.findAll();
        console.log('Jobs found:', jobs.length);
    } catch (err) {
        console.error('ERROR FETCHING JOBS:', err);
    }
}

test();
