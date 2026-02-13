'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useSubscription } from '@/hooks/useSubscription';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { User, Mail, Calendar, Crown, CreditCard, BarChart2, History } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import { firestore } from '@/lib/firebase.config';
import { Skeleton } from '@/components/ui/skeleton';

interface Transaction {
    id: string;
    amount: number;
    currency: string;
    status: string;
    created_at: any;
    type: string;
}

export default function ProfilePage() {
    const { user, signOut } = useAuth();
    const { getTierName, isPro } = useSubscription();
    const router = useRouter();
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [loadingTransactions, setLoadingTransactions] = useState(true);

    useEffect(() => {
        if (user) {
            fetchRecentTransactions();
        }
    }, [user]);

    const fetchRecentTransactions = async () => {
        if (!user) return;
        try {
            const q = query(
                collection(firestore, 'transactions'),
                where('user_id', '==', user.uid),
                orderBy('created_at', 'desc'),
                limit(5)
            );
            const snapshot = await getDocs(q);
            const data = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            } as Transaction));
            setTransactions(data);
        } catch (error) {
            console.error('Error fetching transactions:', error);
        } finally {
            setLoadingTransactions(false);
        }
    };

    if (!user) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="text-center">
                    <p className="text-muted-foreground mb-4">로그인이 필요합니다</p>
                    <Button onClick={() => router.push('/login')}>로그인하기</Button>
                </div>
            </div>
        );
    }

    return (
        <div className="container max-w-5xl py-8 space-y-8">
            <h1 className="text-3xl font-bold">내 프로필</h1>

            <div className="grid gap-8 md:grid-cols-[1fr_2fr]">
                {/* Left Column: User Info & Subscription */}
                <div className="space-y-6">
                    {/* User Info Card */}
                    <Card className="bg-card/40 backdrop-blur-md border-white/5">
                        <CardHeader>
                            <CardTitle className="text-lg flex items-center gap-2">
                                <User className="w-5 h-5 text-primary" />
                                계정 정보
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="flex flex-col items-center">
                                <img
                                    src={user.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.displayName || 'User')}&background=random`}
                                    alt={user.displayName || 'User'}
                                    className="w-24 h-24 rounded-full border-4 border-primary/10 mb-4"
                                />
                                <h3 className="text-xl font-bold">{user.displayName}</h3>
                                <p className="text-muted-foreground text-sm">{user.email}</p>
                            </div>

                            <div className="space-y-3 pt-4 border-t border-white/5">
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-muted-foreground flex items-center gap-2">
                                        <Mail className="w-4 h-4" /> 이메일
                                    </span>
                                    <span className="font-medium truncate max-w-[150px]">{user.email}</span>
                                </div>
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-muted-foreground flex items-center gap-2">
                                        <Calendar className="w-4 h-4" /> 가입일
                                    </span>
                                    <span className="font-medium">
                                        {user.createdAt?.toDate ? user.createdAt.toDate().toLocaleDateString() : 'N/A'}
                                    </span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Subscription Card */}
                    <Card className="bg-card/40 backdrop-blur-md border-white/5">
                        <CardHeader>
                            <CardTitle className="text-lg flex items-center gap-2">
                                <Crown className="w-5 h-5 text-yellow-500" />
                                구독 상태
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="flex items-center justify-between">
                                <span className="text-muted-foreground">현재 플랜</span>
                                <Badge className={isPro() ? 'bg-primary' : 'bg-secondary'}>
                                    {getTierName()}
                                </Badge>
                            </div>

                            <div className="pt-4 border-t border-white/5">
                                <h4 className="font-medium mb-3 text-sm">플랜 혜택</h4>
                                <ul className="space-y-2 text-sm text-muted-foreground">
                                    <li className="flex items-center gap-2">
                                        <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                                        {isPro() ? '무제한 트렌드 분석' : '주 3회 트렌드 분석'}
                                    </li>
                                    <li className="flex items-center gap-2">
                                        <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                                        {isPro() ? '고급 AI 분석 (10개)' : '기본 AI 아이디어 (3개)'}
                                    </li>
                                </ul>
                            </div>

                            <Button
                                className="w-full"
                                variant={isPro() ? "outline" : "default"}
                                onClick={() => router.push('/pricing')}
                            >
                                {isPro() ? '플랜 관리' : 'Pro로 업그레이드'}
                            </Button>
                        </CardContent>
                    </Card>
                </div>

                {/* Right Column: Usage & History */}
                <div className="space-y-6">
                    {/* Usage Stats */}
                    <Card className="bg-card/40 backdrop-blur-md border-white/5">
                        <CardHeader>
                            <CardTitle className="text-lg flex items-center gap-2">
                                <BarChart2 className="w-5 h-5 text-blue-500" />
                                이번 달 사용량
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="p-4 rounded-lg bg-background/50 border border-white/5">
                                    <div className="text-sm text-muted-foreground mb-1">트렌드 분석</div>
                                    <div className="text-2xl font-bold text-primary">
                                        {user.usage?.trend_analyses_this_week || 0}
                                        <span className="text-sm text-muted-foreground font-normal ml-1">
                                            / {isPro() ? '∞' : '3'}회 (주간)
                                        </span>
                                    </div>
                                </div>
                                <div className="p-4 rounded-lg bg-background/50 border border-white/5">
                                    <div className="text-sm text-muted-foreground mb-1">키워드 검색</div>
                                    <div className="text-2xl font-bold text-primary">
                                        {user.usage?.keyword_searches_this_month || 0}
                                        <span className="text-sm text-muted-foreground font-normal ml-1">
                                            / {isPro() ? '∞' : '5'}회 (월간)
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Payment History */}
                    <Card className="bg-card/40 backdrop-blur-md border-white/5">
                        <CardHeader>
                            <CardTitle className="text-lg flex items-center gap-2">
                                <History className="w-5 h-5 text-green-500" />
                                최근 결제 내역
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            {loadingTransactions ? (
                                <div className="space-y-3">
                                    <Skeleton className="h-12 w-full" />
                                    <Skeleton className="h-12 w-full" />
                                    <Skeleton className="h-12 w-full" />
                                </div>
                            ) : transactions.length > 0 ? (
                                <div className="space-y-4">
                                    {transactions.map((tx) => (
                                        <div key={tx.id} className="flex items-center justify-between p-3 rounded-lg bg-background/30 hover:bg-background/50 transition-colors">
                                            <div className="flex items-center gap-3">
                                                <div className={`p-2 rounded-full ${tx.status === 'completed' ? 'bg-green-500/10 text-green-500' : 'bg-yellow-500/10 text-yellow-500'}`}>
                                                    <CreditCard className="w-4 h-4" />
                                                </div>
                                                <div>
                                                    <p className="font-medium text-sm">
                                                        {tx.type === 'subscription_payment' ? '정기 구독 결제' : '결제'}
                                                    </p>
                                                    <p className="text-xs text-muted-foreground">
                                                        {tx.created_at?.toDate ? tx.created_at.toDate().toLocaleDateString() : '날짜 없음'}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className="font-bold text-sm">
                                                    {tx.currency === 'USD' ? '$' : '₩'}
                                                    {tx.amount?.toLocaleString()}
                                                </p>
                                                <Badge variant="outline" className="text-[10px] h-5 px-1.5">
                                                    {tx.status}
                                                </Badge>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-8 text-muted-foreground">
                                    <CreditCard className="w-8 h-8 mx-auto mb-2 opacity-20" />
                                    <p className="text-sm">결제 내역이 없습니다</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    <div className="flex justify-end">
                        <Button variant="ghost" className="text-red-500 hover:text-red-600 hover:bg-red-500/10" onClick={() => signOut()}>
                            로그아웃
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}
