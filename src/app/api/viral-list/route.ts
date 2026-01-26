import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY || '');

export async function POST(request: Request) {
    try {
        if (!GEMINI_API_KEY) {
            return NextResponse.json({ error: 'Gemini API key is missing' }, { status: 500 });
        }

        const { keyword, outlierTitle, ratio } = await request.json();
        if (!keyword || !outlierTitle) {
            return NextResponse.json({ error: 'Missing required data (keyword, outlierTitle)' }, { status: 400 });
        }

        const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

        const prompt = `
            You are a Viral Content Engineer. 
            Based on a successful 'Outlier' video related to the keyword "${keyword}", generate 5 unique and highly viral video planning drafts for a creator to replicate that success.

            Successful Outlier Info:
            - Title: ${outlierTitle}
            - Success Multiplier: ${ratio}x higher views than subscribers.

            Each draft MUST include:
            1. title: A catchy, click-worthy title.
            2. viral_trigger: The psychological reason why this will go viral (e.g., Curiosity, Fear of Missing Out, Unexpected Twist).
            3. production_tip: A specific tip on how to film or edit this to maximize engagement.

            Return the response as a valid JSON array of objects:
            [
              {
                "title": "Title 1",
                "viral_trigger": "Trigger 1",
                "production_tip": "Tip 1"
              },
              ...
            ]

            Language: Korean.
            Focus on YouTube Shorts format.
        `;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        // Robust JSON parsing
        const parseRawJson = (rawText: string) => {
            try {
                const start = rawText.indexOf('[');
                const end = rawText.lastIndexOf(']');
                if (start === -1 || end === -1) throw new Error('No JSON array found');
                const jsonPart = rawText.substring(start, end + 1);
                return JSON.parse(jsonPart);
            } catch (e) {
                console.error('[Viral API] JSON Parse Error:', e);
                return null;
            }
        };

        const viralPlans = parseRawJson(text);

        if (!viralPlans) {
            throw new Error('Failed to parse viral plans from AI response');
        }

        return NextResponse.json({
            success: true,
            viral_plans: viralPlans
        });

    } catch (error: any) {
        console.error('Viral List API Error:', error);
        return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
    }
}
