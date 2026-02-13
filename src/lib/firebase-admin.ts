import admin from 'firebase-admin';

if (!admin.apps.length) {
    try {
        let privateKey = process.env.FIREBASE_PRIVATE_KEY;

        // Comprehensive private key sanitization
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
                    console.error('[Firebase Admin] Failed to parse private key as JSON', e);
                }
            }
        }

        // After all parsing, check if we have a valid key and apply transformations
        if (privateKey) {
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

        if (privateKey && process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_CLIENT_EMAIL) {
            admin.initializeApp({
                credential: admin.credential.cert({
                    projectId: process.env.FIREBASE_PROJECT_ID,
                    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
                    privateKey,
                }),
            });
            console.log('Firebase Admin initialized successfully');
        } else {
            const missing = [];
            if (!privateKey) missing.push('FIREBASE_PRIVATE_KEY');
            if (!process.env.FIREBASE_PROJECT_ID) missing.push('FIREBASE_PROJECT_ID');
            if (!process.env.FIREBASE_CLIENT_EMAIL) missing.push('FIREBASE_CLIENT_EMAIL');

            throw new Error(`Firebase Admin Config Missing: ${missing.join(', ')}`);
        }
    } catch (error) {
        console.error('Firebase Admin initialization failed:', error);
    }
}

export default admin;
