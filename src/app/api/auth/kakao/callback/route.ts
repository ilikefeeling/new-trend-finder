import { NextRequest, NextResponse } from 'next/server';
import admin from '@/lib/firebase-admin';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams;
        const code = searchParams.get('code');

        if (!code) {
            return NextResponse.redirect(new URL('/login?error=no_code', request.url));
        }

        // Exchange code for access token
        const tokenResponse = await fetch('https://kauth.kakao.com/oauth/token', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: new URLSearchParams({
                grant_type: 'authorization_code',
                client_id: process.env.NEXT_PUBLIC_KAKAO_CLIENT_ID!,
                redirect_uri: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/auth/kakao/callback`,
                code,
            }),
        });

        if (!tokenResponse.ok) {
            console.error('Token exchange failed:', await tokenResponse.text());
            return NextResponse.redirect(new URL('/login?error=token_exchange', request.url));
        }

        const tokenData = await tokenResponse.json();
        const accessToken = tokenData.access_token;

        // Get user info from Kakao
        const userResponse = await fetch('https://kapi.kakao.com/v2/user/me', {
            headers: {
                Authorization: `Bearer ${accessToken}`,
            },
        });

        if (!userResponse.ok) {
            console.error('Failed to get user info:', await userResponse.text());
            return NextResponse.redirect(new URL('/login?error=user_info', request.url));
        }

        const kakaoUser = await userResponse.json();
        const uid = `kakao_${kakaoUser.id}`;

        // Create or update Firebase user
        try {
            await admin.auth().getUser(uid);
        } catch (error) {
            // User doesn't exist, create new user
            await admin.auth().createUser({
                uid,
                displayName: kakaoUser.properties?.nickname || 'Kakao User',
                photoURL: kakaoUser.properties?.profile_image,
            });

            // Create user document in Firestore
            await admin.firestore().collection('users').doc(uid).set({
                uid,
                email: kakaoUser.kakao_account?.email || null,
                displayName: kakaoUser.properties?.nickname || 'Kakao User',
                photoURL: kakaoUser.properties?.profile_image || null,
                provider: 'kakao',
                role: 'user',
                subscription: {
                    plan: 'free',
                    status: 'active',
                },
                usage: {
                    trendsThisWeek: 0,
                    keywordsThisMonth: 0,
                    lastResetWeek: new Date().toISOString(),
                    lastResetMonth: new Date().toISOString(),
                },
                createdAt: admin.firestore.FieldValue.serverTimestamp(),
                updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            });
        }

        // Create custom token
        const customToken = await admin.auth().createCustomToken(uid);

        // Redirect to login page with token
        const redirectUrl = new URL('/login', request.url);
        redirectUrl.searchParams.set('token', customToken);

        return NextResponse.redirect(redirectUrl);
    } catch (error) {
        console.error('Kakao callback error:', error);
        return NextResponse.redirect(new URL('/login?error=auth_failed', request.url));
    }
}
