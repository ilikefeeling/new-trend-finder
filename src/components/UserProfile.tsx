'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useState } from 'react';
import { ChevronDown, User, LogOut, Settings, CreditCard } from 'lucide-react';

export default function UserProfile() {
    const { user, signOut } = useAuth();
    const [isOpen, setIsOpen] = useState(false);

    if (!user) return null;

    const handleSignOut = async () => {
        try {
            await signOut();
            window.location.href = '/login';
        } catch (error) {
            console.error('Sign out error:', error);
        }
    };

    return (
        <div className="relative">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-secondary/50 transition-colors"
            >
                <img
                    src={user.photoURL || '/default-avatar.png'}
                    alt={user.displayName || 'User'}
                    className="w-8 h-8 rounded-full border border-primary/20"
                    onError={(e) => {
                        (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(user.displayName || 'User')}&background=random`;
                    }}
                />
                <span className="hidden md:block text-sm font-medium">
                    {user.displayName}
                </span>
                <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            {isOpen && (
                <>
                    <div
                        className="fixed inset-0 z-10"
                        onClick={() => setIsOpen(false)}
                    />
                    <div className="absolute right-0 mt-2 w-56 bg-card border border-primary/10 rounded-lg shadow-xl z-20 overflow-hidden">
                        {/* User Info */}
                        <div className="px-4 py-3 border-b border-primary/10">
                            <p className="text-sm font-semibold">{user.displayName}</p>
                            <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                            <div className="mt-2">
                                <span className={`text-xs px-2 py-1 rounded-full ${user.subscription.tier === 'pro'
                                        ? 'bg-blue-500/20 text-blue-500'
                                        : user.subscription.tier === 'enterprise'
                                            ? 'bg-purple-500/20 text-purple-500'
                                            : 'bg-gray-500/20 text-gray-500'
                                    }`}>
                                    {user.subscription.tier.toUpperCase()}
                                </span>
                            </div>
                        </div>

                        {/* Menu Items */}
                        <div className="py-1">
                            <button
                                onClick={() => {
                                    window.location.href = '/profile';
                                    setIsOpen(false);
                                }}
                                className="w-full px-4 py-2 text-left text-sm hover:bg-secondary/50 flex items-center gap-3 transition-colors"
                            >
                                <User className="w-4 h-4" />
                                내 프로필
                            </button>

                            <button
                                onClick={() => {
                                    window.location.href = '/profile#subscription';
                                    setIsOpen(false);
                                }}
                                className="w-full px-4 py-2 text-left text-sm hover:bg-secondary/50 flex items-center gap-3 transition-colors"
                            >
                                <CreditCard className="w-4 h-4" />
                                구독 관리
                            </button>

                            <button
                                onClick={() => {
                                    window.location.href = '/settings';
                                    setIsOpen(false);
                                }}
                                className="w-full px-4 py-2 text-left text-sm hover:bg-secondary/50 flex items-center gap-3 transition-colors"
                            >
                                <Settings className="w-4 h-4" />
                                설정
                            </button>
                        </div>

                        {/* Sign Out */}
                        <div className="border-t border-primary/10 py-1">
                            <button
                                onClick={handleSignOut}
                                className="w-full px-4 py-2 text-left text-sm text-red-500 hover:bg-red-500/10 flex items-center gap-3 transition-colors"
                            >
                                <LogOut className="w-4 h-4" />
                                로그아웃
                            </button>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
