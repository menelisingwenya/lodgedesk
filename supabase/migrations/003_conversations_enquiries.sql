-- LodgeDesk v3: guest conversations, messages and enquiries.
-- Run in the Supabase SQL editor AFTER 001 and 002.
-- Creates no rows. Guests never touch these tables directly: the server
-- function (service role) writes them, and signed-in staff read them.

create table conversations (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null,                 -- anonymous browser session, identifies no one
  language text,                            -- e.g. 'en', 'nd', 'sn'
  status text not null default 'open'
    check (status in ('open', 'handed_off', 'closed')),
  handoff_reason text,                      -- e.g. 'price unconfirmed'
  created_at timestamptz not null default now(),
  last_message_at timestamptz not null default now()
);

create table messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references conversations(id) on delete cascade,
  role text not null check (role in ('guest', 'assistant')),
  content text not null check (char_length(content) between 1 and 2000),
  created_at timestamptz not null default now()
);

create table enquiries (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid references conversations(id) on delete set null,
  guest_name text,
  contact text,                             -- phone or email the guest chose to give
  branch_id uuid references branches(id) on delete set null,
  room_type_id uuid references room_types(id) on delete set null,
  check_in date,
  check_out date,
  guests integer check (guests > 0),
  notes text,
  status text not null default 'new'
    check (status in ('new', 'handed_off', 'contacted', 'closed')),
  handoff_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (check_out is null or check_in is null or check_out >= check_in)
);

create index conversations_session_idx on conversations (session_id);
create index messages_conversation_idx on messages (conversation_id, created_at);
create index messages_created_idx on messages (created_at);
create index enquiries_status_idx on enquiries (status, created_at desc);

alter table conversations enable row level security;
alter table messages enable row level security;
alter table enquiries enable row level security;

-- Active staff can read everything.
create policy "staff read" on conversations
  for select to authenticated using ((select public.is_active_staff()));
create policy "staff read" on messages
  for select to authenticated using ((select public.is_active_staff()));
create policy "staff read" on enquiries
  for select to authenticated using ((select public.is_active_staff()));

-- Active staff can update status fields (follow up enquiries, close conversations).
create policy "staff update" on conversations
  for update to authenticated
  using ((select public.is_active_staff())) with check ((select public.is_active_staff()));
create policy "staff update" on enquiries
  for update to authenticated
  using ((select public.is_active_staff())) with check ((select public.is_active_staff()));

-- Only the owner can delete (for example, a guest asks for their data to be removed).
create policy "owner delete" on conversations
  for delete to authenticated using ((select public.is_owner()));
create policy "owner delete" on messages
  for delete to authenticated using ((select public.is_owner()));
create policy "owner delete" on enquiries
  for delete to authenticated using ((select public.is_owner()));

-- No insert policy exists for anyone: only the server function (service role,
-- which bypasses these rules) can create conversations, messages and enquiries.
