import { NextRequest, NextResponse } from 'next/server';
import { createPlan } from '@/lib/paypal';

export async function POST(request: NextRequest) {
    try {
        const { productId, name, description, price, intervalUnit, intervalCount } = await request.json();

        if (!productId || !name || !price || !intervalUnit) {
            return NextResponse.json(
                { error: 'Missing required fields: productId, name, price, intervalUnit' },
                { status: 400 }
            );
        }

        const planId = await createPlan(productId, name, description || '', Number(price), intervalUnit, intervalCount || 1);

        return NextResponse.json({ planId });
    } catch (error) {
        console.error('Error creating PayPal plan:', error);
        return NextResponse.json(
            { error: 'Failed to create plan', details: (error as Error).message },
            { status: 500 }
        );
    }
}
