const fs = require('fs');
const path = require('path');
const { promisePool } = require('../database/db');
/**
 * Migration Runner Script
 * This script reads the init_db.sql file and executes the queries against the database.
 */
const runMigration = async () => {
    try {
        console.log('--- Starting Database Migration ---');
        
        // Get all SQL files in the migration directory
        const files = fs.readdirSync(__dirname)
            .filter(file => file.endsWith('.sql'))
            .sort(); // Run in alphabetical order
        console.log(`Found ${files.length} migration files.`);
        for (const file of files) {
            console.log(`\nExecuting migration: ${file}`);
            const sqlPath = path.join(__dirname, file);
            const sql = fs.readFileSync(sqlPath, 'utf8');
            
            const queries = sql
                .split(';')
                .map(query => query.trim())
                .filter(query => query.length > 0);
            for (let i = 0; i < queries.length; i++) {
                const query = queries[i];
                try {
                    await promisePool.query(query);
                    // console.log(`[SUCCESS] Query ${i + 1} executed.`);
                } catch (err) {
                    console.error(`[ERROR] In ${file}, Query ${i + 1}:`, err.message);
                }
            }
            console.log(`Completed migration: ${file}`);
        }
        console.log('\n--- All Migrations Finished ---');
        process.exit(0);
    } catch (error) {
        console.error('Migration failed:', error.message);
        process.exit(1);
    }
};
runMigration();