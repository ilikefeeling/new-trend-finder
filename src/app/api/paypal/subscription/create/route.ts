import { NextRequest, NextResponse } from 'next/server';

const PAYPAL_API_BASE = process.env.PAYPAL_MODE === 'live'
    ? 'https://api-m.paypal.com'
    : 'https://api-m.sandbox.paypal.com';

const PAYPAL_CLIENT_ID = process.env.PAYPAL_CLIENT_ID;
const PAYPAL_CLIENT_SECRET = process.env.PAYPAL_CLIENT_SECRET;

// Get PayPal access token
async function getAccessToken() {
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
    return data.access_token;
}

export async function POST(request: NextRequest) {
    try {
        const { planId, userId } = await request.json();

        if (!planId || !userId) {
            return NextResponse.json(
                { error: 'Plan ID and User ID are required' },
                { status: 400 }
            );
        }

        const accessToken = await getAccessToken();

        // Create subscription
        const subscriptionResponse = await fetch(`${PAYPAL_API_BASE}/v1/billing/subscriptions`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                plan_id: planId,
                subscriber: {
                    email_address: request.headers.get('user-email') || '',
                },
                application_context: {
                    brand_name: 'Next Shorts',
                    locale: 'ko-KR',
                    shipping_preference: 'NO_SHIPPING',
                    user_action: 'SUBSCRIBE_NOW',
                    payment_method: {
                        payer_selected: 'PAYPAL',
                        payee_preferred: 'IMMEDIATE_PAYMENT_REQUIRED',
                    },
                    return_url: `${process.env.NEXT_PUBLIC_APP_URL}/api/paypal/subscription/success?userId=${userId}`,
                    cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/pricing?canceled=true`,
                },
                custom_id: userId, // Store user ID for webhook processing
            }),
        });

        if (!subscriptionResponse.ok) {
            const error = await subscriptionResponse.json();
            console.error('PayPal subscription creation failed:', error);
            return NextResponse.json(
                { error: 'Failed to create subscription', details: error },
                { status: 500 }
            );
        }

        const subscription = await subscriptionResponse.json();

        return NextResponse.json({
            subscriptionId: subscription.id,
            approvalUrl: subscription.links.find((link: any) => link.rel === 'approve')?.href,
        });
    } catch (error) {
        console.error('Error creating PayPal subscription:', error);
        return NextResponse.json(
            { error: 'Internal server error', details: error },
            { status: 500 }
        );
    }
}
