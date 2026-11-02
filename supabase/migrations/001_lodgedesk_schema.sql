-- LodgeDesk schema v1 (Week 1): structure only, no data.
-- Run in the Supabase SQL editor.

create table properties (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz not null default now()
);

create table branches (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null references properties(id) on delete cascade,
  slug text not null,                       -- e.g. 'executive-branch'
  name text not null,
  address text,
  directions text,
  is_open boolean not null default true,    -- false for a branch still being set up
  created_at timestamptz not null default now(),
  unique (property_id, slug)
);

create table room_types (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null references properties(id) on delete cascade,
  slug text not null,                       -- e.g. 'executive-deluxe'
  name text not null,
  description text,
  unique (property_id, slug)
);

create table branch_room_types (
  branch_id uuid not null references branches(id) on delete cascade,
  room_type_id uuid not null references room_types(id) on delete cascade,
  room_count integer not null check (room_count > 0),
  price_usd numeric(8,2) check (price_usd >= 0),   -- null until the owner confirms
  price_confirmed boolean not null default false,
  price_note text,                                 -- e.g. 'per night', 'from'
  updated_at timestamptz not null default now(),
  primary key (branch_id, room_type_id),
  check (not price_confirmed or price_usd is not null)
);

create table facilities (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null references properties(id) on delete cascade,
  branch_id uuid references branches(id) on delete set null,
  name text not null,                       -- e.g. 'Conference room'
  description text,
  capacity integer check (capacity > 0),
  price_usd numeric(8,2) check (price_usd >= 0),
  price_confirmed boolean not null default false,
  check (not price_confirmed or price_usd is not null)
);

-- Row Level Security on, with no public policies:
-- only the server (service role, used by the Edge Function) can read or write.
-- Staff policies are added in Week 3 when login exists.
alter table properties enable row level security;
alter table branches enable row level security;
alter table room_types enable row level security;
alter table branch_room_types enable row level security;
alter table facilities enable row level security;
