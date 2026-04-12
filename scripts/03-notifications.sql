-- Notifications table for persistent read/unread state
-- Run this in Supabase SQL editor

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users(id) on delete cascade,
  target_role text check (target_role in ('student', 'staff', 'admin')),
  message text not null,
  type text not null default 'info' check (type in ('success', 'warning', 'error', 'info')),
  read boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Existing table migration safety
alter table public.notifications alter column user_id drop not null;
alter table public.notifications add column if not exists target_role text;
alter table public.notifications drop constraint if exists notifications_target_role_check;
alter table public.notifications
  add constraint notifications_target_role_check
  check (target_role in ('student', 'staff', 'admin') or target_role is null);

create index if not exists idx_notifications_user_id on public.notifications(user_id);
create index if not exists idx_notifications_target_role on public.notifications(target_role);
create index if not exists idx_notifications_created_at on public.notifications(created_at desc);

create or replace function public.set_notifications_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_notifications_updated_at on public.notifications;
create trigger trg_notifications_updated_at
before update on public.notifications
for each row execute function public.set_notifications_updated_at();

-- Keep RLS enabled in production; backend APIs use service role for admin operations.
alter table public.notifications enable row level security;

-- Development policy: authenticated users can read/write their own notifications.
drop policy if exists notifications_select_own on public.notifications;
create policy notifications_select_own
on public.notifications for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists notifications_update_own on public.notifications;
create policy notifications_update_own
on public.notifications for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);
