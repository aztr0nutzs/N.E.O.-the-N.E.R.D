<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# N.E.O. Local Setup

This project now uses Supabase for authentication and data storage, with server-side Gemini routes protected by Supabase bearer-token verification.

## Run Locally

**Prerequisites:** Node.js

1. Install dependencies:
   `npm install`
2. Create `.env` from `.env.example`.
3. Set these required values:
   `VITE_SUPABASE_URL`
   `VITE_SUPABASE_ANON_KEY`
   `SUPABASE_SERVICE_ROLE_KEY`
   `GEMINI_API_KEY`
   `APP_URL`
4. Start the app:
   `npm run dev`
