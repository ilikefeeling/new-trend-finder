'use client';

import { useState } from 'react';

interface KakaoLoginButtonProps {
    onSuccess?: () => void;
    onError?: (error: any) => void;
}

export default function KakaoLoginButton({ onSuccess, onError }: KakaoLoginButtonProps) {
    const [isLoading, setIsLoading] = useState(false);

    const handleKakaoLogin = () => {
        setIsLoading(true);

        const KAKAO_CLIENT_ID = process.env.NEXT_PUBLIC_KAKAO_CLIENT_ID;
        const REDIRECT_URI = `${window.location.origin}/api/auth/kakao/callback`;

        // Kakao OAuth URL
        const kakaoAuthUrl = `https://kauth.kakao.com/oauth/authorize?client_id=${KAKAO_CLIENT_ID}&redirect_uri=${REDIRECT_URI}&response_type=code`;

        // Redirect to Kakao login
        window.location.href = kakaoAuthUrl;
    };

    return (
        <button
            onClick={handleKakaoLogin}
            disabled={isLoading}
            className="flex items-center justify-center gap-3 w-full bg-[#FEE500] hover:bg-[#FDD835] text-[#000000] font-semibold py-3 px-4 rounded-lg transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="카카오로 로그인하기"
        >
            <svg
                width="20"
                height="20"
                viewBox="0 0 20 20"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
            >
                <path
                    d="M10 3C5.58172 3 2 5.89512 2 9.5C2 11.6576 3.36364 13.5429 5.45455 14.7095L4.72727 17.5L7.81818 15.7095C8.52273 15.8514 9.25455 15.9238 10 15.9238C14.4183 15.9238 18 13.0287 18 9.42284C18 5.81698 14.4183 3 10 3Z"
                    fill="#000000"
                    fillOpacity="0.9"
                />
            </svg>
            {isLoading ? '로그인 중...' : '카카오로 시작하기'}
        </button>
    );
}
