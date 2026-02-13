'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Search, User, Mail, Calendar, Shield } from 'lucide-react';
import { collection, getDocs, doc, updateDoc } from 'firebase/firestore';
import { firestore } from '@/lib/firebase.config';
import { TableRowSkeleton } from '@/components/skeletons/TableRowSkeleton';
import ErrorState from '@/components/ErrorState';
import { Skeleton } from '@/components/ui/skeleton';

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
    };
    usage: {
        trend_analyses_this_week: number;
        keyword_searches_this_month: number;
    };
    created_at: any;
    last_login: any;
    is_active: boolean;
}

export default function UsersPage() {
    const [users, setUsers] = useState<UserData[]>([]);
    const [filteredUsers, setFilteredUsers] = useState<UserData[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterTier, setFilterTier] = useState<'all' | 'free' | 'pro' | 'enterprise'>('all');

    useEffect(() => {
        fetchUsers();
    }, []);

    useEffect(() => {
        filterUsers();
    }, [searchQuery, filterTier, users]);

    const fetchUsers = async () => {
        setLoading(true);
        setError(null);
        try {
            const usersSnapshot = await getDocs(collection(firestore, 'users'));
            const usersData = usersSnapshot.docs.map(doc => ({
                ...doc.data() as UserData,
                uid: doc.id,
            }));
            setUsers(usersData);
            setFilteredUsers(usersData);
        } catch (error) {
            console.error('Error fetching users:', error);
            setError('사용자 목록을 불러오는데 실패했습니다.');
        } finally {
            setLoading(false);
        }
    };

    const filterUsers = () => {
        let filtered = users;

        // Filter by search query
        if (searchQuery) {
            filtered = filtered.filter(user =>
                user.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                user.displayName?.toLowerCase().includes(searchQuery.toLowerCase())
            );
        }

        // Filter by tier
        if (filterTier !== 'all') {
            filtered = filtered.filter(user => user.subscription?.tier === filterTier);
        }

        setFilteredUsers(filtered);
    };

    const changeUserTier = async (userId: string, newTier: 'free' | 'pro' | 'enterprise') => {
        try {
            const userRef = doc(firestore, 'users', userId);
            await updateDoc(userRef, {
                'subscription.tier': newTier,
            });

            // Update local state
            setUsers(users.map(u =>
                u.uid === userId
                    ? { ...u, subscription: { ...u.subscription, tier: newTier } }
                    : u
            ));

            alert(`사용자 구독 플랜이 ${newTier}로 변경되었습니다.`);
        } catch (error) {
            console.error('Error updating user tier:', error);
            alert('구독 플랜 변경에 실패했습니다.');
        }
    };

    const toggleUserStatus = async (userId: string, currentStatus: boolean) => {
        try {
            const userRef = doc(firestore, 'users', userId);
            await updateDoc(userRef, {
                is_active: !currentStatus,
            });

            // Update local state
            setUsers(users.map(u =>
                u.uid === userId
                    ? { ...u, is_active: !currentStatus }
                    : u
            ));

            alert(`사용자가 ${!currentStatus ? '활성화' : '비활성화'}되었습니다.`);
        } catch (error) {
            console.error('Error toggling user status:', error);
            alert('사용자 상태 변경에 실패했습니다.');
        }
    };

    if (error) {
        return <ErrorState onRetry={fetchUsers} />;
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold mb-2">사용자 관리</h1>
                <p className="text-muted-foreground">
                    {loading ? <Skeleton className="h-4 w-[100px]" /> : `전체 ${users.length}명의 사용자`}
                </p>
            </div>

            {/* Filters */}
            <Card className="bg-card/40 backdrop-blur-md border-white/5">
                <CardContent className="pt-6">
                    <div className="flex flex-col md:flex-row gap-4">
                        {/* Search */}
                        <div className="flex-1 relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <Input
                                placeholder="이메일 또는 이름으로 검색..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-10 bg-background/50 border-white/10"
                                aria-label="사용자 검색"
                            />
                        </div>

                        {/* Tier Filter */}
                        <div className="flex gap-2">
                            {['all', 'free', 'pro', 'enterprise'].map((tier) => (
                                <Button
                                    key={tier}
                                    variant={filterTier === tier ? 'default' : 'outline'}
                                    size="sm"
                                    onClick={() => setFilterTier(tier as any)}
                                    className="capitalize"
                                >
                                    {tier}
                                </Button>
                            ))}
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Users List */}
            <div className="space-y-4">
                {loading ? (
                    <>
                        <TableRowSkeleton />
                        <TableRowSkeleton />
                        <TableRowSkeleton />
                        <TableRowSkeleton />
                        <TableRowSkeleton />
                    </>
                ) : (
                    filteredUsers.map((user) => (
                        <Card key={user.uid} className="bg-card/40 backdrop-blur-md border-white/5 hover:bg-card/60 transition-colors">
                            <CardContent className="pt-6">
                                <div className="flex items-start justify-between">
                                    <div className="flex gap-4">
                                        {/* Avatar */}
                                        <img
                                            src={user.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.displayName || 'User')}&background=random`}
                                            alt={user.displayName || 'User'}
                                            className="w-12 h-12 rounded-full ring-2 ring-white/10"
                                        />

                                        {/* User Info */}
                                        <div className="space-y-2">
                                            <div className="flex items-center gap-2">
                                                <h3 className="font-semibold">{user.displayName || '이름 없음'}</h3>
                                                {user.role === 'admin' && (
                                                    <Badge variant="outline" className="bg-purple-500/10 text-purple-500 border-purple-500/50">
                                                        <Shield className="w-3 h-3 mr-1" />
                                                        Admin
                                                    </Badge>
                                                )}
                                                <Badge className={
                                                    user.subscription?.tier === 'pro'
                                                        ? 'bg-blue-500/20 text-blue-500 hover:bg-blue-500/30'
                                                        : user.subscription?.tier === 'enterprise'
                                                            ? 'bg-purple-500/20 text-purple-500 hover:bg-purple-500/30'
                                                            : 'bg-gray-500/20 text-gray-500 hover:bg-gray-500/30'
                                                }>
                                                    {user.subscription?.tier?.toUpperCase() || 'FREE'}
                                                </Badge>
                                                {!user.is_active && (
                                                    <Badge variant="outline" className="bg-red-500/10 text-red-500 border-red-500/50">
                                                        비활성
                                                    </Badge>
                                                )}
                                            </div>

                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm text-muted-foreground">
                                                <div className="flex items-center gap-2">
                                                    <Mail className="w-4 h-4" />
                                                    {user.email || '이메일 없음'}
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <User className="w-4 h-4" />
                                                    {user.provider}
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <Calendar className="w-4 h-4" />
                                                    {user.created_at?.toDate?.()?.toLocaleDateString('ko-KR') || '날짜 없음'}
                                                </div>
                                            </div>

                                            <div className="text-sm pt-1">
                                                <span className="text-muted-foreground">사용량: </span>
                                                <span className="text-foreground/80">트렌드 {user.usage?.trend_analyses_this_week || 0}회</span>
                                                <span className="mx-2 text-muted-foreground">|</span>
                                                <span className="text-foreground/80">키워드 {user.usage?.keyword_searches_this_month || 0}회</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Actions */}
                                    <div className="flex flex-col gap-2">
                                        <select
                                            value={user.subscription?.tier || 'free'}
                                            onChange={(e) => changeUserTier(user.uid, e.target.value as 'free' | 'pro' | 'enterprise')}
                                            className="px-3 py-1.5 border border-white/10 rounded-md text-sm bg-background/50 focus:ring-2 focus:ring-primary/50 outline-none"
                                            aria-label={`${user.displayName}님의 구독 플랜 변경`}
                                        >
                                            <option value="free">Free</option>
                                            <option value="pro">Pro</option>
                                            <option value="enterprise">Enterprise</option>
                                        </select>

                                        <Button
                                            size="sm"
                                            variant={user.is_active ? 'outline' : 'default'}
                                            onClick={() => toggleUserStatus(user.uid, user.is_active)}
                                            className={!user.is_active ? "bg-green-600 hover:bg-green-700" : ""}
                                        >
                                            {user.is_active ? '비활성화' : '활성화'}
                                        </Button>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))
                )}

                {!loading && filteredUsers.length === 0 && (
                    <Card className="bg-card/40 backdrop-blur-md border-white/5">
                        <CardContent className="py-12 text-center text-muted-foreground">
                            검색 결과가 없습니다
                        </CardContent>
                    </Card>
                )}
            </div>
        </div>
    );
}
