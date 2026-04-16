-- 003_indexes_and_helpers.sql
-- Indexes matching app query patterns.

create index if not exists idx_tasks_user_created_at on public.tasks(user_id, created_at desc);
create index if not exists idx_tasks_user_priority on public.tasks(user_id, priority);
create index if not exists idx_messages_user_created_at on public.messages(user_id, created_at asc);
