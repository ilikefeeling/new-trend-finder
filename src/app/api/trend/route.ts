import { NextResponse } from 'next/server';
import axios from 'axios';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { getVideoTranscript } from '@/lib/python_bridge';

const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

const genAI = new GoogleGenerativeAI(GEMINI_API_KEY || '');

const SUPPORTED_REGIONS = [
    { code: 'KR', name: 'South Korea', label: 'Korea 🇰🇷' },
    { code: 'US', name: 'USA', label: 'Global (US) 🌐' },
    { code: 'JP', name: 'Japan', label: 'Japan 🇯🇵' },
    { code: 'GB', name: 'United Kingdom', label: 'UK 🇬🇧' },
    { code: 'IN', name: 'India', label: 'India 🇮🇳' },
    { code: 'DE', name: 'Germany', label: 'Germany 🇩🇪' },
    { code: 'FR', name: 'France', label: 'France 🇫🇷' },
    { code: 'BR', name: 'Brazil', label: 'Brazil 🇧🇷' },
];

export async function GET(request: Request) {
    try {
        if (!YOUTUBE_API_KEY || !GEMINI_API_KEY) {
            return NextResponse.json({ error: 'API keys are missing' }, { status: 500 });
        }

        const { searchParams } = new URL(request.url);
        const regionCode = (searchParams.get('region') || 'KR').toUpperCase();
        const regionInfo = SUPPORTED_REGIONS.find(r => r.code === regionCode) || SUPPORTED_REGIONS[0];
        const isGlobal = regionInfo.code !== 'KR';

        // 1. Fetch Trending Shorts via Search
        console.log(`[API] Starting ${regionInfo.code} (${regionInfo.name}) trends fetch...`);
        const youtubeResponse = await axios.get('https://www.googleapis.com/youtube/v3/search', {
            params: {
                part: 'snippet',
                q: isGlobal ? 'shorts trending global' : 'shorts trending',
                type: 'video',
                order: 'viewCount',
                regionCode: regionInfo.code,
                maxResults: 5,
                key: YOUTUBE_API_KEY,
            },
        });

        const videos = youtubeResponse.data.items;
        if (!videos || videos.length === 0) {
            console.warn('[API] No videos found in YouTube response');
            return NextResponse.json({ error: 'No trending videos found' }, { status: 404 });
        }

        // 2. Select the top video and analyze
        const topVideo = videos[0];
        const videoId = topVideo.id.videoId;
        const videoTitle = topVideo.snippet.title;
        console.log(`[API] Top video selected: ${videoTitle} (${videoId})`);

        // 3. Try to get transcript
        let transcript = 'Transcript not available';
        try {
            console.log(`[API] Attempting to fetch transcript for ${videoId}...`);
            const transcriptResult = await getVideoTranscript(videoId);
            if (transcriptResult.success && transcriptResult.transcript) {
                transcript = transcriptResult.transcript;
                console.log('[API] Transcript fetched successfully');
            } else {
                console.warn('[API] Transcript extraction failed or empty:', transcriptResult.error);
            }
        } catch (te) {
            console.error('[API] Unexpected error in transcript bridge:', te);
        }

        // 4. Gemini Analysis
        console.log('[API] Starting Gemini analysis...');
        const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

        let prompt = `
            You are a Professional Content Strategist specialized in YouTube Shorts.
            Analyze the following video data and regenerate a high-efficiency content idea for a mid-level creator.

            Video Title: ${videoTitle}
            
            IMPORTANT: The transcript below might be long. Please extract only the **CORE CONTEXT and KEY HOOKS** to minimize token usage and focus on what makes this video successful.
            Transcript: ${transcript}
            
            Region: ${regionInfo.name}

            Please provide the output in the following JSON format:
            {
                "trend_analysis": "Summary of current visual/audio patterns",
                "ideas": [
                    {
                        "title": "Proposed Title",
                        "hook": "Strong initial hook strategy",
                        "script_guide": "3-step storyboard/script guide"
                    }
                ],
                "global_insight": {
                    "reaction_summary": "Summary of international audience reactions",
                    "local_keywords": ["keyword1", "keyword2"],
                    "localization_strategy": "How to adapt this international trend for the Korean market"
                }
            }
        `;

        if (isGlobal) {
            prompt += `
                SPECIAL MISSION for Global Analysis:
                1. Focus heavily on 'Non-verbal visual elements' that transcend language barriers.
                2. Identify if there's a specific global BGM or challenge format.
                3. MUST include a 'Localization Strategy' for the Korean market in the global_insight.
            `;
        }

        prompt += "\nResponse must be in Korean.";

        console.log('[API] Invoking Gemini generateContent...');
        const result = await model.generateContent(prompt);
        if (!result || !result.response) {
            throw new Error('Empty response from Gemini');
        }

        const response = await result.response;
        const text = response.text();
        console.log('[API] Gemini response text received (first 50 chars):', text.substring(0, 50));

        if (!text || text.length < 5) {
            throw new Error('Gemini returned insufficient or empty text');
        }

        // Helper to parse JSON from raw text or markdown blocks
        const parseRawJson = (rawText: string) => {
            try {
                const start = rawText.indexOf('{');
                const end = rawText.lastIndexOf('}');
                if (start === -1 || end === -1) throw new Error('No JSON object found');
                const jsonPart = rawText.substring(start, end + 1);
                return JSON.parse(jsonPart);
            } catch (e) {
                console.error('[API] JSON Parse Error:', e);
                return { error: 'Format Error', raw: rawText };
            }
        };

        // Always use the brace-based extraction for maximum robustness
        let analysisData = parseRawJson(text);

        // If analysisData is still an error object from parseRawJson, format it
        if (analysisData && analysisData.error === 'Format Error') {
            analysisData = {
                trend_analysis: "데이터 파싱 실패",
                ideas: [{ title: "Error", hook: "Format Error", script_guide: analysisData.raw }]
            };
        }

        return NextResponse.json({
            success: true,
            region: regionInfo.code,
            original_video: {
                id: videoId,
                title: videoTitle,
            },
            analysis: analysisData,
        });

    } catch (error: any) {
        console.error('Trend API Error:', error.message, error.stack);
        return NextResponse.json({ error: 'Internal Server Error', details: error.message }, { status: 500 });
    }
}
