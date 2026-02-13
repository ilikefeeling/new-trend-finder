import { NextRequest, NextResponse } from 'next/server';
import admin from '@/lib/firebase-admin';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams;
        const code = searchParams.get('code');

        if (!code) {
            console.error('Kakao callback error: No code provided');
            return NextResponse.redirect(new URL('/login?error=no_code', request.url));
        }

        const clientId = process.env.NEXT_PUBLIC_KAKAO_CLIENT_ID;
        // Use the origin from the request to support Vercel preview URLs automatically
        const origin = request.nextUrl.origin;
        const redirectUri = `${origin}/api/auth/kakao/callback`;

        // Check Firebase Admin Initialization Status
        if (admin.apps.length === 0) {
            console.log('[Kakao Login] Firebase Admin not initialized. Attempting to initialize...');

            let privateKey = process.env.FIREBASE_PRIVATE_KEY;
            if (privateKey) {
                privateKey = privateKey.trim();

                // Handle case where user pasted the entire Service Account JSON file
                if (privateKey.startsWith('{')) {
                    try {
                        const jsonKey = JSON.parse(privateKey);
                        if (jsonKey.private_key) {
                            privateKey = jsonKey.private_key;
                        }
                    } catch (e) {
                        console.error('[Kakao Login] Failed to parse private key as JSON', e);
                    }
                }

                // Remove wrapping double quotes if accidentally pasted in Vercel
                if (privateKey.startsWith('"') && privateKey.endsWith('"')) {
                    privateKey = privateKey.slice(1, -1);
                }
                // Handle escaped newlines
                privateKey = privateKey.replace(/\\n/g, '\n');

                // Add PEM headers if missing (Common Vercel copy-paste error)
                if (!privateKey.startsWith('-----BEGIN PRIVATE KEY-----')) {
                    privateKey = `-----BEGIN PRIVATE KEY-----\n${privateKey}\n-----END PRIVATE KEY-----\n`;
                }
            }

            const projectId = process.env.FIREBASE_PROJECT_ID;
            const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;

            const missing = [];
            if (!privateKey) missing.push('FIREBASE_PRIVATE_KEY');
            if (!projectId) missing.push('FIREBASE_PROJECT_ID');
            if (!clientEmail) missing.push('FIREBASE_CLIENT_EMAIL');

            if (missing.length > 0) {
                throw new Error(`Server Config Error: Missing ${missing.join(', ')}`);
            }

            try {
                admin.initializeApp({
                    credential: admin.credential.cert({
                        projectId,
                        clientEmail,
                        privateKey,
                    }),
                });
                console.log('[Kakao Login] Firebase Admin initialized successfully in route');
            } catch (initError: any) {
                console.error('[Kakao Login] Firebase Admin init failed:', initError);
                // Create a masked debug string for the user to help diagnose (safe to show start/end)
                const keyDebug = privateKey ?
                    `[Length: ${privateKey.length}, Start: '${privateKey.substring(0, 20)}...', End: '...${privateKey.substring(privateKey.length - 20)}']` :
                    '[Key is null]';
                throw new Error(`Firebase Admin Init Error: ${initError.message} ${keyDebug}`);
            }
        }

        if (!clientId) {
            console.error('Kakao callback error: Missing NEXT_PUBLIC_KAKAO_CLIENT_ID');
            return NextResponse.redirect(new URL('/login?error=config_error', request.url));
        }

        console.log(`[Kakao Login] Exchanging code for token. Redirect URI: ${redirectUri}`);

        // Exchange code for access token
        const tokenResponse = await fetch('https://kauth.kakao.com/oauth/token', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: new URLSearchParams({
                grant_type: 'authorization_code',
                client_id: clientId,
                redirect_uri: redirectUri,
                code,
            }),
        });

        if (!tokenResponse.ok) {
            const errorText = await tokenResponse.text();
            console.error('[Kakao Login] Token exchange failed:', errorText);
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
            const errorText = await userResponse.text();
            console.error('[Kakao Login] Failed to get user info:', errorText);
            return NextResponse.redirect(new URL('/login?error=user_info', request.url));
        }

        const kakaoUser = await userResponse.json();
        // Use a consistent UID format. Using string template strictly.
        const uid = `kakao_${kakaoUser.id}`;
        const email = kakaoUser.kakao_account?.email || null;
        const displayName = kakaoUser.properties?.nickname || 'Kakao User';
        const photoURL = kakaoUser.properties?.profile_image || null;

        console.log(`[Kakao Login] Processing user: ${uid} (${email})`);

        // Create or update Firebase user
        try {
            // 1. Check if user exists in Authentication
            await admin.auth().getUser(uid);
            console.log(`[Kakao Login] Auth user exists: ${uid}`);
        } catch (error: any) {
            if (error.code === 'auth/user-not-found') {
                // 2. If not, create new user in Authentication
                console.log(`[Kakao Login] Creating new Auth user: ${uid}`);
                await admin.auth().createUser({
                    uid,
                    email: email || undefined, // Only pass if exists
                    displayName,
                    photoURL: photoURL || undefined,
                });
            } else {
                console.error('[Kakao Login] Error checking Auth user:', error);
                throw error;
            }
        }

        // 3. Check/Create Firestore Document (Self-healing)
        const userDocRef = admin.firestore().collection('users').doc(uid);
        const userDoc = await userDocRef.get();

        if (!userDoc.exists) {
            console.log(`[Kakao Login] Creating missing Firestore document for: ${uid}`);
            await userDocRef.set({
                uid,
                email,
                displayName,
                photoURL,
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
        } else {
            console.log(`[Kakao Login] Firestore document exists for: ${uid}`);
            // Optional: Update last login time or sync latest profile info here if needed
            await userDocRef.update({
                updatedAt: admin.firestore.FieldValue.serverTimestamp(),
                // Keep profile info in sync if it changed on Kakao side?
                // displayName, 
                // photoURL
            });
        }

        // Create custom token
        const customToken = await admin.auth().createCustomToken(uid);

        // Redirect to login page with token
        const redirectUrl = new URL('/login', request.url);
        redirectUrl.searchParams.set('token', customToken);

        console.log('[Kakao Login] Login successful, redirecting with token');
        return NextResponse.redirect(redirectUrl);

    } catch (error: any) {
        console.error('[Kakao Login] Unhandled error:', error);
        const errorMessage = encodeURIComponent(error.message || 'Unknown error');
        return NextResponse.redirect(new URL(`/login?error=auth_failed&message=${errorMessage}`, request.url));
    }
}
