'use client';

import { useAuth } from '@/contexts/AuthContext';

export function useSubscription() {
    const { user, loading } = useAuth();

    // Check if user is on Pro tier
    const isPro = () => {
        if (!user) return false;
        return user.subscription.tier === 'pro' || user.subscription.tier === 'enterprise';
    };

    // Check if user is on Enterprise tier
    const isEnterprise = () => {
        if (!user) return false;
        return user.subscription.tier === 'enterprise';
    };

    // Check if subscription is active
    const isActive = () => {
        if (!user) return false;
        return user.subscription.status === 'active';
    };

    // Check if user can access a specific feature
    const canAccess = (feature: 'basic' | 'pro' | 'enterprise') => {
        if (!user) return false;

        switch (feature) {
            case 'basic':
                return true; // All users can access basic features
            case 'pro':
                return isPro() && isActive();
            case 'enterprise':
                return isEnterprise() && isActive();
            default:
                return false;
        }
    };

    // Check usage limits for free tier
    const checkUsageLimit = (type: 'trend' | 'keyword'): { allowed: boolean; current: number; limit: number } => {
        if (!user) {
            return { allowed: false, current: 0, limit: 0 };
        }

        // Pro and Enterprise have unlimited usage
        if (isPro()) {
            return { allowed: true, current: 0, limit: -1 }; // -1 means unlimited
        }

        // Free tier limits
        if (type === 'trend') {
            const limit = 3; // 3 trend analyses per week
            const current = user.usage.trend_analyses_this_week;
            return {
                allowed: current < limit,
                current,
                limit,
            };
        } else if (type === 'keyword') {
            const limit = 5; // 5 keyword searches per month
            const current = user.usage.keyword_searches_this_month;
            return {
                allowed: current < limit,
                current,
                limit,
            };
        }

        return { allowed: false, current: 0, limit: 0 };
    };

    // Get subscription tier display name
    const getTierName = () => {
        if (!user) return 'Free';
        return user.subscription.tier.charAt(0).toUpperCase() + user.subscription.tier.slice(1);
    };

    // Get subscription tier color for badges
    const getTierColor = () => {
        if (!user) return 'gray';

        switch (user.subscription.tier) {
            case 'pro':
                return 'blue';
            case 'enterprise':
                return 'purple';
            default:
                return 'gray';
        }
    };

    // Check if subscription is about to expire (within 7 days)
    const isExpiringSoon = () => {
        if (!user || !user.subscription.expires_at) return false;

        const now = new Date();
        const expiresAt = user.subscription.expires_at;
        const daysUntilExpiry = Math.floor((expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

        return daysUntilExpiry <= 7 && daysUntilExpiry > 0;
    };

    return {
        user,
        loading,
        subscription: user?.subscription || null,
        isPro,
        isEnterprise,
        isActive,
        canAccess,
        checkUsageLimit,
        getTierName,
        getTierColor,
        isExpiringSoon,
    };
}
