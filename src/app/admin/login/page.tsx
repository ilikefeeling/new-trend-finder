import { redirect } from 'next/navigation';

export default function AdminLoginPage() {
    // Admin uses the main login page, redirect there
    redirect('/login');
}
