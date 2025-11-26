// Script to create a user account
// Usage: node create-user.js <username> <email> <password>

require('dotenv').config();
const auth = require('./auth');

async function createUser(username, email, password) {
    try {
        console.log(`Creating user account...`);
        console.log(`Username: ${username}`);
        console.log(`Email: ${email}`);

        const result = await auth.registerUser(username, email, password);

        if (result.success) {
            console.log(`✅ User account created successfully!`);
            console.log(`   User ID: ${result.user.id}`);
            console.log(`   Username: ${result.user.username}`);
            console.log(`   Email: ${result.user.email}`);
            console.log(`   Verified: ${result.user.isVerified}`);

            if (result.verificationToken) {
                console.log(`\n📧 Verification token: ${result.verificationToken}`);
                console.log(`   (Email may not have been sent if email is not configured)`);
            }
        } else {
            console.log(`❌ Failed to create user: ${result.error}`);
            process.exit(1);
        }
    } catch (error) {
        console.error('❌ Error creating user:', error.message);
        process.exit(1);
    } finally {
        await auth.pool.end();
    }
}

// Get credentials from command line arguments
const username = process.argv[2];
const email = process.argv[3];
const password = process.argv[4];

if (!username || !email || !password) {
    console.log('Usage: node create-user.js <username> <email> <password>');
    console.log('Example: node create-user.js john john@example.com mypassword123');
    process.exit(1);
}

createUser(username, email, password);
