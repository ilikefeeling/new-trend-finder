import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
import axios from 'axios';
import { GoogleGenerativeAI } from '@google/generative-ai';

const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

const genAI = new GoogleGenerativeAI(GEMINI_API_KEY || '');

export async function POST(request: Request) {
    try {
        if (!YOUTUBE_API_KEY || !GEMINI_API_KEY) {
            return NextResponse.json({ error: 'API keys are missing' }, { status: 500 });
        }

        const { keyword } = await request.json();
        if (!keyword) {
            return NextResponse.json({ error: 'Keyword is required' }, { status: 400 });
        }

        // 1. Search for videos based on keyword
        const searchResponse = await axios.get('https://www.googleapis.com/youtube/v3/search', {
            params: {
                part: 'snippet',
                q: keyword,
                type: 'video',
                maxResults: 15,
                key: YOUTUBE_API_KEY,
            },
        });

        const videoIds = searchResponse.data.items.map((item: any) => item.id.videoId).join(',');

        // 2. Get detailed video statistics and channel statistics
        const detailsResponse = await axios.get('https://www.googleapis.com/youtube/v3/videos', {
            params: {
                part: 'snippet,statistics',
                id: videoIds,
                key: YOUTUBE_API_KEY,
            },
        });

        const videos = detailsResponse.data.items;
        const outliers = [];

        for (const video of videos) {
            const channelId = video.snippet.channelId;
            const viewCount = parseInt(video.statistics.viewCount);

            // Fetch channel statistics to get subscriber count and snippet for thumbnails
            const channelResponse = await axios.get('https://www.googleapis.com/youtube/v3/channels', {
                params: {
                    part: 'snippet,statistics',
                    id: channelId,
                    key: YOUTUBE_API_KEY,
                },
            });

            const channelData = channelResponse.data.items[0];
            const subscriberCount = parseInt(channelData.statistics.subscriberCount);
            const channelThumbnail = channelData.snippet.thumbnails.default.url;
            const channelTitle = channelData.snippet.title;
            const ratio = subscriberCount > 0 ? viewCount / subscriberCount : viewCount;

            // Outlier threshold: View count / Subscriber count > 10
            if (ratio > 10) {
                outliers.push({
                    id: video.id,
                    title: video.snippet.title,
                    viewCount,
                    subscriberCount,
                    ratio,
                    channelId,
                    channelTitle,
                    channelThumbnail,
                });
            }
        }

        // Sort outliers by ratio descending
        outliers.sort((a, b) => b.ratio - a.ratio);

        if (outliers.length === 0) {
            return NextResponse.json({ success: true, outliers: [], message: 'No outliers found for this keyword.' });
        }

        // 3. Analyze the top outlier with Gemini
        const topOutlier = outliers[0];
        const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
        const prompt = `
            Analyze this YouTube 'Outlier' video which has a view-to-subscriber ratio of ${topOutlier.ratio.toFixed(1)}x.
            Title: ${topOutlier.title}
            
            Based on the title and the fact that it performed exceptionally well compared to the channel size, reverse-engineer its success.
            Provide:
            1. Success Cheat-sheet (Hook points, audience reaction triggers)
            2. Thumbnail Copy Strategy
            3. Audience Retention Strategy (Why did people keep watching?)

            Response must be in Korean.
        `;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const analysisText = response.text();

        return NextResponse.json({
            success: true,
            outliers: outliers.slice(0, 5),
            analysis: analysisText,
        });

    } catch (error: any) {
        console.error('Error in Outlier API:', error);
        return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
    }
}
