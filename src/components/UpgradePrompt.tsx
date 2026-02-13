'use client';

import { useSubscription } from '@/hooks/useSubscription';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { X, Sparkles } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface UpgradePromptProps {
    feature: string;
    usageType?: 'trend' | 'keyword';
    onClose?: () => void;
}

export default function UpgradePrompt({ feature, usageType, onClose }: UpgradePromptProps) {
    const router = useRouter();
    const { checkUsageLimit } = useSubscription();

    const usageLimitInfo = usageType ? checkUsageLimit(usageType) : null;

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <Card className="max-w-md w-full border-primary/20 shadow-2xl">
                <CardHeader className="relative">
                    {onClose && (
                        <button
                            onClick={onClose}
                            className="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    )}
                    <div className="flex items-center gap-2 mb-2">
                        <Sparkles className="w-6 h-6 text-yellow-500" />
                        <CardTitle className="text-2xl">업그레이드가 필요합니다</CardTitle>
                    </div>
                    <CardDescription>
                        {feature} 기능을 사용하려면 Pro 플랜으로 업그레이드하세요
                    </CardDescription>
                </CardHeader>

                <CardContent className="space-y-6">
                    {/* Usage Info */}
                    {usageLimitInfo && (
                        <div className="p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                            <p className="text-sm font-medium mb-1">무료 플랜 사용량</p>
                            <div className="flex items-baseline gap-2">
                                <span className="text-2xl font-bold">{usageLimitInfo.current}</span>
                                <span className="text-muted-foreground">/ {usageLimitInfo.limit}</span>
                                <span className="text-sm text-muted-foreground ml-auto">
                                    {usageType === 'trend' ? '이번 주' : '이번 달'}
                                </span>
                            </div>
                            <div className="mt-2 h-2 bg-secondary rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-yellow-500 transition-all"
                                    style={{
                                        width: `${(usageLimitInfo.current / usageLimitInfo.limit) * 100}%`,
                                    }}
                                />
                            </div>
                        </div>
                    )}

                    {/* Pro Benefits */}
                    <div className="space-y-3">
                        <p className="font-semibold">Pro 플랜으로 업그레이드하면:</p>
                        <ul className="space-y-2 text-sm">
                            <li className="flex items-start gap-2">
                                <span className="text-green-500 mt-0.5">✓</span>
                                <span>무제한 트렌드 분석</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-green-500 mt-0.5">✓</span>
                                <span>무제한 키워드 검색</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-green-500 mt-0.5">✓</span>
                                <span>고급 AI 분석 (10개 아이디어)</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-green-500 mt-0.5">✓</span>
                                <span>자막 추출 기능</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-green-500 mt-0.5">✓</span>
                                <span>우선 이메일 지원</span>
                            </li>
                        </ul>
                    </div>

                    {/* Pricing */}
                    <div className="p-4 bg-primary/10 rounded-lg text-center">
                        <p className="text-sm text-muted-foreground mb-1">단돈</p>
                        <div className="flex items-baseline justify-center gap-2">
                            <span className="text-4xl font-bold">$9</span>
                            <span className="text-muted-foreground">/월</span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                            연간 결제 시 2개월 무료 ($90/년)
                        </p>
                    </div>

                    {/* CTA Buttons */}
                    <div className="flex gap-3">
                        <Button
                            variant="outline"
                            className="flex-1"
                            onClick={onClose}
                        >
                            나중에
                        </Button>
                        <Button
                            className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                            onClick={() => router.push('/pricing')}
                        >
                            지금 업그레이드
                        </Button>
                    </div>

                    {/* Fine Print */}
                    <p className="text-xs text-center text-muted-foreground">
                        7일 이내 100% 환불 보장 • 언제든지 취소 가능
                    </p>
                </CardContent>
            </Card>
        </div>
    );
}
