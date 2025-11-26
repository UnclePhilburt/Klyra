// Initialize database tables
require('dotenv').config();
const auth = require('./auth.js');
const database = require('./database.js');

async function initializeTables() {
    try {
        console.log('🔧 Initializing database tables...\n');

        // Initialize database tables (player_stats)
        await database.initDatabase();

        // Initialize users table
        await auth.initUsersTable();

        console.log('\n✅ All database tables initialized successfully!');

        await database.pool.end();
        await auth.pool.end();
        process.exit(0);
    } catch (error) {
        console.error('❌ Failed to initialize database:', error);
        process.exit(1);
    }
}

initializeTables();
