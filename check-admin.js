// Check if a user is an admin
require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

const username = process.argv[2] || 'AtlasSecurity';

pool.query('SELECT id, username, email, is_admin FROM users WHERE username = $1', [username])
    .then(result => {
        if (result.rows.length > 0) {
            const user = result.rows[0];
            console.log('User found:');
            console.log('  ID:', user.id);
            console.log('  Username:', user.username);
            console.log('  Email:', user.email);
            console.log('  Is Admin:', user.is_admin);
        } else {
            console.log('User not found:', username);
        }
        pool.end();
    })
    .catch(err => {
        console.error('Error:', err.message);
        pool.end();
    });
