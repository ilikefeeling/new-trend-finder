import { NextRequest, NextResponse } from 'next/server';
import { doc, updateDoc, serverTimestamp, addDoc, collection } from 'firebase/firestore';
import { firestore } from '@/lib/firebase.config';

const PAYPAL_WEBHOOK_ID = process.env.PAYPAL_WEBHOOK_ID;

export async function POST(request: NextRequest) {
    try {
        const webhookEvent = await request.json();

        // Verify webhook signature (implement PayPal webhook verification)
        // For production, you MUST verify the webhook signature
        // See: https://developer.paypal.com/docs/api/webhooks/v1/#verify-webhook-signature

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
    const userId = resource.custom_id; // We stored user ID in custom_id
    const subscriptionId = resource.id;

    if (!userId) return;

    const userRef = doc(firestore, 'users', userId);

    await updateDoc(userRef, {
        'subscription.status': 'active',
        'subscription.paypal_subscription_id': subscriptionId,
        'subscription.started_at': serverTimestamp(),
        'subscription.auto_renew': true,
    });

    // Log transaction
    await addDoc(collection(firestore, 'transactions'), {
        user_id: userId,
        type: 'subscription_activated',
        paypal_subscription_id: subscriptionId,
        created_at: serverTimestamp(),
    });
}

async function handleSubscriptionCancelled(resource: any) {
    const userId = resource.custom_id;

    if (!userId) return;

    const userRef = doc(firestore, 'users', userId);

    await updateDoc(userRef, {
        'subscription.status': 'canceled',
        'subscription.auto_renew': false,
    });

    await addDoc(collection(firestore, 'transactions'), {
        user_id: userId,
        type: 'subscription_cancelled',
        paypal_subscription_id: resource.id,
        created_at: serverTimestamp(),
    });
}

async function handleSubscriptionSuspended(resource: any) {
    const userId = resource.custom_id;

    if (!userId) return;

    const userRef = doc(firestore, 'users', userId);

    await updateDoc(userRef, {
        'subscription.status': 'suspended',
    });
}

async function handleSubscriptionExpired(resource: any) {
    const userId = resource.custom_id;

    if (!userId) return;

    const userRef = doc(firestore, 'users', userId);

    await updateDoc(userRef, {
        'subscription.status': 'expired',
        'subscription.tier': 'free',
    });
}

async function handlePaymentCompleted(resource: any) {
    // Log successful payment
    const billingAgreementId = resource.billing_agreement_id;

    await addDoc(collection(firestore, 'transactions'), {
        type: 'payment_completed',
        paypal_transaction_id: resource.id,
        billing_agreement_id: billingAgreementId,
        amount: resource.amount.total,
        currency: resource.amount.currency,
        created_at: serverTimestamp(),
    });
}
