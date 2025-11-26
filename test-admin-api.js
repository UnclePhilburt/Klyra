// Test the admin API endpoints
const http = require('http');

async function testProfileEndpoint() {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: 'localhost',
            port: 3001,
            path: '/auth/profile/9',
            method: 'GET'
        };

        const req = http.request(options, (res) => {
            let data = '';
            res.on('data', (chunk) => {
                data += chunk;
            });
            res.on('end', () => {
                console.log('\n=== Testing /auth/profile/9 ===');
                console.log('Status:', res.statusCode);
                console.log('Response:', JSON.parse(data));
                resolve();
            });
        });

        req.on('error', (e) => {
            console.error('Error:', e.message);
            reject(e);
        });

        req.end();
    });
}

async function testLogin() {
    return new Promise((resolve, reject) => {
        const postData = JSON.stringify({
            usernameOrEmail: 'AtlasSecurity',
            password: 'CatsAreCool2931!'
        });

        const options = {
            hostname: 'localhost',
            port: 3001,
            path: '/auth/login',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(postData)
            }
        };

        const req = http.request(options, (res) => {
            let data = '';
            res.on('data', (chunk) => {
                data += chunk;
            });
            res.on('end', () => {
                console.log('\n=== Testing /auth/login ===');
                console.log('Status:', res.statusCode);
                const response = JSON.parse(data);
                console.log('Response:', response);
                console.log('User object:', response.user);
                console.log('isAdmin in response:', response.user?.isAdmin);
                resolve();
            });
        });

        req.on('error', (e) => {
            console.error('Error:', e.message);
            reject(e);
        });

        req.write(postData);
        req.end();
    });
}

async function run() {
    try {
        await testProfileEndpoint();
        await testLogin();
    } catch (error) {
        console.error('Test failed:', error);
    }
}

run();
