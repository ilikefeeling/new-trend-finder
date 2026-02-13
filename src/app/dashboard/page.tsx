'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Loader2, Search, TrendingUp, Sparkles, Youtube, Globe, Languages, HelpCircle, BookOpen, CheckCircle2, Shield } from "lucide-react";
import UserProfile from "@/components/UserProfile";
import { useSubscription } from "@/hooks/useSubscription";
import UpgradePrompt from "@/components/UpgradePrompt";
import FreeTierUsageModal from "@/components/FreeTierUsageModal";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";

export default function Dashboard() {
    const { checkUsageLimit, isPro } = useSubscription();
    const { user } = useAuth(); // Get current user to check admin role
    const router = useRouter(); // Add router for navigation
    const [isTrendLoading, setIsTrendLoading] = useState(false);
    const [showFreeUsageModal, setShowFreeUsageModal] = useState(false);

    // Debug: Check user role
    useEffect(() => {
        console.log('Current user:', user);
        console.log('User role:', user?.role);
        console.log('Is admin?', user?.role === 'admin');
    }, [user]);

    useEffect(() => {
        // Show free usage modal once per session for free users
        if (user && !isPro() && !sessionStorage.getItem('freeUsageShown')) {
            setShowFreeUsageModal(true);
            sessionStorage.setItem('freeUsageShown', 'true');
        }
    }, [user, isPro]);

    const [trendData, setTrendData] = useState<any>(null);
    const [region, setRegion] = useState('KR');
    const [keyword, setKeyword] = useState('');
    const [isOutlierLoading, setIsOutlierLoading] = useState(false);
    const [outlierData, setOutlierData] = useState<any>(null);
    const [viralPlans, setViralPlans] = useState<any[]>([]);
    const [isViralLoading, setIsViralLoading] = useState(false);
    const [showUpgradePrompt, setShowUpgradePrompt] = useState<{ show: boolean; feature: string; type?: 'trend' | 'keyword' }>({ show: false, feature: '' });

    const REGIONS = [
        { code: 'KR', label: 'Korea 🇰🇷' },
        { code: 'US', label: 'USA 🌐' },
        { code: 'JP', label: 'Japan 🇯🇵' },
        { code: 'GB', label: 'UK 🇬🇧' },
        { code: 'IN', label: 'India 🇮🇳' },
        { code: 'DE', label: 'Germany 🇩🇪' },
        { code: 'FR', label: 'France 🇫🇷' },
        { code: 'BR', label: 'Brazil 🇧🇷' },
    ];

    const fetchTrends = async () => {
        // Check usage limit for free users
        const usageCheck = checkUsageLimit('trend');
        if (!usageCheck.allowed) {
            setShowUpgradePrompt({ show: true, feature: '트렌드 분석', type: 'trend' });
            return;
        }

        setIsTrendLoading(true);
        setTrendData(null); // Reset previous data
        try {
            const res = await fetch(`/api/trend?region=${region}`);
            const data = await res.json();

            // Check if API returned an error
            if (!res.ok || data.error) {
                console.error('API Error:', data.error || data.details);
                alert(`트렌드 분석 실패: ${data.error || '알 수 없는 오류'}\n${data.details || ''}`);
                setTrendData(null);
                return;
            }

            setTrendData(data);
        } catch (e) {
            console.error('Fetch error:', e);
            alert('트렌드 데이터를 가져오는데 실패했습니다. 잠시 후 다시 시도해주세요.');
            setTrendData(null);
        } finally {
            setIsTrendLoading(false);
        }
    };

    const findOutliers = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!keyword) return;

        // Check usage limit for free users
        const usageCheck = checkUsageLimit('keyword');
        if (!usageCheck.allowed) {
            setShowUpgradePrompt({ show: true, feature: '키워드 검색', type: 'keyword' });
            return;
        }

        setIsOutlierLoading(true);
        setViralPlans([]); // Reset previous plans
        try {
            const res = await fetch('/api/outlier', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ keyword }),
            });
            const data = await res.json();
            setOutlierData(data);
        } catch (e) {
            console.error(e);
        } finally {
            setIsOutlierLoading(false);
        }
    };

    const generateViralPlans = async () => {
        if (!outlierData || outlierData.outliers.length === 0) return;
        const topOutlier = outlierData.outliers[0];

        setIsViralLoading(true);
        try {
            const res = await fetch('/api/viral-list', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    keyword,
                    outlierTitle: topOutlier.title,
                    ratio: topOutlier.ratio.toFixed(1)
                }),
            });
            const data = await res.json();
            if (data.success) {
                setViralPlans(data.viral_plans);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setIsViralLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-background text-foreground flex flex-col items-center p-4 md:p-8 animate-in fade-in duration-700">
            <header className="w-full max-w-6xl flex justify-between items-center mb-12">
                <div className="flex items-center gap-2">
                    <Youtube className="w-8 h-8 text-primary" />
                    <h1 className="text-2xl font-bold tracking-tighter">Next Shorts</h1>
                </div>
                <div className="flex items-center gap-4">
                    <Badge variant="outline" className="text-muted-foreground border-primary/20">Beta v1.0</Badge>
                    {/* Admin Panel Button - Only visible for admin users */}
                    {user?.role === 'admin' && (
                        <Button
                            variant="outline"
                            size="sm"
                            className="gap-2 border-primary/20 hover:bg-primary/10 transition-colors"
                            onClick={() => {
                                console.log('Admin Panel button clicked, navigating to /admin');
                                router.push('/admin');
                            }}
                        >
                            <Shield className="w-4 h-4" />
                            Admin Panel
                        </Button>
                    )}
                    <UserProfile />
                </div>
            </header>

            <main className="w-full max-w-6xl space-y-8">
                <section className="text-center space-y-4 mb-12">
                    <h2 className="text-4xl md:text-6xl font-extrabold tracking-tight">
                        Next Shorts <span className="text-primary italic">Starts Here.</span>
                    </h2>
                    <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
                        AI-driven YouTube Shorts analysis. 트렌드 분석, 성공 공식 역설계, 그리고 바이럴 아이디어 생성을 단 몇 초 만에 완료하세요.
                    </p>
                </section>

                <Tabs defaultValue="trend" className="w-full">
                    <TabsList className="grid w-full grid-cols-3 max-w-2xl mx-auto mb-8 bg-secondary/30 p-1.5 h-14 rounded-xl border border-primary/5">
                        <TabsTrigger
                            value="trend"
                            className="gap-2 text-base font-bold data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-lg transition-all"
                        >
                            <TrendingUp className="w-5 h-5" /> 트렌드 기반 자동 분석
                        </TabsTrigger>
                        <TabsTrigger
                            value="outlier"
                            className="gap-2 text-base font-bold data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-lg transition-all"
                        >
                            <Search className="w-5 h-5" /> 키워드 기반 바이럴 검색
                        </TabsTrigger>
                        <TabsTrigger
                            value="guide"
                            className="gap-2 text-base font-bold data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-lg transition-all"
                        >
                            <HelpCircle className="w-5 h-5" /> Guide
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="trend" className="space-y-6">
                        <div className="flex flex-col items-center gap-6 mb-8">
                            <div className="flex flex-wrap justify-center gap-2 max-w-2xl">
                                {REGIONS.map((r) => (
                                    <Button
                                        key={r.code}
                                        variant={region === r.code ? 'default' : 'outline'}
                                        size="sm"
                                        className="rounded-full px-4 h-9 border-primary/10"
                                        onClick={() => setRegion(r.code)}
                                    >
                                        {r.label}
                                    </Button>
                                ))}
                            </div>

                            <Button
                                size="lg"
                                onClick={fetchTrends}
                                disabled={isTrendLoading}
                                className="gap-2 px-8 hover:scale-105 transition-transform min-w-[240px]"
                            >
                                {isTrendLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <TrendingUp className="w-4 h-4" />}
                                Analyze {REGIONS.find(r => r.code === region)?.label} Trends
                            </Button>
                        </div>

                        {trendData && (
                            <div className="grid md:grid-cols-3 gap-6">
                                <Card className="md:col-span-1 border-primary/10 bg-card/50 backdrop-blur">
                                    <CardHeader>
                                        <CardTitle className="text-sm font-medium flex items-center gap-2">
                                            <Youtube className="w-4 h-4 text-primary" /> Source Trend
                                        </CardTitle>
                                        <CardDescription className="line-clamp-2">
                                            {trendData.original_video.title}
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <div className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
                                            {trendData.analysis.trend_analysis}
                                        </div>
                                    </CardContent>
                                </Card>

                                <div className="md:col-span-2 space-y-4">
                                    <h3 className="flex items-center gap-2 text-xl font-bold">
                                        <Sparkles className="w-5 h-5 text-yellow-500" /> AI Idea Recommendations
                                    </h3>
                                    <ScrollArea className="h-[500px] rounded-md border border-primary/5 p-4">
                                        <div className="space-y-6">
                                            {trendData.analysis.ideas.map((idea: any, idx: number) => (
                                                <div key={idx} className="p-4 rounded-xl border bg-secondary/30 space-y-3">
                                                    <h4 className="font-bold text-lg text-primary">{idea.title}</h4>
                                                    <div className="space-y-2">
                                                        <p className="text-sm"><strong>HOOK:</strong> {idea.hook}</p>
                                                        <p className="text-sm text-muted-foreground"><strong>SCRIPT:</strong> {idea.script_guide}</p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </ScrollArea>
                                </div>

                                {trendData.analysis.global_insight && (
                                    <Card className="md:col-span-3 border-yellow-500/20 bg-yellow-500/5">
                                        <CardHeader>
                                            <CardTitle className="text-lg flex items-center gap-2">
                                                <Languages className="w-5 h-5 text-yellow-500" />
                                                {region !== 'KR' ? 'Localization Strategy' : 'Trend Insights'}
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent className="grid md:grid-cols-2 gap-6">
                                            <div className="space-y-2">
                                                <h4 className="font-bold text-sm text-yellow-500 flex items-center gap-2">
                                                    <Globe className="w-4 h-4" /> Global Reaction
                                                </h4>
                                                <p className="text-sm leading-relaxed">{trendData.analysis.global_insight.reaction_summary}</p>
                                                <div className="flex flex-wrap gap-2 mt-2">
                                                    {trendData.analysis.global_insight.local_keywords?.map((kw: string, i: number) => (
                                                        <Badge key={i} variant="secondary" className="text-[10px]">{kw}</Badge>
                                                    ))}
                                                </div>
                                            </div>
                                            <div className="space-y-2">
                                                <h4 className="font-bold text-sm text-primary flex items-center gap-2">
                                                    <Sparkles className="w-4 h-4" /> {region}-Localization Strategy
                                                </h4>
                                                <p className="text-sm leading-relaxed">{trendData.analysis.global_insight.localization_strategy}</p>
                                            </div>
                                        </CardContent>
                                    </Card>
                                )}
                            </div>
                        )}
                    </TabsContent>

                    <TabsContent value="outlier" className="space-y-6 text-center">
                        <form onSubmit={findOutliers} className="max-w-xl mx-auto flex gap-2">
                            <Input
                                placeholder="Enter search keyword (e.g., 'vlog', 'comedy')..."
                                value={keyword}
                                onChange={(e) => setKeyword(e.target.value)}
                                className="h-12 bg-secondary/50 border-primary/10"
                            />
                            <Button type="submit" size="lg" disabled={isOutlierLoading} className="gap-2">
                                {isOutlierLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                                바이럴 분석 시작
                            </Button>
                        </form>

                        {outlierData && (
                            <div className="mt-8 text-left space-y-8">
                                <div className="grid md:grid-cols-5 gap-4">
                                    {outlierData.outliers.map((vid: any) => (
                                        <Card key={vid.id} className="bg-card border-primary/10 hover:border-primary/30 transition-all group overflow-hidden">
                                            <CardContent className="p-0">
                                                <div className="p-4 space-y-3">
                                                    <div className="flex items-center gap-2">
                                                        <a
                                                            href={`https://www.youtube.com/channel/${vid.channelId}`}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="shrink-0"
                                                        >
                                                            <img
                                                                src={vid.channelThumbnail}
                                                                alt={vid.channelTitle}
                                                                className="w-8 h-8 rounded-full border border-primary/20 hover:scale-110 transition-transform"
                                                            />
                                                        </a>
                                                        <div className="min-w-0">
                                                            <a
                                                                href={`https://www.youtube.com/channel/${vid.channelId}`}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="text-[10px] font-bold text-muted-foreground hover:text-primary transition-colors truncate block"
                                                            >
                                                                {vid.channelTitle}
                                                            </a>
                                                        </div>
                                                    </div>

                                                    <a
                                                        href={`https://www.youtube.com/watch?v=${vid.id}`}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="block text-xs font-bold line-clamp-2 hover:text-primary transition-colors h-8"
                                                    >
                                                        {vid.title}
                                                    </a>

                                                    <div className="flex justify-between items-center pt-2 border-t border-primary/5">
                                                        <div className="flex flex-col">
                                                            <span className="text-[10px] text-muted-foreground leading-none mb-1">Subs</span>
                                                            <span className="text-[11px] font-bold">
                                                                {vid.subscriberCount > 1000000
                                                                    ? `${(vid.subscriberCount / 1000000).toFixed(1)}M`
                                                                    : vid.subscriberCount > 1000
                                                                        ? `${(vid.subscriberCount / 1000).toFixed(1)}K`
                                                                        : vid.subscriberCount}
                                                            </span>
                                                        </div>
                                                        <Badge variant="destructive" className="text-[10px] px-1.5 h-5 font-bold shadow-lg shadow-destructive/20">
                                                            x{vid.ratio.toFixed(1)}
                                                        </Badge>
                                                    </div>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    ))}
                                </div>

                                {outlierData.analysis && (
                                    <div className="space-y-6">
                                        <Card className="border-primary/20 bg-primary/5">
                                            <CardHeader>
                                                <CardTitle className="text-xl flex items-center gap-2">
                                                    <Sparkles className="w-6 h-6 text-yellow-500" /> Success Reverse-Engineering
                                                </CardTitle>
                                            </CardHeader>
                                            <CardContent>
                                                <div className="prose prose-invert max-w-none text-muted-foreground whitespace-pre-wrap leading-relaxed">
                                                    {outlierData.analysis}
                                                </div>
                                            </CardContent>
                                        </Card>

                                        <div className="text-center py-4">
                                            <Button
                                                variant="secondary"
                                                size="lg"
                                                onClick={generateViralPlans}
                                                disabled={isViralLoading}
                                                className="gap-2 bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-500 border border-yellow-500/20 px-12"
                                            >
                                                {isViralLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
                                                Build Viral Plan List
                                            </Button>
                                        </div>

                                        {viralPlans.length > 0 && (
                                            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
                                                <h3 className="text-2xl font-bold flex items-center gap-2">
                                                    <BookOpen className="w-6 h-6 text-primary" /> Viral Builder Drafts
                                                </h3>
                                                <div className="grid gap-4">
                                                    {viralPlans.map((plan, i) => (
                                                        <Card key={i} className="bg-secondary/10 border-primary/5 hover:border-primary/20 transition-colors group cursor-pointer" onClick={() => {
                                                            navigator.clipboard.writeText(`${plan.title}\n\n[Trigger]: ${plan.viral_trigger}\n[Tip]: ${plan.production_tip}`);
                                                        }}>
                                                            <CardContent className="p-6">
                                                                <div className="flex justify-between items-start mb-3">
                                                                    <h4 className="text-xl font-bold text-primary group-hover:text-primary/80 transition-colors">{plan.title}</h4>
                                                                    <Badge variant="outline" className="opacity-0 group-hover:opacity-100 transition-opacity">Click to Copy</Badge>
                                                                </div>
                                                                <div className="space-y-3">
                                                                    <div className="flex gap-2">
                                                                        <Badge variant="secondary" className="h-5">Trigger</Badge>
                                                                        <p className="text-sm text-foreground/90">{plan.viral_trigger}</p>
                                                                    </div>
                                                                    <div className="flex gap-2">
                                                                        <Badge variant="outline" className="h-5 border-yellow-500/30 text-yellow-500">Prod Tip</Badge>
                                                                        <p className="text-sm text-muted-foreground italic">{plan.production_tip}</p>
                                                                    </div>
                                                                </div>
                                                            </CardContent>
                                                        </Card>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        )}
                    </TabsContent>

                    <TabsContent value="guide" className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="max-w-4xl mx-auto grid md:grid-cols-2 gap-6">
                            <Card className="bg-card/30 border-primary/10">
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2 text-primary">
                                        <TrendingUp className="w-5 h-5" /> 1. 트렌드 기반 자동 분석
                                    </CardTitle>
                                    <CardDescription>유튜브 인기 쇼츠 실시간 분석</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4 text-sm text-muted-foreground">
                                    <div className="flex gap-3">
                                        <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0 mt-0.5" />
                                        <p><strong>지역 선택</strong>: 한국(KR) 또는 글로벌(US) 지역을 선택하세요.</p>
                                    </div>
                                    <div className="flex gap-3">
                                        <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0 mt-0.5" />
                                        <p><strong>AI 분석</strong>: 버튼 클릭 시 AI가 현재 떡상 중인 쇼츠를 찾아내고, 내 채널에 맞는 <strong>3단계 스크립트</strong>와 훅을 제안합니다.</p>
                                    </div>
                                    <div className="flex gap-3">
                                        <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0 mt-0.5" />
                                        <p><strong>글로벌 인사이트</strong>: 해외 트렌드를 한국 정서에 맞게 변형하는 <strong>현지화 전략</strong>을 제공합니다.</p>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card className="bg-card/30 border-primary/10">
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2 text-primary">
                                        <Search className="w-5 h-5" /> 2. 키워드 기반 바이럴 검색
                                    </CardTitle>
                                    <CardDescription>떡상 영상의 성공 공식 역설계</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4 text-sm text-muted-foreground">
                                    <div className="flex gap-3">
                                        <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0 mt-0.5" />
                                        <p><strong>키워드 검색</strong>: 관심 있는 주제(요리, 브이로그 등)를 입력하세요.</p>
                                    </div>
                                    <div className="flex gap-3">
                                        <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0 mt-0.5" />
                                        <p><strong>아웃라이어 발굴</strong>: 구독자 대비 조회수가 월등히 높은(x10배 이상) 영상들을 자동으로 수집합니다.</p>
                                    </div>
                                    <div className="flex gap-3">
                                        <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0 mt-0.5" />
                                        <p><strong>성공 공식 요약</strong>: AI가 해당 영상들의 <strong>공통적인 승리 패턴</strong>을 추출하여 보고서로 제안합니다.</p>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card className="md:col-span-2 border-yellow-500/20 bg-yellow-500/5">
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <BookOpen className="w-5 h-5 text-yellow-500" /> 시작하기 전 참고사항
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="grid md:grid-cols-2 gap-4 text-xs text-muted-foreground">
                                    <div className="p-3 rounded-lg bg-background/40">
                                        <p className="font-bold text-foreground mb-1">💡 팁: 비언어적 요소 활용</p>
                                        해외 쇼츠에서 인기를 끄는 시각적 편집 기법을 적극 활용해 보세요. 언어의 장벽을 넘는 영상은 파급력이 수십 배 강합니다.
                                    </div>
                                    <div className="p-3 rounded-lg bg-background/40">
                                        <p className="font-bold text-foreground mb-1">⚡ 결과 대기 시간</p>
                                        AI 분석에는 유튜브 데이터 수합과 자막 추출 과정이 포함되어 약 15~30초 정도 소요될 수 있습니다.
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </TabsContent>
                </Tabs>
            </main>
            <footer className="w-full max-w-6xl text-center text-sm text-muted-foreground mt-12">
                <p>Made with ❤️ by the Next Shorts Team</p>
            </footer>

            {/* Free Usage Modal */}
            {showFreeUsageModal && (
                <FreeTierUsageModal onClose={() => setShowFreeUsageModal(false)} />
            )}

            {/* Upgrade Prompt Modal */}
            {showUpgradePrompt.show && (
                <UpgradePrompt
                    feature={showUpgradePrompt.feature}
                    usageType={showUpgradePrompt.type}
                    onClose={() => setShowUpgradePrompt({ show: false, feature: '' })}
                />
            )}
        </div>
    );
}
