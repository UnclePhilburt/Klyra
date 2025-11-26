// Script to promote a user to admin
// Usage: node make-admin.js <username>

require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false
    }
});

async function makeAdmin(username) {
    try {
        // Find user by username
        const userResult = await pool.query(
            'SELECT id, username, email, is_admin FROM users WHERE username = $1',
            [username]
        );

        if (userResult.rows.length === 0) {
            console.log(`❌ User "${username}" not found`);
            process.exit(1);
        }

        const user = userResult.rows[0];

        if (user.is_admin) {
            console.log(`ℹ️  User "${username}" is already an admin`);
            process.exit(0);
        }

        // Promote to admin
        await pool.query(
            'UPDATE users SET is_admin = TRUE WHERE id = $1',
            [user.id]
        );

        console.log(`✅ Successfully promoted "${username}" to admin`);
        console.log(`   Email: ${user.email}`);
        console.log(`   User ID: ${user.id}`);
    } catch (error) {
        console.error('❌ Error promoting user to admin:', error.message);
        process.exit(1);
    } finally {
        await pool.end();
    }
}

// Get username from command line arguments
const username = process.argv[2];

if (!username) {
    console.log('Usage: node make-admin.js <username>');
    console.log('Example: node make-admin.js johndoe');
    process.exit(1);
}

makeAdmin(username);
