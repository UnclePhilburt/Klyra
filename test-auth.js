// Test authentication logic
const bcrypt = require('bcrypt');

async function testPasswordHashing() {
    console.log('🔐 Testing password hashing and comparison...\n');

    const testPassword = 'testpassword123';
    const saltRounds = 10;

    // Hash the password (like during registration)
    console.log(`1️⃣ Hashing password: "${testPassword}"`);
    const hash = await bcrypt.hash(testPassword, saltRounds);
    console.log(`   Hash created: ${hash}\n`);

    // Compare correct password (like during login)
    console.log(`2️⃣ Comparing correct password: "${testPassword}"`);
    const correctMatch = await bcrypt.compare(testPassword, hash);
    console.log(`   Result: ${correctMatch ? '✅ MATCH' : '❌ NO MATCH'}\n`);

    // Compare incorrect password
    console.log(`3️⃣ Comparing incorrect password: "wrongpassword"`);
    const incorrectMatch = await bcrypt.compare('wrongpassword', hash);
    console.log(`   Result: ${incorrectMatch ? '✅ MATCH' : '❌ NO MATCH'}\n`);

    // Test with different password
    const anotherPassword = 'password123';
    console.log(`4️⃣ Hashing another password: "${anotherPassword}"`);
    const anotherHash = await bcrypt.hash(anotherPassword, saltRounds);
    console.log(`   Hash created: ${anotherHash}\n`);

    console.log(`5️⃣ Comparing "${testPassword}" with another hash`);
    const crossMatch = await bcrypt.compare(testPassword, anotherHash);
    console.log(`   Result: ${crossMatch ? '✅ MATCH' : '❌ NO MATCH'}\n`);

    console.log('✅ Password hashing test complete!');
}

testPasswordHashing().catch(console.error);
