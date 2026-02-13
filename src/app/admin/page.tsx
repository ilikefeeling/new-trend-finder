'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, DollarSign, TrendingUp, Activity } from 'lucide-react';
import { collection, getDocs } from 'firebase/firestore';
import { firestore } from '@/lib/firebase.config';
import { DashboardCardSkeleton } from '@/components/skeletons/DashboardCardSkeleton';
import ErrorState from '@/components/ErrorState';

interface DashboardStats {
    totalUsers: number;
    activeSubscriptions: number;
    monthlyRevenue: number;
    freeUsers: number;
    proUsers: number;
    enterpriseUsers: number;
}

export default function AdminDashboard() {
    const [stats, setStats] = useState<DashboardStats>({
        totalUsers: 0,
        activeSubscriptions: 0,
        monthlyRevenue: 0,
        freeUsers: 0,
        proUsers: 0,
        enterpriseUsers: 0,
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetchStats();
    }, []);

    const fetchStats = async () => {
        setLoading(true);
        setError(null);
        try {
            // Fetch all users
            const usersSnapshot = await getDocs(collection(firestore, 'users'));
            const users = usersSnapshot.docs.map(doc => doc.data());

            const totalUsers = users.length;
            const freeUsers = users.filter(u => u.subscription?.tier === 'free').length;
            const proUsers = users.filter(u => u.subscription?.tier === 'pro').length;
            const enterpriseUsers = users.filter(u => u.subscription?.tier === 'enterprise').length;
            const activeSubscriptions = users.filter(
                u => u.subscription?.status === 'active' && u.subscription?.tier !== 'free'
            ).length;

            // Calculate monthly revenue
            const monthlyRevenue = (proUsers * 9) + (enterpriseUsers * 99);

            setStats({
                totalUsers,
                activeSubscriptions,
                monthlyRevenue,
                freeUsers,
                proUsers,
                enterpriseUsers,
            });
        } catch (error) {
            console.error('Error fetching stats:', error);
            setError('통계 데이터를 불러오는데 실패했습니다.');
        } finally {
            setLoading(false);
        }
    };

    if (error) {
        return <ErrorState onRetry={fetchStats} />;
    }

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-bold mb-2">관리자 대시보드</h1>
                <p className="text-muted-foreground">Next Shorts 플랫폼 통계 및 관리</p>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {loading ? (
                    <>
                        <DashboardCardSkeleton />
                        <DashboardCardSkeleton />
                        <DashboardCardSkeleton />
                        <DashboardCardSkeleton />
                    </>
                ) : (
                    <>
                        <Card className="bg-card/40 backdrop-blur-md border-white/5 hover:bg-card/60 transition-colors">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">전체 사용자</CardTitle>
                                <Users className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{stats.totalUsers}</div>
                                <p className="text-xs text-muted-foreground mt-1">
                                    Free: {stats.freeUsers} | Pro: {stats.proUsers} | Enterprise: {stats.enterpriseUsers}
                                </p>
                            </CardContent>
                        </Card>

                        <Card className="bg-card/40 backdrop-blur-md border-white/5 hover:bg-card/60 transition-colors">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">활성 구독</CardTitle>
                                <Activity className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{stats.activeSubscriptions}</div>
                                <p className="text-xs text-muted-foreground mt-1">
                                    전환율: {((stats.activeSubscriptions / stats.totalUsers) * 100).toFixed(1)}%
                                </p>
                            </CardContent>
                        </Card>

                        <Card className="bg-card/40 backdrop-blur-md border-white/5 hover:bg-card/60 transition-colors">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">월간 수익 (MRR)</CardTitle>
                                <DollarSign className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">${stats.monthlyRevenue}</div>
                                <p className="text-xs text-muted-foreground mt-1">
                                    연간 예상: ${stats.monthlyRevenue * 12}
                                </p>
                            </CardContent>
                        </Card>

                        <Card className="bg-card/40 backdrop-blur-md border-white/5 hover:bg-card/60 transition-colors">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">성장률</CardTitle>
                                <TrendingUp className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">+12.5%</div>
                                <p className="text-xs text-muted-foreground mt-1">
                                    지난 30일 대비
                                </p>
                            </CardContent>
                        </Card>
                    </>
                )}
            </div>

            {/* User Distribution */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="bg-card/40 backdrop-blur-md border-white/5">
                    <CardHeader>
                        <CardTitle>구독 등급 분포</CardTitle>
                        <CardDescription>사용자 구독 플랜별 분포도</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            <div>
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-sm font-medium">Free</span>
                                    <span className="text-sm text-muted-foreground">
                                        {stats.freeUsers} ({((stats.freeUsers / stats.totalUsers) * 100).toFixed(0)}%)
                                    </span>
                                </div>
                                <div className="h-2 bg-secondary/30 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-gray-500"
                                        style={{ width: `${(stats.freeUsers / stats.totalUsers) * 100}%` }}
                                    />
                                </div>
                            </div>

                            <div>
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-sm font-medium">Pro ($9/월)</span>
                                    <span className="text-sm text-muted-foreground">
                                        {stats.proUsers} ({((stats.proUsers / stats.totalUsers) * 100).toFixed(0)}%)
                                    </span>
                                </div>
                                <div className="h-2 bg-secondary/30 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-blue-500"
                                        style={{ width: `${(stats.proUsers / stats.totalUsers) * 100}%` }}
                                    />
                                </div>
                            </div>

                            <div>
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-sm font-medium">Enterprise ($99/월)</span>
                                    <span className="text-sm text-muted-foreground">
                                        {stats.enterpriseUsers} ({((stats.enterpriseUsers / stats.totalUsers) * 100).toFixed(0)}%)
                                    </span>
                                </div>
                                <div className="h-2 bg-secondary/30 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-purple-500"
                                        style={{ width: `${(stats.enterpriseUsers / stats.totalUsers) * 100}%` }}
                                    />
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-card/40 backdrop-blur-md border-white/5">
                    <CardHeader>
                        <CardTitle>빠른 작업</CardTitle>
                        <CardDescription>자주 사용하는 관리 기능</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        <a
                            href="/admin/users"
                            className="block p-4 rounded-lg border border-white/5 bg-white/5 hover:bg-white/10 transition-colors"
                        >
                            <div className="font-medium mb-1">사용자 관리</div>
                            <div className="text-sm text-muted-foreground">
                                사용자 검색, 구독 변경, 계정 관리
                            </div>
                        </a>
                        <a
                            href="/admin/transactions"
                            className="block p-4 rounded-lg border border-white/5 bg-white/5 hover:bg-white/10 transition-colors"
                        >
                            <div className="font-medium mb-1">거래 내역</div>
                            <div className="text-sm text-muted-foreground">
                                결제 내역, 환불 처리, 구독 관리
                            </div>
                        </a>
                        <a
                            href="/admin/settings"
                            className="block p-4 rounded-lg border border-white/5 bg-white/5 hover:bg-white/10 transition-colors"
                        >
                            <div className="font-medium mb-1">시스템 설정</div>
                            <div className="text-sm text-muted-foreground">
                                플랫폼 설정, 기능 플래그, API 키 관리
                            </div>
                        </a>
                    </CardContent>
                </Card>
            </div>

            {/* Recent Activity */}
            <Card className="bg-card/40 backdrop-blur-md border-white/5">
                <CardHeader>
                    <CardTitle>최근 활동</CardTitle>
                    <CardDescription>최근 15분간의 플랫폼 활동</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="text-sm text-muted-foreground text-center py-8">
                        실시간 활동 로그 구현 예정
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
