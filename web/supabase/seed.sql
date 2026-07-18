-- Deterministic, non-login demo identities. Real users are created through Auth.
insert into auth.users (id, email, raw_user_meta_data)
values
  ('10000000-0000-4000-8000-000000000001', 'rosa.demo@conecta.local', '{"full_name":"Rosa Quispe"}'::jsonb),
  ('10000000-0000-4000-8000-000000000002', 'mercado.demo@conecta.local', '{"full_name":"Mercado San Camilo"}'::jsonb),
  ('10000000-0000-4000-8000-000000000003', 'transporte.demo@conecta.local', '{"full_name":"Transportes Altiplano"}'::jsonb)
on conflict (id) do nothing;

insert into public.actors (id, kind, user_id, display_name, verification_status_id)
select
  seeded.id,
  'PERSON'::public.actor_kind,
  seeded.user_id,
  seeded.display_name,
  vs.id
from (values
  ('20000000-0000-4000-8000-000000000001'::uuid, '10000000-0000-4000-8000-000000000001'::uuid, 'Rosa Quispe'),
  ('20000000-0000-4000-8000-000000000002'::uuid, '10000000-0000-4000-8000-000000000002'::uuid, 'Mercado San Camilo'),
  ('20000000-0000-4000-8000-000000000003'::uuid, '10000000-0000-4000-8000-000000000003'::uuid, 'Transportes Altiplano')
) as seeded(id, user_id, display_name)
join public.verification_statuses vs on upper(vs.code::text) = 'IDENTITY_VERIFIED'
on conflict (id) do nothing;

insert into public.user_roles (user_id, role_id)
select seeded.user_id, r.id
from (values
  ('10000000-0000-4000-8000-000000000001'::uuid, 'PRODUCER'),
  ('10000000-0000-4000-8000-000000000002'::uuid, 'BUYER'),
  ('10000000-0000-4000-8000-000000000003'::uuid, 'TRANSPORTER')
) as seeded(user_id, role_code)
join public.app_roles r on upper(r.code::text) = seeded.role_code
on conflict do nothing;

insert into public.actor_roles (actor_id, role_id)
select seeded.actor_id, r.id
from (values
  ('20000000-0000-4000-8000-000000000001'::uuid, 'PRODUCER'),
  ('20000000-0000-4000-8000-000000000002'::uuid, 'BUYER'),
  ('20000000-0000-4000-8000-000000000003'::uuid, 'TRANSPORTER')
) as seeded(actor_id, role_code)
join public.app_roles r on upper(r.code::text) = seeded.role_code
on conflict do nothing;

insert into public.location_points (
  id, label, address_reference, latitude, longitude, is_approximate
) values
  ('30000000-0000-4000-8000-000000000001', 'Acora, Puno', 'Zona productiva de Acora', -15.972300, -69.797800, true),
  ('30000000-0000-4000-8000-000000000002', 'Arequipa', 'Mercado San Camilo', -16.398800, -71.536900, true),
  ('30000000-0000-4000-8000-000000000003', 'Juliaca, Puno', 'Base logística', -15.499700, -70.133300, true)
on conflict (id) do nothing;

insert into public.actor_locations (actor_id, location_point_id, label, is_primary, is_public)
values
  ('20000000-0000-4000-8000-000000000001', '30000000-0000-4000-8000-000000000001', 'Parcela principal', true, true),
  ('20000000-0000-4000-8000-000000000002', '30000000-0000-4000-8000-000000000002', 'Punto de entrega', true, true),
  ('20000000-0000-4000-8000-000000000003', '30000000-0000-4000-8000-000000000003', 'Base', true, true)
on conflict do nothing;

insert into public.market_listings (
  id, listing_type, actor_id, product_id, variety_id, title, description,
  quantity, unit_id, location_point_id, available_from, status
)
select
  '40000000-0000-4000-8000-000000000001'::uuid,
  'OFFER'::public.listing_type,
  '20000000-0000-4000-8000-000000000001'::uuid,
  p.id,
  pv.id,
  'Papa Canchán seleccionada',
  'Cosecha reciente disponible para entrega coordinada.',
  5000,
  u.id,
  '30000000-0000-4000-8000-000000000001'::uuid,
  current_date,
  'ACTIVE'::public.listing_status
from public.products p
join public.product_varieties pv on pv.product_id = p.id and upper(pv.code::text) = 'CANCHAN'
join public.units_of_measure u on upper(u.code::text) = 'KG'
where upper(p.code::text) = 'POTATO'
on conflict (id) do nothing;

insert into public.product_offers (listing_id, minimum_order_quantity, allow_partial_quantity)
values ('40000000-0000-4000-8000-000000000001', 100, true)
on conflict (listing_id) do nothing;

insert into public.offer_negotiation_policies (
  offer_listing_id, currency_id, quick_negotiation_enabled, auto_accept_enabled,
  conversational_window_hours, max_quick_attempts, reservation_minutes
)
select
  '40000000-0000-4000-8000-000000000001', c.id, true, true, 24, 3, 15
from public.currencies c where c.code = 'PEN'
on conflict (offer_listing_id) do nothing;

insert into public.offer_private_pricing (offer_listing_id, hidden_floor_price)
values ('40000000-0000-4000-8000-000000000001', 1.90)
on conflict (offer_listing_id) do nothing;

insert into public.listing_price_suggestions (
  listing_id, currency_id, unit_id, price_low, price_mid, price_high, confidence,
  method_version, explanation, calculated_at
)
select
  '40000000-0000-4000-8000-000000000001', c.id, u.id,
  1.90, 2.10, 2.35, 82, 'seed-v1', 'Semilla demostrativa', now()
from public.currencies c
join public.units_of_measure u on upper(u.code::text) = 'KG'
where c.code = 'PEN'
on conflict do nothing;

insert into public.vehicles (
  id, owner_actor_id, vehicle_type_id, body_type_id, plate,
  capacity_kg, capacity_m3, covered, status
)
select
  '50000000-0000-4000-8000-000000000001',
  '20000000-0000-4000-8000-000000000003',
  vt.id, bt.id, 'Z9X-321', 8000, 32, true, 'ACTIVE'
from public.vehicle_types vt
join public.vehicle_body_types bt on upper(bt.code::text) = 'COVERED'
where upper(vt.code::text) = 'MEDIUM_TRUCK'
on conflict (id) do nothing;

insert into public.notifications (id, user_id, title, body, link_path)
values
  ('60000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000001', 'Tu oferta está visible', 'La papa Canchán ya aparece en el marketplace.', '/marketplace/offers/40000000-0000-4000-8000-000000000001')
on conflict (id) do nothing;
