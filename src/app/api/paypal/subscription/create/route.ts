import { NextRequest, NextResponse } from 'next/server';
import { getAccessToken, PAYPAL_API_BASE } from '@/lib/paypal';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
    try {
        let { planId, userId } = await request.json();
        planId = planId?.trim();

        if (!planId || !userId) {
            return NextResponse.json(
                { error: 'Plan ID and User ID are required' },
                { status: 400 }
            );
        }

        const accessToken = await getAccessToken();

        const userEmail = request.headers.get('user-email');

        const subscriptionPayload: any = {
            plan_id: planId,
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
        };

        if (userEmail) {
            subscriptionPayload.subscriber = {
                email_address: userEmail,
            };
        }

        // Create subscription
        const subscriptionResponse = await fetch(`${PAYPAL_API_BASE}/v1/billing/subscriptions`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(subscriptionPayload),
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
