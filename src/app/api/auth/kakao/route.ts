import { NextRequest, NextResponse } from 'next/server';
import admin from '@/lib/firebase-admin';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
    try {
        const { accessToken } = await request.json();

        if (!accessToken) {
            return NextResponse.json(
                { error: 'Access token is required' },
                { status: 400 }
            );
        }

        // Get Kakao user info
        const kakaoResponse = await fetch('https://kapi.kakao.com/v2/user/me', {
            headers: {
                Authorization: `Bearer ${accessToken}`,
            },
        });

        if (!kakaoResponse.ok) {
            throw new Error('Failed to fetch Kakao user info');
        }

        const kakaoUser = await kakaoResponse.json();

        // Extract user information
        const uid = `kakao_${kakaoUser.id}`;
        const email = kakaoUser.kakao_account?.email || `${kakaoUser.id}@kakao.user`;
        const displayName = kakaoUser.kakao_account?.profile?.nickname || 'Kakao User';
        const photoURL = kakaoUser.kakao_account?.profile?.profile_image_url || null;

        // Create or update Firebase user
        let firebaseUser;
        try {
            firebaseUser = await admin.auth().getUser(uid);
        } catch (error) {
            // User doesn't exist, create new user
            firebaseUser = await admin.auth().createUser({
                uid,
                email,
                displayName,
                photoURL,
                emailVerified: kakaoUser.kakao_account?.is_email_verified || false,
            });
        }

        // Set custom claims (can be used for role-based access)
        await admin.auth().setCustomUserClaims(uid, {
            provider: 'kakao',
        });

        // Create Firebase custom token
        const customToken = await admin.auth().createCustomToken(uid);

        return NextResponse.json({
            customToken,
            user: {
                uid: firebaseUser.uid,
                email: firebaseUser.email,
                displayName: firebaseUser.displayName,
                photoURL: firebaseUser.photoURL,
            },
        });
    } catch (error) {
        console.error('Kakao auth error:', error);
        return NextResponse.json(
            { error: 'Authentication failed', details: error },
            { status: 500 }
        );
    }
}
