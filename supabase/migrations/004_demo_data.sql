-- LodgeDesk DEMO DATA (fictional). This is NOT Harris Lodges data.
-- Real branches, rooms and prices are loaded only after the owner's written approval.
-- Run once in the Supabase SQL editor. Running it twice fails on purpose (unique slugs).
-- Remove later with: delete from branches where slug like 'demo-%'; delete from room_types where slug in ('standard','deluxe','executive');

with p as (
  select id from properties order by created_at limit 1
),
b as (
  insert into branches (property_id, slug, name, address, directions, is_open)
  select p.id, v.slug, v.name, v.address, v.directions, true
  from p, (values
    ('demo-lodge-north', 'Demo Lodge North', '1 Example Road, Demo City',
      'Two blocks from the Demo City bus rank, behind the example market.'),
    ('demo-lodge-south', 'Demo Lodge South', '25 Sample Avenue, Demo City',
      'Next to the sample petrol station on Sample Avenue.')
  ) as v(slug, name, address, directions)
  returning id, slug
),
rt as (
  insert into room_types (property_id, slug, name, description)
  select p.id, v.slug, v.name, v.description
  from p, (values
    ('standard', 'Standard', 'Comfortable room with a double bed'),
    ('deluxe', 'Deluxe', 'Larger room with a work desk'),
    ('executive', 'Executive', 'Spacious room with a sitting area')
  ) as v(slug, name, description)
  returning id, slug
),
brt as (
  insert into branch_room_types (branch_id, room_type_id, room_count, price_usd, price_confirmed, price_note)
  select b.id, rt.id, v.cnt, v.price, v.confirmed, 'per night'
  from b
  join (values
    ('demo-lodge-north', 'standard', 8, 25::numeric, true),
    ('demo-lodge-north', 'deluxe', 5, 50::numeric, true),
    ('demo-lodge-north', 'executive', 2, null::numeric, false),
    ('demo-lodge-south', 'standard', 6, 25::numeric, true),
    ('demo-lodge-south', 'deluxe', 4, 50::numeric, true)
  ) as v(bslug, rslug, cnt, price, confirmed) on v.bslug = b.slug
  join rt on rt.slug = v.rslug
  returning 1
)
insert into facilities (property_id, branch_id, name, description, capacity, price_usd, price_confirmed)
select p.id, b.id, 'Conference room', 'Meeting room with a projector', 30, null, false
from p, b
where b.slug = 'demo-lodge-north';
