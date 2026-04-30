const mongoose = require('mongoose');
require('dns').setServers(['8.8.8.8', '8.8.4.4']);
require('dotenv').config({ override: true });
const Job = require('./models/jobModel');

const cleanup = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        const jobs = await Job.find({ title: { $in: ['General Talent Pool', 'Dream Achiever Program'] } });
        const seen = new Set();
        for (const job of jobs) {
            if (seen.has(job.title)) {
                await Job.findByIdAndDelete(job._id);
                console.log('Deleted duplicate:', job.title, job._id);
            } else {
                seen.add(job.title);
            }
        }
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

cleanup();
