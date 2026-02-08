const pool = require('./config/database');
const fs = require('fs');
const path = require('path');

const seedDatabase = async () => {
    try {
        const seedPath = path.join(__dirname, 'database', 'seeds', '001_seed_initial_data.sql');
        const sql = fs.readFileSync(seedPath, 'utf8');

        console.log('🌱 Starting database seeding...');
        await pool.query(sql);
        console.log('✅ Database seeded successfully!');
        process.exit(0);
    } catch (error) {
        console.error('❌ Error seeding database:', error);
        process.exit(1);
    }
};

seedDatabase();
