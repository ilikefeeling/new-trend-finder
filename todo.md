# 📋 YouTube Shorts Trend Analyzer & Idea Generator To-do List

## 🚀 1. Project Initialization & Environment Setup

- [x] Initialize Next.js 14 project with Tailwind CSS & shadcn/ui
- [x] Set up environment variables (`.env.local` for YouTube API, Gemini API)
- [x] Configure Python bridge for transcript extraction (`youtube-transcript-api`)

## 🔍 2. Feature 1: Trend Scout Implementation

- [x] Integrate YouTube Data API to fetch trending shorts
- [x] Integrate Gemini API for trend analysis (visual grammar, audio patterns)
- [x] Build Idea generation UI (titles, hook strategy, script guide)
- [x] Add 'Global Trend Switch' (KR/Global toggle)
- [x] Dynamic YouTube region switching (KR/US)
- [x] Enhanced Gemini prompt for Global localization

## ⚙️ 3. Feature 2: Outlier Reverse-Engineer Implementation

- [x] Implement keyword-based video search & data collection
- [x] Develop outlier detection logic (`View/Subscriber` ratio filtering)
- [x] Implement success pattern extraction via Gemini API

## 🎨 4. UI/UX Development (Premium YouTube Dark Mode)

- [x] Create dashboard with trending keyword visualization
- [x] Apply YouTube dark mode style using `shadcn/ui` and custom tokens
- [x] Integrate `LocalStorage` for saving analysis history

## 🚢 5. Verification & Deployment

- [x] Test end-to-end API flows (YouTube ↔️ Gemini ↔️ Python Bridge)
- [x] Conduct final UI/UX polish and responsiveness check
- [ ] Deploy to Vercel
