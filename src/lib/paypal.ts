export const PAYPAL_API_BASE = process.env.PAYPAL_MODE === 'live'
    ? 'https://api-m.paypal.com'
    : 'https://api-m.sandbox.paypal.com';

const PAYPAL_CLIENT_ID = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID;
const PAYPAL_CLIENT_SECRET = process.env.PAYPAL_CLIENT_SECRET;

export async function getAccessToken() {
    if (!PAYPAL_CLIENT_ID || !PAYPAL_CLIENT_SECRET) {
        throw new Error('Missing PayPal Credentials in Env');
    }

    const auth = Buffer.from(`${PAYPAL_CLIENT_ID}:${PAYPAL_CLIENT_SECRET}`).toString('base64');

    const response = await fetch(`${PAYPAL_API_BASE}/v1/oauth2/token`, {
        method: 'POST',
        headers: {
            'Authorization': `Basic ${auth}`,
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: 'grant_type=client_credentials',
    });

    const data = await response.json();

    if (!response.ok) {
        console.error('PayPal Access Token Error:', data);
        throw new Error(data.error_description || 'Failed to get access token');
    }

    return data.access_token;
}

export async function createProduct(name: string, description: string) {
    const accessToken = await getAccessToken();
    const response = await fetch(`${PAYPAL_API_BASE}/v1/catalogs/products`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            name,
            description,
            type: 'SERVICE',
            category: 'SOFTWARE'
        }),
    });

    if (!response.ok) {
        const error = await response.json();
        console.error('Create Product Error:', error);
        throw new Error('Failed to create product');
    }

    const data = await response.json();
    return data.id;
}

export async function createPlan(productId: string, name: string, description: string, price: number, intervalUnit: 'MONTH' | 'YEAR', intervalCount: number = 1) {
    const accessToken = await getAccessToken();

    const payload = {
        product_id: productId,
        name: name,
        description: description,
        status: 'ACTIVE',
        billing_cycles: [
            {
                frequency: {
                    interval_unit: intervalUnit,
                    interval_count: intervalCount
                },
                tenure_type: 'REGULAR',
                sequence: 1,
                total_cycles: 0, // Infinite
                pricing_scheme: {
                    fixed_price: {
                        value: price.toString(),
                        currency_code: 'USD'
                    }
                }
            }
        ],
        payment_preferences: {
            auto_bill_outstanding: true,
            setup_fee: {
                value: '0',
                currency_code: 'USD'
            },
            setup_fee_failure_action: 'CONTINUE',
            payment_failure_threshold: 3
        }
    };

    const response = await fetch(`${PAYPAL_API_BASE}/v1/billing/plans`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
    });

    if (!response.ok) {
        const error = await response.json();
        console.error('Create Plan Error:', JSON.stringify(error, null, 2));
        throw new Error(error.message || 'Failed to create plan');
    }

    const data = await response.json();
    return data.id;
}
