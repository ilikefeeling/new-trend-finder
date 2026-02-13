const https = require('https');
const fs = require('fs');
const path = require('path');

// Manually parse .env.local
let env = {};
try {
    const envPath = path.resolve(__dirname, '../.env.local');
    const envContent = fs.readFileSync(envPath, 'utf8');
    envContent.split('\n').forEach(line => {
        const match = line.match(/^([^=]+)=(.*)$/);
        if (match) {
            const key = match[1].trim();
            const value = match[2].trim().replace(/^"(.*)"$/, '$1'); // Remove quotes if present
            env[key] = value;
        }
    });
} catch (e) {
    console.error('Error reading .env.local:', e.message);
    process.exit(1);
}

const clientId = env.NEXT_PUBLIC_PAYPAL_CLIENT_ID;
const clientSecret = env.PAYPAL_CLIENT_SECRET;

if (!clientId || !clientSecret) {
    console.error('Error: NEXT_PUBLIC_PAYPAL_CLIENT_ID or PAYPAL_CLIENT_SECRET not found in .env.local');
    console.log('Found keys:', Object.keys(env));
    process.exit(1);
}

const environments = [
    { name: 'Sandbox', host: 'api-m.sandbox.paypal.com' },
    { name: 'Live', host: 'api-m.paypal.com' }
];

function testAuth(targetEnv) {
    return new Promise((resolve) => {
        const auth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
        const options = {
            hostname: targetEnv.host,
            path: '/v1/oauth2/token',
            method: 'POST',
            headers: {
                'Authorization': `Basic ${auth}`,
                'Content-Type': 'application/x-www-form-urlencoded'
            }
        };

        const req = https.request(options, (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => {
                if (res.statusCode === 200) {
                    console.log(`✅ [${targetEnv.name}] Authentication SUCCESS!`);
                    resolve(true);
                } else {
                    console.log(`❌ [${targetEnv.name}] Authentication FAILED (Status: ${res.statusCode})`);
                    try {
                        const json = JSON.parse(data);
                        console.log(`   Error: ${json.error} - ${json.error_description}`);
                    } catch (e) {
                        console.log(`   Response: ${data}`);
                    }
                    resolve(false);
                }
            });
        });

        req.on('error', (e) => {
            console.error(`❌ [${targetEnv.name}] Request Error: ${e.message}`);
            resolve(false);
        });

        req.write('grant_type=client_credentials');
        req.end();
    });
}

(async () => {
    console.log(`Testing Credentials (Client ID starts with: ${clientId.substring(0, 5)}...)`);
    console.log('---------------------------------------------------');
    await testAuth(environments[0]);
    await testAuth(environments[1]);
    console.log('---------------------------------------------------');
})();
