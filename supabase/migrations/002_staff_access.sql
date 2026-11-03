-- LodgeDesk staff access v1: who may read and edit the lodge data.
-- Run in the Supabase SQL editor AFTER 001_lodgedesk_schema.sql.
-- Creates no users and inserts no data.

-- 1. Staff list: one row per staff member.
create table staff_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null,
  role text not null check (role in ('owner', 'manager')),
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

alter table staff_profiles enable row level security;

-- 2. Helper functions. SECURITY DEFINER lets them read staff_profiles
-- without the policies on that table calling themselves in a loop.
create function public.is_active_staff()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.staff_profiles
    where user_id = auth.uid() and is_active
  );
$$;

create function public.is_owner()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.staff_profiles
    where user_id = auth.uid() and is_active and role = 'owner'
  );
$$;

-- Only signed-in users may call the helpers, never anonymous visitors.
revoke execute on function public.is_active_staff() from public, anon;
revoke execute on function public.is_owner() from public, anon;
grant execute on function public.is_active_staff() to authenticated;
grant execute on function public.is_owner() to authenticated;

-- 3. staff_profiles: you can read your own row (the owner can read all).
-- No insert, update or delete policy exists, so the app can never change it.
create policy "read own staff row" on staff_profiles
  for select to authenticated
  using (user_id = (select auth.uid()) or (select public.is_owner()));

-- 4. Lodge data: active staff read, only the owner writes.
create policy "staff read" on properties
  for select to authenticated using ((select public.is_active_staff()));
create policy "owner insert" on properties
  for insert to authenticated with check ((select public.is_owner()));
create policy "owner update" on properties
  for update to authenticated
  using ((select public.is_owner())) with check ((select public.is_owner()));
create policy "owner delete" on properties
  for delete to authenticated using ((select public.is_owner()));

create policy "staff read" on branches
  for select to authenticated using ((select public.is_active_staff()));
create policy "owner insert" on branches
  for insert to authenticated with check ((select public.is_owner()));
create policy "owner update" on branches
  for update to authenticated
  using ((select public.is_owner())) with check ((select public.is_owner()));
create policy "owner delete" on branches
  for delete to authenticated using ((select public.is_owner()));

create policy "staff read" on room_types
  for select to authenticated using ((select public.is_active_staff()));
create policy "owner insert" on room_types
  for insert to authenticated with check ((select public.is_owner()));
create policy "owner update" on room_types
  for update to authenticated
  using ((select public.is_owner())) with check ((select public.is_owner()));
create policy "owner delete" on room_types
  for delete to authenticated using ((select public.is_owner()));

create policy "staff read" on branch_room_types
  for select to authenticated using ((select public.is_active_staff()));
create policy "owner insert" on branch_room_types
  for insert to authenticated with check ((select public.is_owner()));
create policy "owner update" on branch_room_types
  for update to authenticated
  using ((select public.is_owner())) with check ((select public.is_owner()));
create policy "owner delete" on branch_room_types
  for delete to authenticated using ((select public.is_owner()));

create policy "staff read" on facilities
  for select to authenticated using ((select public.is_active_staff()));
create policy "owner insert" on facilities
  for insert to authenticated with check ((select public.is_owner()));
create policy "owner update" on facilities
  for update to authenticated
  using ((select public.is_owner())) with check ((select public.is_owner()));
create policy "owner delete" on facilities
  for delete to authenticated using ((select public.is_owner()));

-- Guests (anonymous visitors) have no policy on any table above, so they
-- can read nothing directly. The chat will reach the data only through the
-- server-side Edge Function.

-- FIRST OWNER (run by hand ONCE, after the owner's account exists in
-- Supabase Authentication > Users; replace the id and name, then remove
-- the leading dashes):
-- insert into staff_profiles (user_id, display_name, role)
-- values ('PASTE-THE-USER-ID-HERE', 'Owner name', 'owner');
