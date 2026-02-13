'use client';

import { Suspense, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import KakaoLoginButton from '@/components/KakaoLoginButton';
import { useAuth } from '@/contexts/AuthContext';
import { Youtube } from 'lucide-react';
import { signInWithCustomToken } from 'firebase/auth';
import { auth } from '@/lib/firebase.config';

function LoginContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { user, loading } = useAuth();

    useEffect(() => {
        const handleTokenLogin = async () => {
            const token = searchParams.get('token');
            const error = searchParams.get('error');

            if (error) {
                alert(`로그인 오류: ${error}`);
                return;
            }

            if (token) {
                try {
                    await signInWithCustomToken(auth, token);
                    router.push('/dashboard');
                } catch (err) {
                    console.error('Token login failed:', err);
                    alert('로그인에 실패했습니다.');
                }
            }
        };

        if (!loading) {
            if (user) {
                router.push('/dashboard');
            } else {
                handleTokenLogin();
            }
        }
    }, [user, loading, router, searchParams]);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
            <div className="w-full max-w-md space-y-8">
                {/* Logo and Title */}
                <div className="text-center space-y-4">
                    <div className="flex items-center justify-center gap-3">
                        <Youtube className="w-12 h-12 text-primary" />
                        <h1 className="text-4xl font-bold tracking-tighter">Next Shorts</h1>
                    </div>
                    <p className="text-muted-foreground text-lg">
                        YouTube Shorts 트렌드 분석의 시작
                    </p>
                </div>

                {/* Login Card */}
                <div className="bg-card border border-primary/10 rounded-2xl p-8 space-y-6 shadow-xl">
                    <div className="space-y-2 text-center">
                        <h2 className="text-2xl font-bold">로그인</h2>
                        <p className="text-sm text-muted-foreground">
                            카카오 계정으로 간편하게 시작하세요
                        </p>
                    </div>

                    <KakaoLoginButton
                        onSuccess={() => {
                            router.push('/dashboard');
                        }}
                        onError={(error) => {
                            console.error('Login failed:', error);
                            alert('로그인에 실패했습니다. 다시 시도해주세요.');
                        }}
                    />

                    <div className="pt-4 border-t border-primary/10">
                        <p className="text-xs text-center text-muted-foreground">
                            로그인하시면{' '}
                            <a href="/terms" className="underline hover:text-primary">
                                이용약관
                            </a>
                            과{' '}
                            <a href="/privacy" className="underline hover:text-primary">
                                개인정보처리방침
                            </a>
                            에 동의하는 것으로 간주됩니다.
                        </p>
                    </div>
                </div>

                {/* Features */}
                <div className="grid grid-cols-3 gap-4 text-center">
                    <div className="space-y-2">
                        <div className="text-2xl">📊</div>
                        <p className="text-xs text-muted-foreground">실시간 트렌드 분석</p>
                    </div>
                    <div className="space-y-2">
                        <div className="text-2xl">🚀</div>
                        <p className="text-xs text-muted-foreground">AI 아이디어 생성</p>
                    </div>
                    <div className="space-y-2">
                        <div className="text-2xl">🎯</div>
                        <p className="text-xs text-muted-foreground">성공 공식 역설계</p>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function LoginPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center bg-background">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
        }>
            <LoginContent />
        </Suspense>
    );
}
