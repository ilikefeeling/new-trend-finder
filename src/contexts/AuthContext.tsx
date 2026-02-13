'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import {
    User,
    onAuthStateChanged,
    signOut as firebaseSignOut
} from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, firestore } from '@/lib/firebase.config';

interface UserData {
    uid: string;
    email: string | null;
    displayName: string | null;
    photoURL: string | null;
    provider: string;
    role: 'user' | 'admin';
    subscription: {
        tier: 'free' | 'pro' | 'enterprise';
        status: 'active' | 'canceled' | 'trial';
        started_at: Date | null;
        expires_at: Date | null;
        paypal_subscription_id: string | null;
        auto_renew: boolean;
    };
    usage: {
        trend_analyses_this_week: number;
        keyword_searches_this_month: number;
        last_reset: Date | null;
    };
    created_at: Date;
    last_login: Date;
    is_active: boolean;
}

interface AuthContextType {
    user: UserData | null;
    firebaseUser: User | null;
    loading: boolean;
    signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
    user: null,
    firebaseUser: null,
    loading: true,
    signOut: async () => { },
});

export function useAuth() {
    return useContext(AuthContext);
}

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<UserData | null>(null);
    const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
            setFirebaseUser(firebaseUser);

            if (firebaseUser) {
                try {
                    // Get user data from Firestore
                    const userDocRef = doc(firestore, 'users', firebaseUser.uid);
                    const userDoc = await getDoc(userDocRef);

                    if (!userDoc.exists()) {
                        // Create new user document for first-time login
                        const newUserData: UserData = {
                            uid: firebaseUser.uid,
                            email: firebaseUser.email,
                            displayName: firebaseUser.displayName,
                            photoURL: firebaseUser.photoURL,
                            provider: firebaseUser.providerData[0]?.providerId || 'unknown',
                            role: 'user',
                            subscription: {
                                tier: 'free',
                                status: 'active',
                                started_at: null,
                                expires_at: null,
                                paypal_subscription_id: null,
                                auto_renew: false,
                            },
                            usage: {
                                trend_analyses_this_week: 0,
                                keyword_searches_this_month: 0,
                                last_reset: new Date(),
                            },
                            created_at: new Date(),
                            last_login: new Date(),
                            is_active: true,
                        };

                        await setDoc(userDocRef, {
                            ...newUserData,
                            created_at: serverTimestamp(),
                            last_login: serverTimestamp(),
                            'usage.last_reset': serverTimestamp(),
                        });

                        setUser(newUserData);
                    } else {
                        // Update last login
                        const userData = userDoc.data() as any;

                        await setDoc(userDocRef, {
                            last_login: serverTimestamp(),
                        }, { merge: true });

                        // Convert Firestore timestamps to Date objects
                        setUser({
                            uid: userData.uid,
                            email: userData.email,
                            displayName: userData.displayName,
                            photoURL: userData.photoURL,
                            provider: userData.provider,
                            role: userData.role || 'user',
                            subscription: {
                                tier: userData.subscription?.tier || 'free',
                                status: userData.subscription?.status || 'active',
                                started_at: userData.subscription?.started_at?.toDate() || null,
                                expires_at: userData.subscription?.expires_at?.toDate() || null,
                                paypal_subscription_id: userData.subscription?.paypal_subscription_id || null,
                                auto_renew: userData.subscription?.auto_renew || false,
                            },
                            usage: {
                                trend_analyses_this_week: userData.usage?.trend_analyses_this_week || 0,
                                keyword_searches_this_month: userData.usage?.keyword_searches_this_month || 0,
                                last_reset: userData.usage?.last_reset?.toDate() || new Date(),
                            },
                            created_at: userData.created_at?.toDate() || new Date(),
                            last_login: new Date(),
                            is_active: userData.is_active !== false,
                        });
                    }
                } catch (error) {
                    console.error('Error fetching user data:', error);
                    setUser(null);
                }
            } else {
                setUser(null);
            }

            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const signOut = async () => {
        try {
            await firebaseSignOut(auth);
            setUser(null);
            setFirebaseUser(null);
        } catch (error) {
            console.error('Error signing out:', error);
            throw error;
        }
    };

    const value: AuthContextType = {
        user,
        firebaseUser,
        loading,
        signOut,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
