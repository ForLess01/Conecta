-- Self-service account, onboarding, verification, and dashboard workflows.

create table if not exists public.account_preferences (
  user_id uuid primary key references public.user_profiles(id) on delete cascade,
  approximate_location_only boolean not null default true,
  notify_negotiation boolean not null default true,
  notify_order boolean not null default true,
  notify_transport boolean not null default true,
  notify_risk boolean not null default true,
  notify_system boolean not null default true,
  updated_at timestamptz not null default now()
);

create table if not exists public.actor_onboarding_details (
  actor_id uuid not null references public.actors(id) on delete cascade,
  role_code text not null check (role_code in ('productor', 'comprador', 'transportista')),
  details jsonb not null default '{}'::jsonb check (jsonb_typeof(details) = 'object' and octet_length(details::text) <= 32768),
  completed_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (actor_id, role_code)
);

create trigger trg_account_preferences_updated_at
before update on public.account_preferences
for each row execute function public.set_updated_at();

create trigger trg_actor_onboarding_details_updated_at
before update on public.actor_onboarding_details
for each row execute function public.set_updated_at();

alter table public.account_preferences enable row level security;
alter table public.actor_onboarding_details enable row level security;

create policy account_preferences_self on public.account_preferences
for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy actor_onboarding_details_self on public.actor_onboarding_details
for all to authenticated using (public.can_act_as(actor_id)) with check (public.can_act_as(actor_id));

grant select, insert, update, delete on public.account_preferences to authenticated;
grant select, insert, update, delete on public.actor_onboarding_details to authenticated;

create or replace function public.account_get_settings(p_actor_id uuid)
returns jsonb
language plpgsql stable security definer set search_path = public
as $$
declare v_result jsonb;
begin
  if auth.uid() is null or not public.can_act_as(p_actor_id) then
    raise exception 'Actor not accessible';
  end if;

  select jsonb_build_object(
    'name', a.display_name,
    'phone', coalesce(up.phone, ''),
    'language', up.preferred_language,
    'approximateLocationOnly', coalesce(ap.approximate_location_only, true),
    'notifications', jsonb_build_object(
      'negotiation', coalesce(ap.notify_negotiation, true),
      'order', coalesce(ap.notify_order, true),
      'transport', coalesce(ap.notify_transport, true),
      'risk', coalesce(ap.notify_risk, true),
      'system', coalesce(ap.notify_system, true)
    )
  ) into v_result
  from public.actors a
  join public.user_profiles up on up.id = auth.uid()
  left join public.account_preferences ap on ap.user_id = auth.uid()
  where a.id = p_actor_id;

  return v_result;
end;
$$;

create or replace function public.account_update_settings(
  p_actor_id uuid,
  p_name text,
  p_phone text,
  p_language text,
  p_approximate_location_only boolean,
  p_notifications jsonb
)
returns void
language plpgsql security definer set search_path = public
as $$
declare v_name text := nullif(trim(p_name), '');
begin
  if auth.uid() is null or not public.can_act_as(p_actor_id) then raise exception 'Actor not accessible'; end if;
  if v_name is null or char_length(v_name) > 120 then raise exception 'Invalid account name'; end if;
  if p_language not in ('es', 'qu', 'ay') then raise exception 'Unsupported language'; end if;
  if jsonb_typeof(p_notifications) <> 'object' then raise exception 'Invalid notification preferences'; end if;

  update public.user_profiles
  set full_name = v_name, phone = nullif(trim(p_phone), ''), preferred_language = p_language
  where id = auth.uid();
  update public.actors set display_name = v_name where id = p_actor_id;

  insert into public.account_preferences (
    user_id, approximate_location_only, notify_negotiation, notify_order,
    notify_transport, notify_risk, notify_system
  ) values (
    auth.uid(), p_approximate_location_only,
    coalesce((p_notifications->>'negotiation')::boolean, true),
    coalesce((p_notifications->>'order')::boolean, true),
    coalesce((p_notifications->>'transport')::boolean, true),
    coalesce((p_notifications->>'risk')::boolean, true),
    coalesce((p_notifications->>'system')::boolean, true)
  ) on conflict (user_id) do update set
    approximate_location_only = excluded.approximate_location_only,
    notify_negotiation = excluded.notify_negotiation,
    notify_order = excluded.notify_order,
    notify_transport = excluded.notify_transport,
    notify_risk = excluded.notify_risk,
    notify_system = excluded.notify_system;
end;
$$;

create or replace function public.account_set_operational_roles(p_actor_id uuid, p_role_codes text[])
returns text[]
language plpgsql security definer set search_path = public
as $$
declare v_code text; v_role_id smallint; v_normalized text[];
begin
  if auth.uid() is null or not public.can_act_as(p_actor_id) then raise exception 'Actor not accessible'; end if;
  select coalesce(array_agg(distinct lower(code) order by lower(code)), '{}'::text[])
  into v_normalized from unnest(coalesce(p_role_codes, '{}'::text[])) code;
  if cardinality(v_normalized) = 0 then raise exception 'At least one operational role is required'; end if;
  if exists (select 1 from unnest(v_normalized) code where code not in ('productor', 'comprador', 'transportista')) then
    raise exception 'Role cannot be self-assigned';
  end if;

  delete from public.actor_roles ar using public.app_roles r
  where ar.actor_id = p_actor_id and ar.role_id = r.id
    and upper(r.code::text) in ('PRODUCER', 'BUYER', 'TRANSPORTER');
  delete from public.user_roles ur using public.app_roles r
  where ur.user_id = auth.uid() and ur.role_id = r.id
    and upper(r.code::text) in ('PRODUCER', 'BUYER', 'TRANSPORTER');

  foreach v_code in array v_normalized loop
    select id into v_role_id from public.app_roles where upper(code::text) = case v_code
      when 'productor' then 'PRODUCER' when 'comprador' then 'BUYER' else 'TRANSPORTER' end;
    if v_role_id is null then raise exception 'Operational role catalog is incomplete'; end if;
    insert into public.actor_roles(actor_id, role_id) values (p_actor_id, v_role_id);
    insert into public.user_roles(user_id, role_id) values (auth.uid(), v_role_id) on conflict do nothing;
  end loop;
  return v_normalized;
end;
$$;

create or replace function public.account_complete_onboarding(
  p_actor_id uuid,
  p_role_code text,
  p_details jsonb,
  p_name text default null,
  p_phone text default null,
  p_vehicle jsonb default null
)
returns void
language plpgsql security definer set search_path = public
as $$
declare v_type_id smallint; v_body_id smallint; v_name text := nullif(trim(p_name), '');
begin
  if auth.uid() is null or not public.can_act_as(p_actor_id) then raise exception 'Actor not accessible'; end if;
  if p_role_code not in ('productor', 'comprador', 'transportista') then raise exception 'Unsupported onboarding role'; end if;
  if jsonb_typeof(p_details) <> 'object' then raise exception 'Invalid onboarding details'; end if;
  if not exists (
    select 1 from public.actor_roles ar join public.app_roles r on r.id = ar.role_id
    where ar.actor_id = p_actor_id and upper(r.code::text) = case p_role_code
      when 'productor' then 'PRODUCER' when 'comprador' then 'BUYER' else 'TRANSPORTER' end
  ) then raise exception 'Actor does not have the onboarding role'; end if;

  if v_name is not null then
    if char_length(v_name) > 120 then raise exception 'Invalid account name'; end if;
    update public.actors set display_name = v_name where id = p_actor_id;
    update public.user_profiles set full_name = v_name where id = auth.uid();
  end if;
  if p_phone is not null then update public.user_profiles set phone = nullif(trim(p_phone), '') where id = auth.uid(); end if;

  insert into public.actor_onboarding_details(actor_id, role_code, details)
  values (p_actor_id, p_role_code, p_details)
  on conflict (actor_id, role_code) do update set details = excluded.details, completed_at = now();

  if p_role_code = 'transportista' and p_vehicle is not null and nullif(trim(p_vehicle->>'plate'), '') is not null then
    select id into v_type_id from public.vehicle_types where upper(code::text) = upper(p_vehicle->>'vehicleTypeCode');
    select id into v_body_id from public.vehicle_body_types where upper(code::text) = upper(p_vehicle->>'bodyTypeCode');
    if v_type_id is null then raise exception 'Unsupported vehicle type'; end if;
    insert into public.vehicles (
      owner_actor_id, vehicle_type_id, body_type_id, plate, capacity_kg, capacity_m3,
      covered, refrigerated, four_wheel_drive, display_name
    ) values (
      p_actor_id, v_type_id, v_body_id, upper(trim(p_vehicle->>'plate')),
      (p_vehicle->>'capacityKg')::numeric, nullif(p_vehicle->>'capacityM3', '')::numeric,
      coalesce((p_vehicle->>'covered')::boolean, false),
      coalesce((p_vehicle->>'refrigerated')::boolean, false),
      coalesce((p_vehicle->>'fourWheelDrive')::boolean, false), 'Vehículo principal'
    );
  end if;
end;
$$;

create or replace function public.account_submit_verification(p_actor_id uuid, p_notes text default null)
returns uuid
language plpgsql security definer set search_path = public
as $$
declare v_request_id uuid; v_status_id smallint;
begin
  if auth.uid() is null or not public.can_act_as(p_actor_id) then raise exception 'Actor not accessible'; end if;
  select id into v_request_id from public.verification_requests
  where actor_id = p_actor_id and status in ('PENDING', 'NEEDS_INFO') order by created_at desc limit 1;
  if v_request_id is not null then return v_request_id; end if;
  select id into v_status_id from public.verification_statuses where upper(code::text) = 'IDENTITY_VERIFIED';
  if v_status_id is null then raise exception 'Verification status catalog is incomplete'; end if;
  insert into public.verification_requests(actor_id, requested_status_id, applicant_notes)
  values (p_actor_id, v_status_id, nullif(trim(p_notes), '')) returning id into v_request_id;
  return v_request_id;
end;
$$;

create or replace function public.account_get_verification(p_actor_id uuid)
returns jsonb
language plpgsql stable security definer set search_path = public
as $$
declare v_result jsonb;
begin
  if auth.uid() is null or not public.can_act_as(p_actor_id) then raise exception 'Actor not accessible'; end if;
  select jsonb_build_object(
    'level', vs.code, 'requestId', vr.id, 'requestStatus', vr.status,
    'reviewerNotes', vr.reviewer_notes, 'createdAt', vr.created_at,
    'profileComplete', exists(select 1 from public.actor_onboarding_details aod where aod.actor_id = p_actor_id)
  ) into v_result
  from public.actors a
  left join public.verification_statuses vs on vs.id = a.verification_status_id
  left join lateral (
    select * from public.verification_requests request
    where request.actor_id = a.id order by request.created_at desc limit 1
  ) vr on true where a.id = p_actor_id;
  return v_result;
end;
$$;

create or replace function public.account_get_dashboard(p_actor_id uuid)
returns jsonb
language plpgsql stable security definer set search_path = public
as $$
declare v_result jsonb;
begin
  if auth.uid() is null or not public.can_act_as(p_actor_id) then raise exception 'Actor not accessible'; end if;
  select jsonb_build_object(
    'producer', jsonb_build_object(
      'potentialSales', coalesce((select sum(ml.quantity * suggestion.price_mid) from public.market_listings ml
        left join lateral (select lps.price_mid from public.listing_price_suggestions lps where lps.listing_id = ml.id order by lps.calculated_at desc limit 1) suggestion on true
        where ml.actor_id = p_actor_id and ml.listing_type = 'OFFER' and ml.status = 'ACTIVE'), 0),
      'offersReceived', (select count(*) from public.commercial_proposals cp join public.negotiations n on n.id = cp.negotiation_id where n.producer_actor_id = p_actor_id and cp.created_by_actor_id <> p_actor_id and cp.created_at >= now() - interval '7 days'),
      'activeNegotiations', (select count(*) from public.negotiations n where n.producer_actor_id = p_actor_id and n.status in ('OPEN','OFFER_SUBMITTED','COUNTERED')),
      'ordersToDispatch', (select count(distinct oi.order_id) from public.order_items oi join public.order_supplier_allocations osa on osa.order_item_id = oi.id join public.commercial_orders co on co.id = oi.order_id where osa.producer_actor_id = p_actor_id and co.status in ('CONFIRMED','PENDING_LOGISTICS','READY_FOR_PICKUP')),
      'products', coalesce((select jsonb_agg(row_data order by row_data->>'createdAt' desc) from (select jsonb_build_object('id', ml.id, 'name', coalesce(pv.name, p.name), 'quantity', ml.quantity, 'unit', u.symbol, 'location', lp.label, 'createdAt', ml.created_at) row_data from public.market_listings ml join public.products p on p.id = ml.product_id left join public.product_varieties pv on pv.id = ml.variety_id join public.units_of_measure u on u.id = ml.unit_id join public.location_points lp on lp.id = ml.location_point_id where ml.actor_id = p_actor_id and ml.listing_type = 'OFFER' and ml.status = 'ACTIVE' order by ml.created_at desc limit 5) rows), '[]'::jsonb)
    ),
    'buyer', jsonb_build_object(
      'activeRequests', (select count(*) from public.market_listings where actor_id = p_actor_id and listing_type = 'REQUEST' and status = 'ACTIVE'),
      'proposalsReceived', (select count(*) from public.commercial_proposals cp join public.negotiations n on n.id = cp.negotiation_id where n.buyer_actor_id = p_actor_id and cp.created_by_actor_id <> p_actor_id),
      'activeOrders', (select count(*) from public.commercial_orders where buyer_actor_id = p_actor_id and status not in ('COMPLETED','CANCELLED','EXPIRED')),
      'monthlySpend', coalesce((select sum(oi.quantity * oi.agreed_unit_price) from public.commercial_orders co join public.order_items oi on oi.order_id = co.id where co.buyer_actor_id = p_actor_id and co.created_at >= date_trunc('month', now()) and co.status not in ('CANCELLED','EXPIRED')), 0),
      'savedProviders', (select count(*) from public.saved_actors where user_id = auth.uid()),
      'orders', coalesce((select jsonb_agg(row_data) from (select jsonb_build_object('id', co.id, 'status', co.status, 'createdAt', co.created_at) row_data from public.commercial_orders co where co.buyer_actor_id = p_actor_id order by co.created_at desc limit 5) rows), '[]'::jsonb),
      'requests', coalesce((select jsonb_agg(row_data) from (select jsonb_build_object('id', ml.id, 'name', coalesce(pv.name, p.name), 'quantity', ml.quantity, 'unit', u.symbol) row_data from public.market_listings ml join public.products p on p.id = ml.product_id left join public.product_varieties pv on pv.id = ml.variety_id join public.units_of_measure u on u.id = ml.unit_id where ml.actor_id = p_actor_id and ml.listing_type = 'REQUEST' and ml.status = 'ACTIVE' order by ml.created_at desc limit 5) rows), '[]'::jsonb)
    ),
    'transporter', jsonb_build_object(
      'openLoads', (select count(*) from public.shipment_requests where status = 'OPEN_FOR_BIDS'),
      'sentBids', (select count(*) from public.freight_bids where transporter_actor_id = p_actor_id and status = 'ACTIVE'),
      'scheduledTrips', (select count(*) from public.trips t join public.shipment_assignments sa on sa.id = t.shipment_assignment_id join public.freight_bids fb on fb.id = sa.freight_bid_id where fb.transporter_actor_id = p_actor_id and t.status in ('SCHEDULED','PICKED_UP','IN_TRANSIT','DELAYED')),
      'estimatedIncome', coalesce((select sum(fb.fare_amount) from public.freight_bids fb join public.shipment_assignments sa on sa.freight_bid_id = fb.id where fb.transporter_actor_id = p_actor_id and sa.accepted_at >= date_trunc('month', now())), 0),
      'loads', coalesce((select jsonb_agg(row_data) from (select jsonb_build_object('id', sr.id, 'origin', sr.origin_label, 'destination', sr.destination_label, 'cargo', sr.cargo_description, 'weightKg', sr.total_weight_kg) row_data from public.shipment_requests sr where sr.status = 'OPEN_FOR_BIDS' order by sr.created_at desc limit 5) rows), '[]'::jsonb),
      'trips', coalesce((select jsonb_agg(row_data) from (select jsonb_build_object('id', t.id, 'status', t.status, 'cargo', sr.cargo_description) row_data from public.trips t join public.shipment_assignments sa on sa.id = t.shipment_assignment_id join public.freight_bids fb on fb.id = sa.freight_bid_id join public.shipment_requests sr on sr.id = sa.shipment_request_id where fb.transporter_actor_id = p_actor_id order by t.created_at desc limit 5) rows), '[]'::jsonb)
    ),
    'negotiations', coalesce((select jsonb_agg(row_data) from (select jsonb_build_object('id', n.id, 'preview', coalesce((select m.body from public.messages m where m.negotiation_id = n.id order by m.created_at desc limit 1), 'Negociación abierta'), 'expiresAt', n.expires_at) row_data from public.negotiations n where p_actor_id in (n.buyer_actor_id, n.producer_actor_id) and n.status in ('OPEN','OFFER_SUBMITTED','COUNTERED') order by n.updated_at desc limit 5) rows), '[]'::jsonb)
  ) into v_result;
  return v_result;
end;
$$;

revoke all on function public.account_get_settings(uuid) from public;
revoke all on function public.account_update_settings(uuid, text, text, text, boolean, jsonb) from public;
revoke all on function public.account_set_operational_roles(uuid, text[]) from public;
revoke all on function public.account_complete_onboarding(uuid, text, jsonb, text, text, jsonb) from public;
revoke all on function public.account_submit_verification(uuid, text) from public;
revoke all on function public.account_get_verification(uuid) from public;
revoke all on function public.account_get_dashboard(uuid) from public;
grant execute on function public.account_get_settings(uuid) to authenticated;
grant execute on function public.account_update_settings(uuid, text, text, text, boolean, jsonb) to authenticated;
grant execute on function public.account_set_operational_roles(uuid, text[]) to authenticated;
grant execute on function public.account_complete_onboarding(uuid, text, jsonb, text, text, jsonb) to authenticated;
grant execute on function public.account_submit_verification(uuid, text) to authenticated;
grant execute on function public.account_get_verification(uuid) to authenticated;
grant execute on function public.account_get_dashboard(uuid) to authenticated;
