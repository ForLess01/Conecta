-- FILE: seed.sql
-- ============================================================
-- Demo environment seed: locations and demo users/actors/vehicles.
--
-- The product catalog (categories, products, varieties, attributes) is
-- already seeded by db/db_conecta.sql (section "04_seed_catalogs.sql");
-- this file only adds what that script does not cover, per docs/DEMO_DATA_PLAN.md.
--
-- Runs with the elevated privileges Supabase's local `db reset` / seed
-- tooling uses (it can insert into auth.users directly). Demo credentials
-- only — never apply this against a production project.
--
-- Idempotent: fixed UUIDs + `on conflict do nothing` make re-running safe.
-- ============================================================

-- ============================================================
-- LOCATIONS
-- ============================================================

insert into public.location_points (id, label, latitude, longitude, is_approximate) values
  ('30000000-0000-0000-0000-000000000001', 'Acora, Puno', -16.2333, -69.6667, true),
  ('30000000-0000-0000-0000-000000000002', 'Mazocruz, Puno', -16.7333, -69.7167, true),
  ('30000000-0000-0000-0000-000000000003', 'Juli, Puno', -16.2075, -69.4597, true),
  ('30000000-0000-0000-0000-000000000004', 'Arequipa', -16.4090, -71.5375, true),
  ('30000000-0000-0000-0000-000000000005', 'Juliaca, Puno', -15.5000, -70.1333, true)
on conflict (id) do nothing;

-- ============================================================
-- DEMO USERS (auth.users -> user_profiles via trg_auth_user_created)
-- Shared demo password: Demo2026! (see docs/DEMO_DATA_PLAN.md)
-- ============================================================

insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password,
  email_confirmed_at, created_at, updated_at,
  raw_app_meta_data, raw_user_meta_data
) values
  ('00000000-0000-0000-0000-000000000000', '10000000-0000-0000-0000-000000000001', 'authenticated', 'authenticated',
   'productor1@conecta.demo', crypt('Demo2026!', gen_salt('bf')), now(), now(), now(),
   '{"provider":"email","providers":["email"]}', '{"full_name":"Papa — Acora"}'),
  ('00000000-0000-0000-0000-000000000000', '10000000-0000-0000-0000-000000000002', 'authenticated', 'authenticated',
   'productor2@conecta.demo', crypt('Demo2026!', gen_salt('bf')), now(), now(), now(),
   '{"provider":"email","providers":["email"]}', '{"full_name":"Asociación alpaquera"}'),
  ('00000000-0000-0000-0000-000000000000', '10000000-0000-0000-0000-000000000003', 'authenticated', 'authenticated',
   'productor3@conecta.demo', crypt('Demo2026!', gen_salt('bf')), now(), now(), now(),
   '{"provider":"email","providers":["email"]}', '{"full_name":"Quinua — Juli"}'),
  ('00000000-0000-0000-0000-000000000000', '10000000-0000-0000-0000-000000000004', 'authenticated', 'authenticated',
   'comprador1@conecta.demo', crypt('Demo2026!', gen_salt('bf')), now(), now(), now(),
   '{"provider":"email","providers":["email"]}', '{"full_name":"Restaurante"}'),
  ('00000000-0000-0000-0000-000000000000', '10000000-0000-0000-0000-000000000005', 'authenticated', 'authenticated',
   'comprador2@conecta.demo', crypt('Demo2026!', gen_salt('bf')), now(), now(), now(),
   '{"provider":"email","providers":["email"]}', '{"full_name":"Acopiador"}'),
  ('00000000-0000-0000-0000-000000000000', '10000000-0000-0000-0000-000000000006', 'authenticated', 'authenticated',
   'transportista1@conecta.demo', crypt('Demo2026!', gen_salt('bf')), now(), now(), now(),
   '{"provider":"email","providers":["email"]}', '{"full_name":"Camioneta 4x4"}'),
  ('00000000-0000-0000-0000-000000000000', '10000000-0000-0000-0000-000000000007', 'authenticated', 'authenticated',
   'transportista2@conecta.demo', crypt('Demo2026!', gen_salt('bf')), now(), now(), now(),
   '{"provider":"email","providers":["email"]}', '{"full_name":"Camión 8 t"}'),
  ('00000000-0000-0000-0000-000000000000', '10000000-0000-0000-0000-000000000008', 'authenticated', 'authenticated',
   'transportista3@conecta.demo', crypt('Demo2026!', gen_salt('bf')), now(), now(), now(),
   '{"provider":"email","providers":["email"]}', '{"full_name":"Empresa camión 12 t"}'),
  ('00000000-0000-0000-0000-000000000000', '10000000-0000-0000-0000-000000000009', 'authenticated', 'authenticated',
   'admin@conecta.demo', crypt('Demo2026!', gen_salt('bf')), now(), now(), now(),
   '{"provider":"email","providers":["email"]}', '{"full_name":"Admin demo"}')
on conflict (id) do nothing;

-- ============================================================
-- ROLES
-- ============================================================

insert into public.user_roles (user_id, role_id)
select u.id, ar.id
from (values
  ('10000000-0000-0000-0000-000000000001'::uuid, 'PRODUCER'),
  ('10000000-0000-0000-0000-000000000002'::uuid, 'PRODUCER'),
  ('10000000-0000-0000-0000-000000000003'::uuid, 'PRODUCER'),
  ('10000000-0000-0000-0000-000000000004'::uuid, 'BUYER'),
  ('10000000-0000-0000-0000-000000000005'::uuid, 'BUYER'),
  ('10000000-0000-0000-0000-000000000006'::uuid, 'TRANSPORTER'),
  ('10000000-0000-0000-0000-000000000007'::uuid, 'TRANSPORTER'),
  ('10000000-0000-0000-0000-000000000008'::uuid, 'TRANSPORTER'),
  ('10000000-0000-0000-0000-000000000009'::uuid, 'ADMIN')
) as u(id, role_code)
join public.app_roles ar on ar.code = u.role_code
on conflict (user_id, role_id) do nothing;

-- ============================================================
-- ACTORS
-- ============================================================

insert into public.actors (id, kind, user_id, display_name, is_active) values
  ('20000000-0000-0000-0000-000000000001', 'PERSON', '10000000-0000-0000-0000-000000000001', 'Papa — Acora', true),
  ('20000000-0000-0000-0000-000000000002', 'PERSON', '10000000-0000-0000-0000-000000000002', 'Asociación alpaquera', true),
  ('20000000-0000-0000-0000-000000000003', 'PERSON', '10000000-0000-0000-0000-000000000003', 'Quinua — Juli', true),
  ('20000000-0000-0000-0000-000000000004', 'PERSON', '10000000-0000-0000-0000-000000000004', 'Restaurante', true),
  ('20000000-0000-0000-0000-000000000005', 'PERSON', '10000000-0000-0000-0000-000000000005', 'Acopiador', true),
  ('20000000-0000-0000-0000-000000000006', 'PERSON', '10000000-0000-0000-0000-000000000006', 'Camioneta 4x4', true),
  ('20000000-0000-0000-0000-000000000007', 'PERSON', '10000000-0000-0000-0000-000000000007', 'Camión 8 t', true),
  ('20000000-0000-0000-0000-000000000008', 'PERSON', '10000000-0000-0000-0000-000000000008', 'Empresa camión 12 t', true),
  ('20000000-0000-0000-0000-000000000009', 'PERSON', '10000000-0000-0000-0000-000000000009', 'Admin demo', true)
on conflict (id) do nothing;

insert into public.actor_roles (actor_id, role_id)
select a.id, ar.id
from (values
  ('20000000-0000-0000-0000-000000000001'::uuid, 'PRODUCER'),
  ('20000000-0000-0000-0000-000000000002'::uuid, 'PRODUCER'),
  ('20000000-0000-0000-0000-000000000003'::uuid, 'PRODUCER'),
  ('20000000-0000-0000-0000-000000000004'::uuid, 'BUYER'),
  ('20000000-0000-0000-0000-000000000005'::uuid, 'BUYER'),
  ('20000000-0000-0000-0000-000000000006'::uuid, 'TRANSPORTER'),
  ('20000000-0000-0000-0000-000000000007'::uuid, 'TRANSPORTER'),
  ('20000000-0000-0000-0000-000000000008'::uuid, 'TRANSPORTER'),
  ('20000000-0000-0000-0000-000000000009'::uuid, 'ADMIN')
) as a(id, role_code)
join public.app_roles ar on ar.code = a.role_code
on conflict (actor_id, role_id) do nothing;

insert into public.actor_locations (actor_id, location_point_id, label, is_primary, is_public) values
  ('20000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000001', 'Chacra', true, true),
  ('20000000-0000-0000-0000-000000000002', '30000000-0000-0000-0000-000000000002', 'Comunidad', true, true),
  ('20000000-0000-0000-0000-000000000003', '30000000-0000-0000-0000-000000000003', 'Chacra', true, true),
  ('20000000-0000-0000-0000-000000000004', '30000000-0000-0000-0000-000000000004', 'Local', true, true),
  ('20000000-0000-0000-0000-000000000005', '30000000-0000-0000-0000-000000000005', 'Almacén', true, true)
on conflict (actor_id, location_point_id) do nothing;

-- ============================================================
-- VEHICLES
-- ============================================================

insert into public.vehicles (id, owner_actor_id, vehicle_type_id, capacity_kg, four_wheel_drive, status)
select '40000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000006', vt.id, 1000, true, 'ACTIVE'
from public.vehicle_types vt where vt.code = 'PICKUP'
on conflict (id) do nothing;

insert into public.vehicles (id, owner_actor_id, vehicle_type_id, capacity_kg, status)
select '40000000-0000-0000-0000-000000000002', '20000000-0000-0000-0000-000000000007', vt.id, 8000, 'ACTIVE'
from public.vehicle_types vt where vt.code = 'MEDIUM_TRUCK'
on conflict (id) do nothing;

insert into public.vehicles (id, owner_actor_id, vehicle_type_id, capacity_kg, status)
select '40000000-0000-0000-0000-000000000003', '20000000-0000-0000-0000-000000000008', vt.id, 12000, 'ACTIVE'
from public.vehicle_types vt where vt.code = 'HEAVY_TRUCK'
on conflict (id) do nothing;
