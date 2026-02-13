import admin from 'firebase-admin';

if (!admin.apps.length) {
    try {
        const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');

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
