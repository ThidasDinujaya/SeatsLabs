const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const DB_CONFIG = {
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT || 5432,
};

const SQL_FILE_PATH = path.join(__dirname, 'database', 'database.sql');
const SEED_FILE_PATH = path.join(__dirname, 'database', 'seeds', '001_seed_initial_data.sql');

async function setup() {
    console.log('🚀 Starting Database Setup...');

    // 1. Connect to default 'postgres' database to create the new DB
    const rootPool = new Pool({ ...DB_CONFIG, database: 'postgres' });
    
    try {
        const sqlContent = fs.readFileSync(SQL_FILE_PATH, 'utf8');
        
        // Extract Database creation part
        // We look for "CREATE DATABASE" and execute it safely
        console.log('🔨 Recreating database "SeatsLabsDB"...');
        
        // Force disconnect any other clients
        await rootPool.query(`
            SELECT pg_terminate_backend(pid)
            FROM pg_stat_activity
            WHERE datname = 'SeatsLabsDB'
            AND pid <> pg_backend_pid();
        `);

        await rootPool.query('DROP DATABASE IF EXISTS "SeatsLabsDB";');
        await rootPool.query('CREATE DATABASE "SeatsLabsDB";');
        console.log('✅ Database "SeatsLabsDB" created.');
        
    } catch (err) {
        console.error('❌ Error creating database:', err.message);
        process.exit(1);
    } finally {
        await rootPool.end();
    }

    // 2. Connect to the new 'SeatsLabsDB' to create tables
    const dbPool = new Pool({ ...DB_CONFIG, database: 'SeatsLabsDB' });
    
    try {
        console.log('🏗️  Creating tables...');
        let sqlContent = fs.readFileSync(SQL_FILE_PATH, 'utf8');
        
        // Remove the CREATE DATABASE part and \c command to avoid errors in pg driver
        // Matches everything up to "CREATE TABLE" or "-- User Management"
        // Heuristic: Split by string, taking the part after the connection command or just finding the first CREATE TABLE
        
        // Safer: Just strip lines starting with DROP DATABASE, CREATE DATABASE, \c
        const lines = sqlContent.split('\n');
        const filteredLines = lines.filter(line => 
            !line.trim().toUpperCase().startsWith('DROP DATABASE') &&
            !line.trim().toUpperCase().startsWith('CREATE DATABASE') &&
            !line.trim().startsWith('\\c')
        );
        const tableSql = filteredLines.join('\n');

        await dbPool.query(tableSql);
        console.log('✅ Tables created successfully.');

        // 3. Run Seeds
        if (fs.existsSync(SEED_FILE_PATH)) {
            console.log('🌱 Seeding data...');
            const seedSql = fs.readFileSync(SEED_FILE_PATH, 'utf8');
            await dbPool.query(seedSql);
            console.log('✅ Data seeded successfully.');
        }

    } catch (err) {
        console.error('❌ Error creating tables/seeds:', err);
        process.exit(1);
    } finally {
        await dbPool.end();
    }

    console.log('🎉 Setup complete! You can now start the backend.');
}

setup();
