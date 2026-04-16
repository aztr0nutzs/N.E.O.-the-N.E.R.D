<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/6659e9ee-c302-4009-8ef3-4523653b718d

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Create `.env.local` from `.env.example` and set:
   - `GEMINI_API_KEY`
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
   - `SUPABASE_URL` (same value as `VITE_SUPABASE_URL`)
   - `SUPABASE_SERVICE_ROLE_KEY`
3. In Supabase SQL Editor, create required tables:
   ```sql
   create table if not exists public.messages (
     id text primary key,
     user_id uuid not null,
     role text not null check (role in ('user', 'assistant')),
     content text not null,
     image_url text,
     video_url text,
     audio_data text,
     created_at timestamptz not null default now()
   );

   create table if not exists public.tasks (
     id text primary key,
     user_id uuid not null,
     title text not null,
     completed boolean not null default false,
     priority text not null check (priority in ('high', 'normal')),
     created_at timestamptz not null default now()
   );

   alter table public.messages enable row level security;
   alter table public.tasks enable row level security;

   create policy "Users manage own messages" on public.messages
     for all using (auth.uid() is not null and auth.uid() = user_id)
     with check (auth.uid() is not null and auth.uid() = user_id);
   create policy "Users manage own tasks" on public.tasks
     for all using (auth.uid() is not null and auth.uid() = user_id)
     with check (auth.uid() is not null and auth.uid() = user_id);
   ```
4. In Supabase Auth, enable Google provider and set redirect URL to `http://localhost:3000`.
5. Run the app:
   `npm run dev`
