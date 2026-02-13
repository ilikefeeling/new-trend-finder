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

    const [pricing, setPricing] = useState({
        pro: 9,
        enterprise: 99,
    });

    const [limits, setLimits] = useState({
        freeTrendLimit: 3,
        freeKeywordLimit: 5
    });

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

    const savePricing = async () => {
        setSaving(true);
        try {
            const docRef = doc(firestore, 'settings', 'global');
            await setDoc(docRef, { pricing }, { merge: true });
            toast.success('가격 설정이 저장되었습니다.');
        } catch (error) {
            console.error('Error saving pricing:', error);
            toast.error('가격 설정 저장 실패');
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
                <CardContent className="space-y-4">
                    <div>
                        <label className="text-sm font-medium mb-2 block">Pro 플랜 (월간)</label>
                        <div className="flex gap-2 items-center">
                            <span className="text-2xl font-bold">$</span>
                            <Input
                                type="number"
                                value={pricing.pro}
                                onChange={(e) => setPricing({ ...pricing, pro: Number(e.target.value) })}
                                className="max-w-32"
                            />
                            <span className="text-muted-foreground">/월</span>
                        </div>
                    </div>

                    <div>
                        <label className="text-sm font-medium mb-2 block">Enterprise 플랜 (월간)</label>
                        <div className="flex gap-2 items-center">
                            <span className="text-2xl font-bold">$</span>
                            <Input
                                type="number"
                                value={pricing.enterprise}
                                onChange={(e) => setPricing({ ...pricing, enterprise: Number(e.target.value) })}
                                className="max-w-32"
                            />
                            <span className="text-muted-foreground">/월</span>
                        </div>
                    </div>

                    <div className="pt-4 border-t">
                        <Button onClick={savePricing} disabled={saving}>
                            {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                            가격 변경 적용
                        </Button>
                        <p className="text-xs text-muted-foreground mt-2">
                            주의: 가격 변경은 신규 구독자에게만 적용됩니다.
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
        </div>
    );
}
