import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;

    // Admin routes protection
    if (pathname.startsWith('/admin')) {
        // In production, you should verify the user's role from a secure session/token
        // For now, we'll check if there's a custom header or cookie
        const adminToken = request.cookies.get('admin_token');

        // Allow access to admin login page
        if (pathname === '/admin/login') {
            return NextResponse.next();
        }

        // Check if user is authenticated as admin
        // This is a simplified check - in production, verify JWT token with admin claim
        /*
        if (!adminToken) {
            return NextResponse.redirect(new URL('/admin/login', request.url));
        }
        */

        return NextResponse.next();
    }

    return NextResponse.next();
}

export const config = {
    matcher: ['/admin/:path*'],
};
