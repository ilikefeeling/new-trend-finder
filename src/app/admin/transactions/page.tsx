'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, DollarSign, Calendar, User } from 'lucide-react';
import { collection, getDocs, query, orderBy, limit } from 'firebase/firestore';
import { firestore } from '@/lib/firebase.config';
import { TableRowSkeleton } from '@/components/skeletons/TableRowSkeleton';
import ErrorState from '@/components/ErrorState';
import { Skeleton } from '@/components/ui/skeleton';

interface Transaction {
    id: string;
    user_id: string;
    type: string;
    paypal_subscription_id?: string;
    paypal_transaction_id?: string;
    amount?: number;
    currency?: string;
    created_at: any;
}

export default function TransactionsPage() {
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [filteredTransactions, setFilteredTransactions] = useState<Transaction[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        fetchTransactions();
    }, []);

    useEffect(() => {
        filterTransactions();
    }, [searchQuery, transactions]);

    const fetchTransactions = async () => {
        setLoading(true);
        setError(null);
        try {
            const q = query(
                collection(firestore, 'transactions'),
                orderBy('created_at', 'desc'),
                limit(100)
            );
            const snapshot = await getDocs(q);
            const data = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data() as Omit<Transaction, 'id'>,
            }));
            setTransactions(data);
            setFilteredTransactions(data);
        } catch (error) {
            console.error('Error fetching transactions:', error);
            setError('거래 내역을 불러오는데 실패했습니다.');
        } finally {
            setLoading(false);
        }
    };

    const filterTransactions = () => {
        if (!searchQuery) {
            setFilteredTransactions(transactions);
            return;
        }

        const filtered = transactions.filter(t =>
            t.user_id?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            t.paypal_subscription_id?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            t.type?.toLowerCase().includes(searchQuery.toLowerCase())
        );
        setFilteredTransactions(filtered);
    };

    const getTransactionTypeBadge = (type: string) => {
        const variants: Record<string, { color: string; label: string }> = {
            subscription_activated: { color: 'bg-green-500/20 text-green-500', label: '구독 활성화' },
            subscription_cancelled: { color: 'bg-red-500/20 text-red-500', label: '구독 취소' },
            payment_completed: { color: 'bg-blue-500/20 text-blue-500', label: '결제 완료' },
        };

        const variant = variants[type] || { color: 'bg-gray-500/20 text-gray-500', label: type };

        return (
            <Badge className={variant.color}>
                {variant.label}
            </Badge>
        );
    };

    if (error) {
        return <ErrorState onRetry={fetchTransactions} />;
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold mb-2">거래 내역</h1>
                <p className="text-muted-foreground">
                    {loading ? <Skeleton className="h-4 w-[120px]" /> : `전체 ${transactions.length}건의 거래`}
                </p>
            </div>

            {/* Search */}
            <Card className="bg-card/40 backdrop-blur-md border-white/5">
                <CardContent className="pt-6">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                            placeholder="사용자 ID, 구독 ID, 거래 타입으로 검색..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-10 bg-background/50 border-white/10"
                            aria-label="거래 내역 검색"
                        />
                    </div>
                </CardContent>
            </Card>

            {/* Transactions List */}
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
                    filteredTransactions.map((transaction) => (
                        <Card key={transaction.id} className="bg-card/40 backdrop-blur-md border-white/5 hover:bg-card/60 transition-colors">
                            <CardContent className="pt-6">
                                <div className="flex items-start justify-between flex-col md:flex-row gap-4">
                                    <div className="space-y-2 flex-1 w-full">
                                        <div className="flex items-center gap-2">
                                            {getTransactionTypeBadge(transaction.type)}
                                            {transaction.amount && (
                                                <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/50">
                                                    <DollarSign className="w-3 h-3 mr-1" />
                                                    {transaction.currency} {transaction.amount}
                                                </Badge>
                                            )}
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                                            <div className="flex items-center gap-2 text-muted-foreground">
                                                <User className="w-4 h-4" />
                                                <span className="truncate max-w-[200px]">사용자 ID: {transaction.user_id || 'N/A'}</span>
                                            </div>
                                            <div className="flex items-center gap-2 text-muted-foreground">
                                                <Calendar className="w-4 h-4" />
                                                {transaction.created_at?.toDate?.()?.toLocaleString('ko-KR') || '날짜 없음'}
                                            </div>
                                        </div>

                                        <div className="flex flex-col gap-1 mt-1">
                                            {transaction.paypal_subscription_id && (
                                                <div className="text-xs text-muted-foreground font-mono">
                                                    구독 ID: {transaction.paypal_subscription_id}
                                                </div>
                                            )}
                                            {transaction.paypal_transaction_id && (
                                                <div className="text-xs text-muted-foreground font-mono">
                                                    거래 ID: {transaction.paypal_transaction_id}
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <Button size="sm" variant="outline" className="w-full md:w-auto" aria-label={`거래 ID ${transaction.id} 상세 보기`}>
                                        상세 보기
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    ))
                )}

                {!loading && filteredTransactions.length === 0 && (
                    <Card className="bg-card/40 backdrop-blur-md border-white/5">
                        <CardContent className="py-12 text-center text-muted-foreground">
                            {searchQuery ? '검색 결과가 없습니다' : '거래 내역이 없습니다'}
                        </CardContent>
                    </Card>
                )}
            </div>
        </div>
    );
}
