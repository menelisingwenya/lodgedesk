-- 005_real_branches.sql
-- Loads the real Harris Lodges branches and room counts.
-- Additive only: nothing is deleted, and rerunning it will not create duplicates.
-- Prices are left UNCONFIRMED on purpose, so the assistant says it will check
-- with the team instead of quoting a price nobody has approved.

-- 1. Room types (adds only the ones that are missing)
insert into room_types (property_id, slug, name)
select (select property_id from room_types limit 1),
       lower(regexp_replace(v.name, '[^a-zA-Z0-9]+', '-', 'g')),
       v.name
from (values
  ('Standard'),
  ('Upper Standard'),
  ('Executive'),
  ('Deluxe'),
  ('Executive Deluxe'),
  ('Double Deluxe')
) as v(name)
where not exists (
  select 1 from room_types r where lower(r.name) = lower(v.name)
);

-- 2. Branches (adds only the ones that are missing)
-- NOTE: rename 'Executive' below if the branch has a fuller official name.
insert into branches (property_id, slug, name, is_open)
select (select property_id from branches limit 1),
       lower(regexp_replace(v.name, '[^a-zA-Z0-9]+', '-', 'g')),
       v.name,
       true
from (values
  ('Zim Harris'),
  ('London'),
  ('Harris Silver Sands'),
  ('Harris Northend'),
  ('Harris Clark'),
  ('Romney Park'),
  ('Executive'),
  ('Harris Sunone Lodge'),
  ('Prime Harris'),
  ('Harris Villa'),
  ('Qatha')
) as v(name)
where not exists (
  select 1 from branches b where lower(b.name) = lower(v.name)
);

-- 3. Rooms per branch (no prices, so price_confirmed = false)
-- If you renamed a branch in step 2, rename it here too.
insert into branch_room_types (branch_id, room_type_id, room_count, price_confirmed)
select b.id, r.id, v.n, false
from (values
  ('Zim Harris',          'Standard',         6),
  ('Zim Harris',          'Upper Standard',   3),
  ('Zim Harris',          'Executive',        2),
  ('Zim Harris',          'Executive Deluxe', 4),

  ('London',              'Standard',         8),
  ('London',              'Upper Standard',   7),
  ('London',              'Executive',        7),
  ('London',              'Deluxe',           7),

  ('Harris Silver Sands', 'Standard',         9),
  ('Harris Silver Sands', 'Executive',       13),

  ('Harris Northend',     'Standard',        14),
  ('Harris Northend',     'Upper Standard',  14),
  ('Harris Northend',     'Executive',        3),

  ('Harris Clark',        'Standard',         5),
  ('Harris Clark',        'Executive',        4),
  ('Harris Clark',        'Executive Deluxe',10),
  ('Harris Clark',        'Double Deluxe',    4),

  ('Romney Park',         'Standard',         6),
  ('Romney Park',         'Executive',        8),
  ('Romney Park',         'Deluxe',           3),

  ('Executive',           'Standard',         5),
  ('Executive',           'Executive',        3),
  ('Executive',           'Deluxe',           3),

  ('Harris Sunone Lodge', 'Standard',         8),
  ('Harris Sunone Lodge', 'Executive',        7),

  ('Prime Harris',        'Standard',         9),
  ('Prime Harris',        'Executive',        6),
  ('Prime Harris',        'Double Deluxe',    5),

  ('Harris Villa',        'Standard',         2),
  ('Harris Villa',        'Upper Standard',   4),
  ('Harris Villa',        'Executive',        2),
  ('Harris Villa',        'Double Deluxe',    2),

  ('Qatha',               'Standard',         7)
) as v(branch, room, n)
join branches b   on lower(b.name) = lower(v.branch)
join room_types r on lower(r.name) = lower(v.room)
on conflict do nothing;

-- 4. Check: run this separately afterwards. Expected room totals:
-- Zim Harris 15, London 29, Harris Silver Sands 22, Harris Northend 31,
-- Harris Clark 23, Romney Park 17, Executive 11, Harris Sunone Lodge 15,
-- Prime Harris 20, Harris Villa 10, Qatha 7.
--
-- select b.name, sum(x.room_count) as rooms
-- from branch_room_types x
-- join branches b on b.id = x.branch_id
-- group by b.name
-- order by b.name;