import { NextRequest, NextResponse } from 'next/server';
import { createProduct } from '@/lib/paypal';

export async function POST(request: NextRequest) {
    try {
        const { name, description } = await request.json();

        if (!name) {
            return NextResponse.json(
                { error: 'Product name is required' },
                { status: 400 }
            );
        }

        const productId = await createProduct(name, description || 'Subscription Product');

        return NextResponse.json({ productId });
    } catch (error) {
        console.error('Error creating PayPal product:', error);
        return NextResponse.json(
            { error: 'Failed to create product', details: (error as Error).message },
            { status: 500 }
        );
    }
}
