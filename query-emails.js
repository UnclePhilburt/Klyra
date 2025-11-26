// Query all emails from the database
require('dotenv').config();
const { Pool } = require('pg');

// Create connection pool with flexible SSL config
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DATABASE_URL?.includes('render') ? {
        rejectUnauthorized: false
    } : false
});

async function getAllEmails() {
    try {
        console.log('🔍 Querying all emails from database...\n');

        const result = await pool.query(`
            SELECT
                id,
                username,
                email,
                is_verified,
                created_at,
                last_login
            FROM users
            ORDER BY created_at DESC
        `);

        console.log(`Found ${result.rows.length} users:\n`);
        console.log('ID | Username | Email | Verified | Created At | Last Login');
        console.log('-'.repeat(100));

        result.rows.forEach(user => {
            console.log(
                `${user.id} | ${user.username} | ${user.email} | ${user.is_verified ? 'Yes' : 'No'} | ${user.created_at} | ${user.last_login || 'Never'}`
            );
        });

        console.log('\n' + '='.repeat(100));
        console.log(`\nTotal users: ${result.rows.length}`);
        console.log(`Verified: ${result.rows.filter(u => u.is_verified).length}`);
        console.log(`Unverified: ${result.rows.filter(u => !u.is_verified).length}`);

        // List just the emails
        console.log('\n📧 Email addresses only:');
        result.rows.forEach(user => {
            console.log(`  - ${user.email}`);
        });

        await pool.end();
        process.exit(0);
    } catch (error) {
        console.error('❌ Error querying emails:', error);
        await pool.end();
        process.exit(1);
    }
}

getAllEmails();
