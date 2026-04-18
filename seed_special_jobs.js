
const supabase = require('./config/db');

async function seedSpecialJobs() {
    const specialJobs = [
        {
            id: '00000000-0000-0000-0000-000000000001',
            title: 'Dream Achiever Program',
            description: 'Elite program for exceptional talent in agriculture, technology, and management.',
            company: 'DJAIRINDIA ECOSYSTEM',
            salary: 'Uncapped',
            location: 'Remote / Field',
            job_type: 'Elite'
        },
        {
            id: '00000000-0000-0000-0000-000000000002',
            title: 'General Talent Pool',
            description: 'Generic submission for future opportunities.',
            company: 'DJAIRINDIA ECOSYSTEM',
            salary: 'Competitive',
            location: 'Pan India',
            job_type: 'General'
        }
    ];

    for (const job of specialJobs) {
        const { data, error } = await supabase.from('jobs').upsert([job], { onConflict: 'id' });
        if (error) console.error(`Error seeding ${job.title}:`, error);
        else console.log(`Seeded ${job.title}`);
    }
}

seedSpecialJobs();
