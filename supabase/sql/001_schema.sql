-- 001_schema.sql
-- Base tables for replacing Firestore task/message storage.

create extension if not exists pgcrypto;

create table if not exists public.tasks (
  id text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null check (char_length(title) > 0 and char_length(title) <= 500),
  completed boolean not null default false,
  priority text not null check (priority in ('high', 'normal')),
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.messages (
  id text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('user', 'assistant')),
  content text not null check (char_length(content) <= 50000),
  image_url text,
  video_url text,
  audio_data text,
  created_at timestamptz not null default timezone('utc', now()),
  constraint messages_image_url_len check (image_url is null or char_length(image_url) <= 2000),
  constraint messages_video_url_len check (video_url is null or char_length(video_url) <= 2000),
  constraint messages_audio_data_len check (audio_data is null or char_length(audio_data) <= 1000000)
);
