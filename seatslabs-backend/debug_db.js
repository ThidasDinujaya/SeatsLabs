const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
});

async function debug() {
    try {
        console.log(`Connecting to ${process.env.DB_NAME}...`);
        const res = await pool.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public'
            ORDER BY table_name;
        `);
        console.log("Tables found:", res.rows.map(r => r.table_name));
        
        // Also check columns for TimeSlots
        const cols = await pool.query(`
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'TimeSlots';
        `);
        console.log("Columns in TimeSlots:", cols.rows.map(r => r.column_name));
        
    } catch (err) {
        console.error("Debug error:", err);
    } finally {
        pool.end();
    }
}

debug();
