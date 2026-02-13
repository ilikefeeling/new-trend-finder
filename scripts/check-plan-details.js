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
            const value = match[2].trim().replace(/^"(.*)"$/, '$1');
            env[key] = value;
        }
    });
} catch (e) {
    console.error('Error reading .env.local:', e.message);
    process.exit(1);
}

const clientId = env.NEXT_PUBLIC_PAYPAL_CLIENT_ID;
const clientSecret = env.PAYPAL_CLIENT_SECRET;
const isLive = env.PAYPAL_MODE === 'live';
const hostname = isLive ? 'api-m.paypal.com' : 'api-m.sandbox.paypal.com';

const planIds = {
    'Pro Monthly': env.NEXT_PUBLIC_PAYPAL_PLAN_ID_PRO_MONTHLY,
    'Pro Annual': env.NEXT_PUBLIC_PAYPAL_PLAN_ID_PRO_ANNUAL,
    'Enterprise Monthly': env.NEXT_PUBLIC_PAYPAL_PLAN_ID_ENTERPRISE_MONTHLY,
    'Enterprise Annual': env.NEXT_PUBLIC_PAYPAL_PLAN_ID_ENTERPRISE_ANNUAL,
};

function getAccessToken() {
    return new Promise((resolve, reject) => {
        const auth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
        const options = {
            hostname,
            path: '/v1/oauth2/token',
            method: 'POST',
            headers: {
                'Authorization': `Basic ${auth}`,
                'Content-Type': 'application/x-www-form-urlencoded'
            }
        };

        const req = https.request(options, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                if (res.statusCode === 200) {
                    resolve(JSON.parse(data).access_token);
                } else {
                    reject(new Error(`Auth failed: ${res.statusCode} ${data}`));
                }
            });
        });
        req.write('grant_type=client_credentials');
        req.end();
    });
}

function getPlanDetails(token, planId) {
    return new Promise((resolve) => {
        if (!planId) return resolve(null);

        const options = {
            hostname,
            path: `/v1/billing/plans/${planId}`,
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        };

        const req = https.request(options, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                if (res.statusCode === 200) {
                    resolve(JSON.parse(data));
                } else {
                    console.error(`Failed to fetch plan ${planId}: ${res.statusCode}`);
                    resolve(null);
                }
            });
        });
        req.end();
    });
}

(async () => {
    try {
        console.log(`Checking Plans in ${isLive ? 'LIVE' : 'SANDBOX'} mode...`);
        const token = await getAccessToken();
        console.log('Access Token obtained.\n');

        for (const [name, id] of Object.entries(planIds)) {
            console.log(`Fetching: ${name} (${id})...`);
            const plan = await getPlanDetails(token, id);

            if (plan) {
                console.log(`Hit Info:`);
                if (plan.billing_cycles) {
                    plan.billing_cycles.forEach(cycle => {
                        console.log(`  - Frequency: ${cycle.frequency.interval_unit} (Count: ${cycle.frequency.interval_count})`);
                        console.log(`  - Pricing: ${cycle.pricing_scheme.fixed_price.value} ${cycle.pricing_scheme.fixed_price.currency_code}`);
                        console.log(`  - Tenure: ${cycle.tenure_type}`);
                    });
                }
                console.log(`  Status: ${plan.status}`);
            } else {
                console.log('  ❌ Plan not found or invalid.');
            }
            console.log('---------------------------------------------------');
        }

    } catch (error) {
        console.error('Error:', error.message);
    }
})();
