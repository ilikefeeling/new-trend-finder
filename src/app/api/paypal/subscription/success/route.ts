import { NextRequest, NextResponse } from 'next/server';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { firestore } from '@/lib/firebase.config';

export async function GET(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams;
        const subscriptionId = searchParams.get('subscription_id');
        const userId = searchParams.get('userId');

        if (!subscriptionId || !userId) {
            return NextResponse.redirect(
                new URL('/pricing?error=missing_params', request.url)
            );
        }

        // Update user's subscription in Firestore
        const userRef = doc(firestore, 'users', userId);

        // You should verify the subscription with PayPal API here
        // For now, we'll update optimistically

        await updateDoc(userRef, {
            'subscription.tier': 'pro', // or 'enterprise' based on plan
            'subscription.status': 'active',
            'subscription.started_at': serverTimestamp(),
            'subscription.paypal_subscription_id': subscriptionId,
            'subscription.auto_renew': true,
        });

        // Redirect to success page
        return NextResponse.redirect(
            new URL('/pricing?success=true', request.url)
        );
    } catch (error) {
        console.error('Error processing subscription success:', error);
        return NextResponse.redirect(
            new URL('/pricing?error=processing_failed', request.url)
        );
    }
}
