'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Settings, Key, DollarSign, Users, Zap, Save, Loader2 } from 'lucide-react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { firestore } from '@/lib/firebase.config';
import { toast } from 'sonner';

export default function SettingsPage() {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // API Keys (Demo only - usually stored in env or secure backend)
    const [apiKeys, setApiKeys] = useState({
        youtube: '****************************',
        gemini: '****************************',
        paypal: '****************************',
    });

    const [pricing, setPricing] = useState<{
        pro: number;
        enterprise: number;
        proMonthlyId?: string;
        proAnnualId?: string;
        enterpriseMonthlyId?: string;
        enterpriseAnnualId?: string;
    }>({
        pro: 9,
        enterprise: 99,
        proMonthlyId: '',
        proAnnualId: '',
        enterpriseMonthlyId: '',
        enterpriseAnnualId: '',
    });

    const [limits, setLimits] = useState({
        freeTrendLimit: 3,
        freeKeywordLimit: 5
    });

    const [isConfirmOpen, setIsConfirmOpen] = useState(false);

    const handleSaveClick = () => {
        setIsConfirmOpen(true);
    };

    const handleConfirmSave = async () => {
        setIsConfirmOpen(false);
        await savePricing();
    };

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        try {
            const docRef = doc(firestore, 'settings', 'global');
            const docSnap = await getDoc(docRef);

            if (docSnap.exists()) {
                const data = docSnap.data();
                if (data.pricing) setPricing(data.pricing);
                if (data.limits) setLimits(data.limits);
            }
        } catch (error) {
            console.error('Error fetching settings:', error);
            toast.error('설정을 불러오는데 실패했습니다.');
        } finally {
            setLoading(false);
        }
    };

    const ensureProductExists = async (currentSettings: any) => {
        if (currentSettings.paypalProductId) return currentSettings.paypalProductId;

        try {
            const response = await fetch('/api/paypal/create-product', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: 'Next Shorts Subscription', description: 'Auto-created product for subscriptions' })
            });
            const data = await response.json();
            if (data.productId) {
                // Save product ID immediately
                const docRef = doc(firestore, 'settings', 'global');
                await setDoc(docRef, { paypalProductId: data.productId }, { merge: true });
                return data.productId;
            }
        } catch (error) {
            console.error('Failed to create product:', error);
            throw new Error('PayPal Product 생성 실패');
        }
        return null;
    };

    const createNewPlan = async (productId: string, name: string, price: number, interval: 'MONTH' | 'YEAR') => {
        const response = await fetch('/api/paypal/create-plan', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                productId,
                name,
                description: `${name} Subscription`,
                price,
                intervalUnit: interval,
                intervalCount: 1
            })
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.details || 'Plan creation failed');
        return data.planId;
    };

    const savePricing = async () => {
        setSaving(true);
        try {
            const docRef = doc(firestore, 'settings', 'global');
            const docSnap = await getDoc(docRef);
            const currentSettings = docSnap.exists() ? docSnap.data() : {};
            const oldPricing = currentSettings.pricing || {};

            let productId = await ensureProductExists(currentSettings);
            if (!productId) throw new Error('PayPal Product ID를 찾을 수 없습니다.');

            const newPricing = { ...pricing };

            // Check if Pro Price changed
            if (pricing.pro !== oldPricing.pro) {
                toast.info('Pro 플랜 가격 변경 감지: 새 PayPal Plan 생성 중...');
                newPricing.proMonthlyId = await createNewPlan(productId, 'Pro Monthly', pricing.pro, 'MONTH');
                newPricing.proAnnualId = await createNewPlan(productId, 'Pro Annual', pricing.pro * 10, 'YEAR'); // Assuming 10x for annual
            }

            // Check if Enterprise Price changed
            if (pricing.enterprise !== oldPricing.enterprise) {
                toast.info('Enterprise 플랜 가격 변경 감지: 새 PayPal Plan 생성 중...');
                newPricing.enterpriseMonthlyId = await createNewPlan(productId, 'Enterprise Monthly', pricing.enterprise, 'MONTH');
                newPricing.enterpriseAnnualId = await createNewPlan(productId, 'Enterprise Annual', pricing.enterprise * 10, 'YEAR');
            }

            await setDoc(docRef, { pricing: newPricing }, { merge: true });
            setPricing(newPricing);
            toast.success('가격 및 PayPal 플랜이 성공적으로 업데이트되었습니다.');
        } catch (error) {
            console.error('Error saving pricing:', error);
            toast.error(`저장 실패: ${(error as Error).message}`);
        } finally {
            setSaving(false);
        }
    };

    const saveLimits = async () => {
        setSaving(true);
        try {
            const docRef = doc(firestore, 'settings', 'global');
            await setDoc(docRef, { limits }, { merge: true });
            toast.success('사용량 제한 설정이 저장되었습니다.');
        } catch (error) {
            console.error('Error saving limits:', error);
            toast.error('설정 저장 실패');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return <div className="flex justify-center p-8"><Loader2 className="animate-spin" /></div>;
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold mb-2">시스템 설정</h1>
                <p className="text-muted-foreground">플랫폼 설정 및 관리</p>
            </div>

            {/* API Keys */}
            <Card>
                <CardHeader>
                    <div className="flex items-center gap-2">
                        <Key className="w-5 h-5" />
                        <CardTitle>API 키 관리</CardTitle>
                    </div>
                    <CardDescription>
                        외부 서비스 API 키 설정 (보안을 위해 마스킹 처리됨)
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div>
                        <label className="text-sm font-medium mb-2 block">YouTube Data API</label>
                        <div className="flex gap-2">
                            <Input
                                type="password"
                                value={apiKeys.youtube}
                                onChange={(e) => setApiKeys({ ...apiKeys, youtube: e.target.value })}
                                placeholder="YouTube API Key"
                                disabled
                            />
                            <Button variant="outline" disabled>수정 불가</Button>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">환경 변수(.env.local)에서 관리됩니다.</p>
                    </div>
                </CardContent>
            </Card>

            {/* Pricing */}
            <Card>
                <CardHeader>
                    <div className="flex items-center gap-2">
                        <DollarSign className="w-5 h-5" />
                        <CardTitle>가격 설정</CardTitle>
                    </div>
                    <CardDescription>
                        구독 플랜 가격 조정 (저장 시 실시간 반영)
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="grid gap-6 md:grid-cols-2">
                        {/* Pro Plan */}
                        <div className="space-y-4 p-4 border rounded-lg">
                            <h3 className="font-semibold text-lg flex items-center gap-2">
                                <Zap className="w-4 h-4 text-yellow-500" /> Pro Plan
                            </h3>

                            <div>
                                <label className="text-sm font-medium mb-1.5 block">월간 가격 ($)</label>
                                <Input
                                    type="number"
                                    step="0.1"
                                    value={pricing.pro}
                                    onChange={(e) => setPricing({ ...pricing, pro: Number(e.target.value) })}
                                />
                            </div>

                            <div>
                                <label className="text-sm font-medium mb-1.5 block">Monthly Plan ID</label>
                                <Input
                                    value={pricing.proMonthlyId || ''}
                                    onChange={(e) => setPricing({ ...pricing, proMonthlyId: e.target.value })}
                                    placeholder="P-..."
                                    className="font-mono text-xs"
                                />
                                <p className="text-[10px] text-muted-foreground mt-1">
                                    Env: {process.env.NEXT_PUBLIC_PAYPAL_PLAN_ID_PRO_MONTHLY}
                                </p>
                                <p className="text-[10px] text-red-500 mt-0.5">
                                    * Plan ID는 대소문자를 구분하며 'P-'로 시작해야 합니다.
                                </p>
                            </div>

                            <div>
                                <label className="text-sm font-medium mb-1.5 block">Annual Plan ID</label>
                                <Input
                                    value={pricing.proAnnualId || ''}
                                    onChange={(e) => setPricing({ ...pricing, proAnnualId: e.target.value })}
                                    placeholder="P-..."
                                    className="font-mono text-xs"
                                />
                                <p className="text-[10px] text-muted-foreground mt-1">
                                    Env: {process.env.NEXT_PUBLIC_PAYPAL_PLAN_ID_PRO_ANNUAL}
                                </p>
                                <p className="text-[10px] text-red-500 mt-0.5">
                                    * Plan ID는 대소문자를 구분하며 'P-'로 시작해야 합니다.
                                </p>
                            </div>
                        </div>

                        {/* Enterprise Plan */}
                        <div className="space-y-4 p-4 border rounded-lg">
                            <h3 className="font-semibold text-lg flex items-center gap-2">
                                <Users className="w-4 h-4 text-blue-500" /> Enterprise Plan
                            </h3>

                            <div>
                                <label className="text-sm font-medium mb-1.5 block">월간 가격 ($)</label>
                                <Input
                                    type="number"
                                    step="0.1"
                                    value={pricing.enterprise}
                                    onChange={(e) => setPricing({ ...pricing, enterprise: Number(e.target.value) })}
                                />
                            </div>

                            <div>
                                <label className="text-sm font-medium mb-1.5 block">Monthly Plan ID</label>
                                <Input
                                    value={pricing.enterpriseMonthlyId || ''}
                                    onChange={(e) => setPricing({ ...pricing, enterpriseMonthlyId: e.target.value })}
                                    placeholder="P-..."
                                    className="font-mono text-xs"
                                />
                                <p className="text-[10px] text-muted-foreground mt-1">
                                    Env: {process.env.NEXT_PUBLIC_PAYPAL_PLAN_ID_ENTERPRISE_MONTHLY}
                                </p>
                            </div>

                            <div>
                                <label className="text-sm font-medium mb-1.5 block">Annual Plan ID</label>
                                <Input
                                    value={pricing.enterpriseAnnualId || ''}
                                    onChange={(e) => setPricing({ ...pricing, enterpriseAnnualId: e.target.value })}
                                    placeholder="P-..."
                                    className="font-mono text-xs"
                                />
                                <p className="text-[10px] text-muted-foreground mt-1">
                                    Env: {process.env.NEXT_PUBLIC_PAYPAL_PLAN_ID_ENTERPRISE_ANNUAL}
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="pt-4 border-t">
                        <Button onClick={handleSaveClick} disabled={saving}>
                            {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                            가격 및 플랜 저장
                        </Button>
                        <p className="text-xs text-muted-foreground mt-2">
                            PayPal Plan이 자동으로 생성/업데이트됩니다. 필요시 수동으로 ID를 수정할 수도 있습니다.
                        </p>
                    </div>
                </CardContent>
            </Card>

            {/* Usage Limits */}
            <Card>
                <CardHeader>
                    <div className="flex items-center gap-2">
                        <Zap className="w-5 h-5" />
                        <CardTitle>사용량 제한</CardTitle>
                    </div>
                    <CardDescription>
                        Free 티어 사용량 제한 설정
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div>
                        <label className="text-sm font-medium mb-2 block">주간 트렌드 분석 제한</label>
                        <div className="flex gap-2 items-center">
                            <Input
                                type="number"
                                value={limits.freeTrendLimit}
                                onChange={(e) => setLimits({ ...limits, freeTrendLimit: Number(e.target.value) })}
                                className="max-w-32"
                            />
                            <span className="text-muted-foreground">회/주</span>
                        </div>
                    </div>

                    <div>
                        <label className="text-sm font-medium mb-2 block">월간 키워드 검색 제한</label>
                        <div className="flex gap-2 items-center">
                            <Input
                                type="number"
                                value={limits.freeKeywordLimit}
                                onChange={(e) => setLimits({ ...limits, freeKeywordLimit: Number(e.target.value) })}
                                className="max-w-32"
                            />
                            <span className="text-muted-foreground">회/월</span>
                        </div>
                    </div>

                    <div className="pt-4 border-t">
                        <Button onClick={saveLimits} disabled={saving}>
                            {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                            제한 설정 저장
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Confirmation Modal */}
            {
                isConfirmOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
                        <div className="bg-card border rounded-lg shadow-lg p-6 max-w-sm w-full mx-4">
                            <h3 className="text-lg font-semibold mb-2">변경사항 저장 확인</h3>
                            <p className="text-sm text-muted-foreground mb-4">
                                가격 정책 및 플랜 ID가 변경됩니다.<br />
                                정말 저장하시겠습니까?
                            </p>
                            <div className="flex justify-end gap-2">
                                <Button variant="outline" onClick={() => setIsConfirmOpen(false)}>
                                    취소
                                </Button>
                                <Button onClick={handleConfirmSave}>
                                    확인
                                </Button>
                            </div>
                        </div>
                    </div>
                )
            }
        </div >
    );
}
