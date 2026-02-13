'use client';

import { useSubscription } from '@/hooks/useSubscription';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Check, Info } from 'lucide-react';

interface FreeTierUsageModalProps {
    onClose: () => void;
}

export default function FreeTierUsageModal({ onClose }: FreeTierUsageModalProps) {
    const { checkUsageLimit } = useSubscription();

    const trendLimit = checkUsageLimit('trend');
    const keywordLimit = checkUsageLimit('keyword');

    return (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 animate-in fade-in duration-300">
            <Card className="max-w-md w-full border-primary/20 shadow-2xl bg-background/95 backdrop-blur">
                <CardHeader>
                    <div className="flex items-center gap-2 mb-2">
                        <Info className="w-6 h-6 text-blue-500" />
                        <CardTitle className="text-xl">Free 플랜 이용 현황</CardTitle>
                    </div>
                    <CardDescription>
                        현재 이용 가능한 무료 크레딧 잔여량입니다.
                    </CardDescription>
                </CardHeader>

                <CardContent className="space-y-6">
                    {/* Trend Analysis Usage */}
                    <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                            <span className="font-medium text-muted-foreground">트렌드 분석 (주간)</span>
                            <span className="font-bold">{trendLimit.current} / {trendLimit.limit}회</span>
                        </div>
                        <div className="h-2.5 bg-secondary rounded-full overflow-hidden">
                            <div
                                className="h-full bg-blue-500 transition-all duration-500"
                                style={{ width: `${Math.min((trendLimit.current / trendLimit.limit) * 100, 100)}%` }}
                            />
                        </div>
                    </div>

                    {/* Keyword Search Usage */}
                    <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                            <span className="font-medium text-muted-foreground">키워드 검색 (월간)</span>
                            <span className="font-bold">{keywordLimit.current} / {keywordLimit.limit}회</span>
                        </div>
                        <div className="h-2.5 bg-secondary rounded-full overflow-hidden">
                            <div
                                className="h-full bg-purple-500 transition-all duration-500"
                                style={{ width: `${Math.min((keywordLimit.current / keywordLimit.limit) * 100, 100)}%` }}
                            />
                        </div>
                    </div>

                    <div className="p-3 bg-secondary/30 rounded-lg text-xs text-muted-foreground mt-4">
                        <p className="flex gap-2">
                            <span className="shrink-0">💡</span>
                            <span>더 많은 분석이 필요하시다면 Pro 플랜으로 무제한 이용해보세요!</span>
                        </p>
                    </div>

                    <Button
                        className="w-full mt-4"
                        onClick={onClose}
                        size="lg"
                    >
                        확인
                    </Button>
                </CardContent>
            </Card>
        </div>
    );
}
