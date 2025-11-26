// Reset password for a user
require('dotenv').config();
const bcrypt = require('bcrypt');
const { pool } = require('./auth.js');

async function resetPassword() {
    const email = 'Law41497@gmail.com';
    const newPassword = 'newpassword123'; // Change this to whatever you want

    console.log(`🔐 Resetting password for: ${email}\n`);

    try {
        // Hash the new password
        const passwordHash = await bcrypt.hash(newPassword, 10);

        // Update in database
        const result = await pool.query(
            'UPDATE users SET password_hash = $1 WHERE email = $2 RETURNING username, email',
            [passwordHash, email]
        );

        if (result.rows.length > 0) {
            console.log('✅ Password reset successful!');
            console.log(`Username: ${result.rows[0].username}`);
            console.log(`Email: ${result.rows[0].email}`);
            console.log(`New password: ${newPassword}`);
        } else {
            console.log('❌ User not found with that email');
        }
    } catch (error) {
        console.error('❌ Error resetting password:', error);
    }

    await pool.end();
    process.exit(0);
}

resetPassword();
