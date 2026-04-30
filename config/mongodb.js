const mongoose = require('mongoose');
const Job = require('../models/jobModel');

/**
 * Connect to MongoDB with optimized settings and non-blocking seeding.
 */
const connectDB = async () => {
  try {
    const uri = process.env.MONGODB_URI;
    
    if (!uri) {
      console.warn('MONGODB_URI is not defined. Falling back to localhost.');
    }

    const conn = await mongoose.connect(uri || 'mongodb://localhost:27017/dclubfarmers');
    console.log(`MongoDB Connected: ${conn.connection.host}`);

    // Run seeding in the background to avoid blocking the main thread/startup
    seedSystemData().catch(err => console.error('Seeding failed:', err));

  } catch (error) {
    console.error(`CRITICAL: MongoDB Connection Error: ${error.message}`);
    // On Vercel, we don't process.exit(1) so the app can still serve 
    // static assets or return a proper "Database Down" JSON response.
  }
};

/**
 * Seeds necessary system records if they are missing.
 */
async function seedSystemData() {
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
    // We use a simple check to see if the system jobs exist
    const exists = await Job.exists({ title: jobData.title });
    if (!exists) {
      await Job.create(jobData);
      console.log(`Seeded system record: ${jobData.title}`);
    }
  }
}

module.exports = connectDB;
