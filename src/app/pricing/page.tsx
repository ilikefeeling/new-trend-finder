'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSubscription } from '@/hooks/useSubscription';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check, Sparkles, Zap, Crown, ArrowRight } from 'lucide-react';
import { PayPalScriptProvider, PayPalButtons } from '@paypal/react-paypal-js';

export default function PricingPage() {
    const router = useRouter();
    const { user, getTierName } = useSubscription();
    const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('monthly');
    const [prices, setPrices] = useState({ pro: 9, enterprise: 99 });

    // Fetch pricing from Firestore
    useEffect(() => {
        const fetchPricing = async () => {
            const { doc, getDoc } = await import('firebase/firestore');
            const { firestore } = await import('@/lib/firebase.config');

            try {
                const docRef = doc(firestore, 'settings', 'global');
                const docSnap = await getDoc(docRef);
                if (docSnap.exists() && docSnap.data().pricing) {
                    setPrices(docSnap.data().pricing);
                }
            } catch (e) {
                console.error("Failed to load pricing", e);
            }
        };
        fetchPricing();
    }, []);

    const plans = {
        monthly: {
            pro: prices.pro,
            enterprise: prices.enterprise,
        },
        annual: {
            pro: prices.pro * 10, // 2 months free equivalent logic
            enterprise: prices.enterprise * 10,
        },
    };

    const pricingTiers = [
        {
            id: 'free',
            name: 'Free',
            icon: Sparkles,
            price: 0,
            description: '개인 크리에이터를 위한 시작',
            features: [
                '주 3회 트렌드 분석',
                '월 5회 키워드 검색',
                '기본 AI 아이디어 (3개)',
                '커뮤니티 지원',
            ],
            limitations: [
                '고급 AI 분석 미제공',
                '자막 추출 불가',
                '우선 지원 없음',
            ],
            cta: '무료로 시작하기',
            isCurrent: user?.subscription.tier === 'free',
        },
        {
            id: 'pro',
            name: 'Pro',
            icon: Zap,
            price: plans[billingCycle].pro,
            popular: true,
            description: '성장하는 크리에이터를 위한 필수',
            features: [
                '무제한 트렌드 분석',
                '무제한 키워드 검색',
                '고급 AI 분석 (10개 아이디어)',
                '자막 추출 기능',
                '우선 이메일 지원',
                'API 액세스',
            ],
            limitations: [],
            cta: 'Pro로 업그레이드',
            isCurrent: user?.subscription.tier === 'pro',
        },
        {
            id: 'enterprise',
            name: 'Enterprise',
            icon: Crown,
            price: plans[billingCycle].enterprise,
            description: '전문 팀을 위한 프리미엄',
            features: [
                'Pro의 모든 기능',
                '팀 협업 (5명)',
                '전용 계정 매니저',
                '맞춤형 통합',
                'SLA 보장',
                '우선 기술 지원',
            ],
            limitations: [],
            cta: 'Enterprise 문의',
            isCurrent: user?.subscription.tier === 'enterprise',
        },
    ];

    if (!user) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background">
                <div className="text-center">
                    <p className="text-muted-foreground mb-4">로그인이 필요합니다</p>
                    <Button onClick={() => router.push('/login')}>로그인하기</Button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background py-12 px-4">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="text-center mb-12">
                    <Badge variant="outline" className="mb-4">
                        현재 플랜: {getTierName()}
                    </Badge>
                    <h1 className="text-4xl md:text-5xl font-bold mb-4">
                        성장에 맞는 플랜을 선택하세요
                    </h1>
                    <div className="absolute top-4 left-4 md:top-8 md:left-8">
                        <Button variant="ghost" onClick={() => router.push('/dashboard')} className="gap-2">
                            <ArrowRight className="w-4 h-4 rotate-180" />
                            대시보드로 돌아가기
                        </Button>
                    </div>

                    <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                        무료로 시작하고, 필요할 때 업그레이드하세요
                    </p>

                    {/* Billing Toggle */}
                    <div className="mt-8 inline-flex rounded-lg border border-primary/20 p-1 bg-secondary/30">
                        <button
                            onClick={() => setBillingCycle('monthly')}
                            className={`px-6 py-2 rounded-md text-sm font-medium transition-all ${billingCycle === 'monthly'
                                ? 'bg-primary text-primary-foreground shadow-sm'
                                : 'text-muted-foreground hover:text-foreground'
                                }`}
                        >
                            월간 결제
                        </button>
                        <button
                            onClick={() => setBillingCycle('annual')}
                            className={`px-6 py-2 rounded-md text-sm font-medium transition-all ${billingCycle === 'annual'
                                ? 'bg-primary text-primary-foreground shadow-sm'
                                : 'text-muted-foreground hover:text-foreground'
                                }`}
                        >
                            연간 결제
                            <span className="ml-2 text-xs text-green-500">2개월 무료 🎉</span>
                        </button>
                    </div>
                </div>

                {/* Pricing Cards */}
                <div className="grid md:grid-cols-3 gap-8 mb-12">
                    {pricingTiers.map((tier) => {
                        const Icon = tier.icon;
                        return (
                            <Card
                                key={tier.id}
                                className={`relative ${tier.popular
                                    ? 'border-2 border-primary shadow-xl scale-105'
                                    : 'border-primary/10'
                                    } ${tier.isCurrent ? 'ring-2 ring-green-500' : ''}`}
                            >
                                {tier.popular && (
                                    <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                                        <Badge className="bg-primary text-primary-foreground px-4 py-1">
                                            ⭐ 가장 인기 있는 플랜
                                        </Badge>
                                    </div>
                                )}
                                {tier.isCurrent && (
                                    <div className="absolute -top-3 right-4 z-10">
                                        <Badge className="bg-green-600 hover:bg-green-700 text-white shadow-lg border-0 text-sm px-3 py-1">
                                            현재 사용 중
                                        </Badge>
                                    </div>
                                )}

                                <CardHeader>
                                    <div className="flex items-center gap-2 mb-2">
                                        <Icon className="w-6 h-6 text-primary" />
                                        <CardTitle className="text-2xl">{tier.name}</CardTitle>
                                    </div>
                                    <CardDescription>{tier.description}</CardDescription>
                                    <div className="mt-4">
                                        <span className="text-4xl font-bold">
                                            ${tier.price}
                                        </span>
                                        {tier.price > 0 && (
                                            <span className="text-muted-foreground ml-2">
                                                /{billingCycle === 'monthly' ? '월' : '년'}
                                            </span>
                                        )}
                                    </div>
                                </CardHeader>

                                <CardContent className="space-y-6">
                                    {/* Features */}
                                    <div className="space-y-3">
                                        {tier.features.map((feature, idx) => (
                                            <div key={idx} className="flex items-start gap-3">
                                                <Check className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
                                                <span className="text-sm">{feature}</span>
                                            </div>
                                        ))}
                                    </div>

                                    {/* CTA Button */}
                                    {tier.id === 'free' ? (
                                        <Button
                                            variant="outline"
                                            className="w-full"
                                            disabled={tier.isCurrent}
                                            onClick={() => router.push('/dashboard')}
                                        >
                                            {tier.isCurrent ? '현재 플랜' : tier.cta}
                                        </Button>
                                    ) : tier.isCurrent ? (
                                        <Button variant="outline" className="w-full" disabled>
                                            현재 사용 중
                                        </Button>
                                    ) : tier.id === 'enterprise' ? (
                                        <Button className="w-full group" onClick={() => window.location.href = 'mailto:support@nextshorts.com'}>
                                            {tier.cta}
                                            <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                                        </Button>
                                    ) : (
                                        <PayPalScriptProvider
                                            options={{
                                                clientId: process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID || '',
                                                vault: true,
                                                intent: 'subscription',
                                            }}
                                        >
                                            <div className="w-full">
                                                <PayPalButtons
                                                    style={{ layout: 'vertical', label: 'subscribe' }}
                                                    createSubscription={async (data, actions) => {
                                                        // TODO: Implement subscription creation
                                                        return '';
                                                    }}
                                                    onApprove={async (data, actions) => {
                                                        // TODO: Implement subscription approval
                                                        console.log('Subscription approved:', data);
                                                    }}
                                                />
                                            </div>
                                        </PayPalScriptProvider>
                                    )}
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>

                {/* FAQ or Additional Info */}
                <div className="max-w-3xl mx-auto text-center">
                    <h2 className="text-2xl font-bold mb-4">자주 묻는 질문</h2>
                    <div className="space-y-4 text-left">
                        <details className="group p-4 bg-card rounded-lg border border-primary/10">
                            <summary className="font-semibold cursor-pointer">
                                언제든지 플랜을 변경할 수 있나요?
                            </summary>
                            <p className="mt-2 text-sm text-muted-foreground">
                                네, 언제든지 플랜을 업그레이드하거나 다운그레이드할 수 있습니다. 업그레이드 시 즉시 적용되며, 다운그레이드는 현재 결제 주기가 끝난 후 적용됩니다.
                            </p>
                        </details>
                        <details className="group p-4 bg-card rounded-lg border border-primary/10">
                            <summary className="font-semibold cursor-pointer">
                                환불 정책은 어떻게 되나요?
                            </summary>
                            <p className="mt-2 text-sm text-muted-foreground">
                                구독 후 7일 이내에는 100% 환불이 가능합니다. 그 이후에는 남은 기간에 대한 일할 계산 환불이 가능합니다.
                            </p>
                        </details>
                        <details className="group p-4 bg-card rounded-lg border border-primary/10">
                            <summary className="font-semibold cursor-pointer">
                                결제는 안전한가요?
                            </summary>
                            <p className="mt-2 text-sm text-muted-foreground">
                                모든 결제는 PayPal을 통해 안전하게 처리됩니다. 저희는 고객의 결제 정보를 직접 저장하지 않습니다.
                            </p>
                        </details>
                    </div>
                </div>
            </div>
        </div>
    );
}
