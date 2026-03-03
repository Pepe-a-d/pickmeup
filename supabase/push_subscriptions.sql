-- ============================================================
-- PickMeUp — Phase 7: Push Subscriptions
-- Run this in Supabase SQL Editor
-- ============================================================

-- Push subscriptions table
create table push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  endpoint text not null unique,
  p256dh text not null,
  auth text not null,
  user_id uuid references users(id) on delete cascade,
  role text not null check (role in ('admin', 'passenger')),
  created_at timestamptz default now()
);

alter table push_subscriptions disable row level security;
