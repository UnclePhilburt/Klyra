// Test login for existing accounts
require('dotenv').config();
const auth = require('./auth.js');

async function testLogin() {
    console.log('🔐 Testing login functionality...\n');

    // Test with one of the accounts
    const testUsername = 'StepBetty';
    const testPassword = prompt('Enter the password you used for StepBetty account: ');

    console.log(`\nAttempting login for: ${testUsername}`);
    console.log(`Password length: ${testPassword.length} characters\n`);

    const result = await auth.loginUser(testUsername, testPassword);

    console.log('Login result:', JSON.stringify(result, null, 2));

    await auth.pool.end();
    process.exit(0);
}

// Since Node.js doesn't have prompt, let's just check the database structure
async function checkPasswordHashes() {
    console.log('🔍 Checking password hashes in database...\n');

    const result = await auth.pool.query('SELECT id, username, email, password_hash, LENGTH(password_hash) as hash_length FROM users ORDER BY created_at DESC LIMIT 3');

    console.log('Recent users:');
    result.rows.forEach(user => {
        console.log(`\nID: ${user.id}`);
        console.log(`Username: ${user.username}`);
        console.log(`Email: ${user.email}`);
        console.log(`Password hash: ${user.password_hash}`);
        console.log(`Hash length: ${user.hash_length}`);
        console.log(`Hash starts with: ${user.password_hash.substring(0, 7)} (should be "$2b$10$" for bcrypt)`);
    });

    await auth.pool.end();
    process.exit(0);
}

checkPasswordHashes().catch(console.error);
