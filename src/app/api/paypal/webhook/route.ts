import { NextRequest, NextResponse } from 'next/server';
import admin from '@/lib/firebase-admin';

export const dynamic = 'force-dynamic';

const PAYPAL_WEBHOOK_ID = process.env.PAYPAL_WEBHOOK_ID;

export async function POST(request: NextRequest) {
    try {
        const webhookEvent = await request.json();
        const eventType = webhookEvent.event_type;
        const resource = webhookEvent.resource;

        console.log('PayPal Webhook Event:', eventType);

        switch (eventType) {
            case 'BILLING.SUBSCRIPTION.ACTIVATED':
                await handleSubscriptionActivated(resource);
                break;
            case 'BILLING.SUBSCRIPTION.CANCELLED':
                await handleSubscriptionCancelled(resource);
                break;
            case 'BILLING.SUBSCRIPTION.SUSPENDED':
                await handleSubscriptionSuspended(resource);
                break;
            case 'BILLING.SUBSCRIPTION.EXPIRED':
                await handleSubscriptionExpired(resource);
                break;
            case 'PAYMENT.SALE.COMPLETED':
                await handlePaymentCompleted(resource);
                break;
            default:
                console.log('Unhandled webhook event type:', eventType);
        }

        return NextResponse.json({ received: true });
    } catch (error) {
        console.error('Webhook processing error:', error);
        return NextResponse.json(
            { error: 'Webhook processing failed' },
            { status: 500 }
        );
    }
}

async function handleSubscriptionActivated(resource: any) {
    const userId = resource.custom_id;
    const subscriptionId = resource.id;

    if (!userId) return;

    await admin.firestore().collection('users').doc(userId).update({
        'subscription.status': 'active',
        'subscription.paypal_subscription_id': subscriptionId,
        'subscription.started_at': admin.firestore.FieldValue.serverTimestamp(),
        'subscription.auto_renew': true,
    });

    await admin.firestore().collection('transactions').add({
        user_id: userId,
        type: 'subscription_activated',
        paypal_subscription_id: subscriptionId,
        created_at: admin.firestore.FieldValue.serverTimestamp(),
    });
}

async function handleSubscriptionCancelled(resource: any) {
    const userId = resource.custom_id;

    if (!userId) return;

    await admin.firestore().collection('users').doc(userId).update({
        'subscription.status': 'canceled',
        'subscription.auto_renew': false,
    });

    await admin.firestore().collection('transactions').add({
        user_id: userId,
        type: 'subscription_cancelled',
        paypal_subscription_id: resource.id,
        created_at: admin.firestore.FieldValue.serverTimestamp(),
    });
}

async function handleSubscriptionSuspended(resource: any) {
    const userId = resource.custom_id;

    if (!userId) return;

    await admin.firestore().collection('users').doc(userId).update({
        'subscription.status': 'suspended',
    });
}

async function handleSubscriptionExpired(resource: any) {
    const userId = resource.custom_id;

    if (!userId) return;

    await admin.firestore().collection('users').doc(userId).update({
        'subscription.status': 'expired',
        'subscription.tier': 'free',
    });
}

async function handlePaymentCompleted(resource: any) {
    const billingAgreementId = resource.billing_agreement_id;

    await admin.firestore().collection('transactions').add({
        type: 'payment_completed',
        paypal_transaction_id: resource.id,
        billing_agreement_id: billingAgreementId,
        amount: resource.amount.total,
        currency: resource.amount.currency,
        created_at: admin.firestore.FieldValue.serverTimestamp(),
    });
}
