const mongoose = require('mongoose');
require('dotenv').config({ override: true });
const Job = require('../models/jobModel');

const connectDB = async () => {
  try {
    const uri = process.env.MONGODB_URI;
    console.log(`Connecting to MongoDB: ${uri ? uri.replace(/\/\/.*@/, '//****:****@') : 'UNDEFINED'}`);
    const conn = await mongoose.connect(uri || 'mongodb://localhost:27017/dclubfarmers');
    console.log(`MongoDB Connected: ${conn.connection.host}`);

    // Seed required jobs if they don't exist
    const requiredJobs = [
        { 
            title: 'General Talent Pool', 
            description: 'Apply here to be considered for future opportunities that match your skills.',
            company: 'DJAIRINDIA PVT LTD',
            location: 'Remote',
            job_type: 'Full-time'
        },
        {
            title: 'Dream Achiever Program',
            description: 'Elite incubation program for high-impact agricultural visionaries.',
            company: 'DJAIRINDIA PVT LTD',
            location: 'Remote',
            job_type: 'Elite'
        }
    ];

    for (const jobData of requiredJobs) {
        const exists = await Job.findOne({ title: jobData.title });
        if (!exists) {
            await Job.create(jobData);
            console.log(`Seeded system job: ${jobData.title}`);
        }
    }

  } catch (error) {
    console.error(`MongoDB Connection Error: ${error.message}`);
    // Don't exit process, let the application handle the disconnected state
  }
};

module.exports = connectDB;
