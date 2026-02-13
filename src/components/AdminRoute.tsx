'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function AdminRoute({ children }: { children: React.ReactNode }) {
    const { user, loading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        // Only redirect if loading is complete
        if (loading) return;

        if (!user) {
            console.log('AdminRoute: No user, redirecting to /login');
            router.replace('/login');
            return;
        }

        if (user.role !== 'admin') {
            console.log('AdminRoute: User is not admin, redirecting to /dashboard');
            router.replace('/dashboard');
            return;
        }

        console.log('AdminRoute: User is admin, access granted');
    }, [user, loading, router]);

    // Show loading while auth is being checked
    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
        );
    }

    // If not logged in or not admin, show loading while redirecting
    if (!user || user.role !== 'admin') {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
        );
    }

    // User is authenticated and is admin - render the protected content
    return <>{children}</>;
}
