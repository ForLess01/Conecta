-- End-to-end logistics workflows. This migration is additive and is not applied remotely here.

alter table public.vehicles
  add column if not exists display_name text,
  add column if not exists is_available boolean not null default true;

alter table public.shipment_requests
  add column if not exists origin_label text,
  add column if not exists destination_label text,
  add column if not exists package_count integer,
  add column if not exists needs_helper boolean not null default false,
  add column if not exists loading_notes text,
  add constraint shipment_package_count_positive check (package_count is null or package_count > 0);

alter table public.freight_bids
  add column if not exists helper_included boolean not null default false,
  add column if not exists insurance_included boolean not null default false;

alter table public.trip_evidence
  add column if not exists original_filename text,
  add column if not exists content_type text,
  add column if not exists byte_size bigint,
  add column if not exists metadata jsonb not null default '{}'::jsonb,
  add constraint trip_evidence_byte_size_valid check (byte_size is null or byte_size between 1 and 10485760);

create table if not exists public.trip_operation_records (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references public.trips(id) on delete cascade,
  record_type text not null check (record_type in ('PICKUP', 'DELIVERY')),
  recorded_weight_kg numeric(18,3) check (recorded_weight_kg is null or recorded_weight_kg > 0),
  package_count integer check (package_count is null or package_count > 0),
  accepted_quantity numeric(18,3) check (accepted_quantity is null or accepted_quantity >= 0),
  observed_quantity numeric(18,3) check (observed_quantity is null or observed_quantity >= 0),
  condition_notes text,
  notes text,
  confirmed boolean not null default false,
  recorded_by_actor_id uuid not null references public.actors(id),
  recorded_at timestamptz not null default now(),
  unique (trip_id, record_type)
);

create table if not exists public.trip_incidents (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references public.trips(id) on delete cascade,
  incident_type text not null check (incident_type in ('DELAY', 'ROAD_BLOCK', 'BREAKDOWN', 'WEIGHT_DIFFERENCE', 'DAMAGE', 'REJECTION', 'OTHER')),
  description text not null check (char_length(trim(description)) between 5 and 2000),
  location_label text,
  reported_by_actor_id uuid not null references public.actors(id),
  reported_at timestamptz not null default now(),
  resolved_at timestamptz
);

alter table public.trip_operation_records enable row level security;
alter table public.trip_incidents enable row level security;

create or replace function public.can_manage_trip(target_trip_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.is_admin() or exists (
    select 1
    from public.trips t
    join public.shipment_assignments sa on sa.id = t.shipment_assignment_id
    join public.freight_bids fb on fb.id = sa.freight_bid_id
    where t.id = target_trip_id
      and public.can_act_as(fb.transporter_actor_id)
  );
$$;

revoke all on function public.can_manage_trip(uuid) from public;
grant execute on function public.can_manage_trip(uuid) to authenticated;

create policy trip_operation_records_read on public.trip_operation_records
for select to authenticated using (
  exists (
    select 1 from public.trips t
    join public.shipment_assignments sa on sa.id = t.shipment_assignment_id
    where t.id = trip_operation_records.trip_id
      and public.can_access_shipment(sa.shipment_request_id)
  )
);

create policy trip_incidents_read on public.trip_incidents
for select to authenticated using (
  exists (
    select 1 from public.trips t
    join public.shipment_assignments sa on sa.id = t.shipment_assignment_id
    where t.id = trip_incidents.trip_id
      and public.can_access_shipment(sa.shipment_request_id)
  )
);

create or replace function public.save_shipment_draft(
  p_order_id uuid,
  p_actor_id uuid,
  p_logistics_mode public.logistics_mode,
  p_origin_label text default null,
  p_destination_label text default null,
  p_cargo_description text default null,
  p_weight_kg numeric default null,
  p_volume_m3 numeric default null,
  p_package_count integer default null,
  p_suggested_fare numeric default null,
  p_scheduled_pickup_at timestamptz default null,
  p_needs_helper boolean default false,
  p_loading_notes text default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_shipment_id uuid;
  v_currency_id smallint;
begin
  if not public.can_act_as(p_actor_id) or not exists (
    select 1 from public.commercial_orders
    where id = p_order_id and buyer_actor_id = p_actor_id
  ) then
    raise exception 'Shipment access denied';
  end if;
  if p_weight_kg is not null and p_weight_kg <= 0 then raise exception 'Weight must be positive'; end if;
  if p_volume_m3 is not null and p_volume_m3 <= 0 then raise exception 'Volume must be positive'; end if;
  if p_package_count is not null and p_package_count <= 0 then raise exception 'Package count must be positive'; end if;
  if p_suggested_fare is not null and p_suggested_fare <= 0 then raise exception 'Fare must be positive'; end if;

  select id into v_currency_id from public.currencies where code = 'PEN';
  select id into v_shipment_id
  from public.shipment_requests
  where order_id = p_order_id and status = 'DRAFT'
  order by created_at desc limit 1 for update;

  if v_shipment_id is null then
    insert into public.shipment_requests (
      order_id, requested_by_actor_id, logistics_mode, origin_label, destination_label,
      cargo_description, total_weight_kg, total_volume_m3, package_count, suggested_fare,
      currency_id, scheduled_pickup_at, needs_helper, loading_notes
    ) values (
      p_order_id, p_actor_id, p_logistics_mode, nullif(trim(p_origin_label), ''),
      nullif(trim(p_destination_label), ''), nullif(trim(p_cargo_description), ''), p_weight_kg,
      p_volume_m3, p_package_count, p_suggested_fare, v_currency_id, p_scheduled_pickup_at,
      p_needs_helper, nullif(trim(p_loading_notes), '')
    ) returning id into v_shipment_id;
  else
    update public.shipment_requests set
      logistics_mode = p_logistics_mode,
      origin_label = nullif(trim(p_origin_label), ''),
      destination_label = nullif(trim(p_destination_label), ''),
      cargo_description = nullif(trim(p_cargo_description), ''),
      total_weight_kg = p_weight_kg,
      total_volume_m3 = p_volume_m3,
      package_count = p_package_count,
      suggested_fare = p_suggested_fare,
      currency_id = v_currency_id,
      scheduled_pickup_at = p_scheduled_pickup_at,
      needs_helper = p_needs_helper,
      loading_notes = nullif(trim(p_loading_notes), '')
    where id = v_shipment_id;
  end if;
  return v_shipment_id;
end;
$$;

create or replace function public.publish_shipment(p_shipment_id uuid, p_actor_id uuid)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
begin
  if not exists (
    select 1 from public.shipment_requests sr
    where sr.id = p_shipment_id and sr.status = 'DRAFT'
      and public.can_act_as(p_actor_id)
      and public.can_access_order(sr.order_id)
      and sr.requested_by_actor_id = p_actor_id
      and sr.logistics_mode = 'MARKETPLACE_FREIGHT'
      and sr.origin_label is not null and sr.destination_label is not null
      and sr.cargo_description is not null and sr.total_weight_kg is not null
      and sr.scheduled_pickup_at is not null
  ) then raise exception 'Shipment is incomplete or cannot be published'; end if;

  update public.shipment_requests set status = 'OPEN_FOR_BIDS' where id = p_shipment_id;
  update public.commercial_orders set status = 'PENDING_LOGISTICS'
  where id = (select order_id from public.shipment_requests where id = p_shipment_id);
  return p_shipment_id;
end;
$$;

-- The original stop-based trigger cannot validate label-only drafts introduced by this workflow.
drop trigger if exists trg_validate_shipment_ready_for_bids on public.shipment_requests;

create or replace function public.submit_freight_bid(
  p_shipment_id uuid, p_actor_id uuid, p_vehicle_id uuid, p_fare numeric,
  p_departure_at timestamptz, p_duration_minutes integer, p_conditions text default null,
  p_helper_included boolean default false, p_insurance_included boolean default false
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare v_bid_id uuid; v_currency_id smallint;
begin
  if p_fare <= 0 or p_duration_minutes <= 0 then raise exception 'Fare and duration must be positive'; end if;
  if not public.can_act_as(p_actor_id) then raise exception 'Bid access denied'; end if;
  if not exists (select 1 from public.shipment_requests where id = p_shipment_id and status = 'OPEN_FOR_BIDS') then
    raise exception 'Shipment is not open for bids';
  end if;
  if not exists (
    select 1 from public.vehicles where id = p_vehicle_id and owner_actor_id = p_actor_id
      and status = 'ACTIVE' and is_available
  ) then raise exception 'Vehicle is unavailable'; end if;
  if exists (
    select 1 from public.freight_bids where shipment_request_id = p_shipment_id
      and transporter_actor_id = p_actor_id and status = 'ACTIVE'
  ) then raise exception 'An active bid already exists'; end if;
  select id into v_currency_id from public.currencies where code = 'PEN';
  insert into public.freight_bids (
    shipment_request_id, transporter_actor_id, vehicle_id, fare_amount, currency_id,
    departure_at, estimated_duration_minutes, conditions, helper_included, insurance_included
  ) values (
    p_shipment_id, p_actor_id, p_vehicle_id, p_fare, v_currency_id, p_departure_at,
    p_duration_minutes, nullif(trim(p_conditions), ''), p_helper_included, p_insurance_included
  ) returning id into v_bid_id;
  return v_bid_id;
end;
$$;

create or replace function public.withdraw_freight_bid(p_bid_id uuid, p_actor_id uuid)
returns void language plpgsql security definer set search_path = public as $$
begin
  update public.freight_bids set status = 'WITHDRAWN'
  where id = p_bid_id and status = 'ACTIVE' and transporter_actor_id = p_actor_id
    and public.can_act_as(p_actor_id);
  if not found then raise exception 'Active bid not found'; end if;
end;
$$;

create or replace function public.select_freight_bid(p_bid_id uuid, p_actor_id uuid)
returns uuid language plpgsql security definer set search_path = public as $$
declare v_shipment_id uuid; v_assignment_id uuid; v_trip_id uuid;
begin
  select fb.shipment_request_id into v_shipment_id
  from public.freight_bids fb join public.shipment_requests sr on sr.id = fb.shipment_request_id
  where fb.id = p_bid_id and fb.status = 'ACTIVE' and sr.status = 'OPEN_FOR_BIDS'
    and sr.requested_by_actor_id = p_actor_id and public.can_act_as(p_actor_id)
  for update of fb, sr;
  if v_shipment_id is null then raise exception 'Bid cannot be selected'; end if;
  insert into public.shipment_assignments (shipment_request_id, freight_bid_id, accepted_by_actor_id)
  values (v_shipment_id, p_bid_id, p_actor_id) returning id into v_assignment_id;
  insert into public.trips (shipment_assignment_id) values (v_assignment_id) returning id into v_trip_id;
  insert into public.trip_status_history (trip_id, status, changed_by_actor_id, notes)
  values (v_trip_id, 'SCHEDULED', p_actor_id, 'Transportista seleccionado');
  update public.vehicles set is_available = false where id = (select vehicle_id from public.freight_bids where id = p_bid_id);
  update public.shipment_requests set status = 'SCHEDULED' where id = v_shipment_id;
  return v_trip_id;
end;
$$;

create or replace function public.save_vehicle(
  p_actor_id uuid, p_vehicle_id uuid, p_display_name text, p_plate text,
  p_vehicle_type_code text, p_capacity_kg numeric, p_capacity_m3 numeric,
  p_covered boolean, p_refrigerated boolean, p_four_wheel_drive boolean
)
returns uuid language plpgsql security definer set search_path = public as $$
declare v_id uuid; v_type_id smallint;
begin
  if not public.can_act_as(p_actor_id) then raise exception 'Vehicle access denied'; end if;
  if p_capacity_kg <= 0 or (p_capacity_m3 is not null and p_capacity_m3 <= 0) then
    raise exception 'Vehicle capacity must be positive';
  end if;
  select id into v_type_id from public.vehicle_types where upper(code::text) = upper(p_vehicle_type_code);
  if v_type_id is null then raise exception 'Unsupported vehicle type'; end if;
  if p_vehicle_id is null then
    insert into public.vehicles (owner_actor_id, vehicle_type_id, plate, capacity_kg, capacity_m3,
      covered, refrigerated, four_wheel_drive, display_name)
    values (p_actor_id, v_type_id, upper(nullif(trim(p_plate), '')), p_capacity_kg, p_capacity_m3,
      p_covered, p_refrigerated, p_four_wheel_drive, nullif(trim(p_display_name), '')) returning id into v_id;
  else
    update public.vehicles set vehicle_type_id = v_type_id, plate = upper(nullif(trim(p_plate), '')),
      capacity_kg = p_capacity_kg, capacity_m3 = p_capacity_m3, covered = p_covered,
      refrigerated = p_refrigerated, four_wheel_drive = p_four_wheel_drive,
      display_name = nullif(trim(p_display_name), '')
    where id = p_vehicle_id and owner_actor_id = p_actor_id returning id into v_id;
    if v_id is null then raise exception 'Vehicle not found'; end if;
  end if;
  return v_id;
end;
$$;

create or replace function public.set_vehicle_availability(p_vehicle_id uuid, p_actor_id uuid, p_available boolean)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not public.can_act_as(p_actor_id) then raise exception 'Vehicle access denied'; end if;
  update public.vehicles set is_available = p_available
  where id = p_vehicle_id and owner_actor_id = p_actor_id and status = 'ACTIVE';
  if not found then raise exception 'Vehicle not found'; end if;
end;
$$;

create or replace function public.delete_vehicle(p_vehicle_id uuid, p_actor_id uuid)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not public.can_act_as(p_actor_id) then raise exception 'Vehicle access denied'; end if;
  if exists (select 1 from public.freight_bids where vehicle_id = p_vehicle_id and status in ('ACTIVE', 'ACCEPTED')) then
    raise exception 'Vehicle has an active logistics commitment';
  end if;
  delete from public.vehicles where id = p_vehicle_id and owner_actor_id = p_actor_id;
  if not found then raise exception 'Vehicle not found'; end if;
end;
$$;

create or replace function public.transition_trip(p_trip_id uuid, p_actor_id uuid, p_status public.trip_status, p_notes text default null)
returns void language plpgsql security definer set search_path = public as $$
declare v_current public.trip_status; v_shipment_id uuid; v_vehicle_id uuid;
begin
  if not public.can_act_as(p_actor_id) or not public.can_manage_trip(p_trip_id) then raise exception 'Trip access denied'; end if;
  select t.status, sa.shipment_request_id, fb.vehicle_id into v_current, v_shipment_id, v_vehicle_id
  from public.trips t join public.shipment_assignments sa on sa.id = t.shipment_assignment_id
  join public.freight_bids fb on fb.id = sa.freight_bid_id where t.id = p_trip_id for update of t;
  if not ((v_current = 'SCHEDULED' and p_status in ('PICKED_UP', 'CANCELLED'))
    or (v_current = 'PICKED_UP' and p_status in ('IN_TRANSIT', 'DELAYED', 'CANCELLED'))
    or (v_current = 'IN_TRANSIT' and p_status in ('DELAYED', 'DELIVERED'))
    or (v_current = 'DELAYED' and p_status in ('IN_TRANSIT', 'DELIVERED', 'CANCELLED'))) then
    raise exception 'Invalid trip transition from % to %', v_current, p_status;
  end if;
  update public.trips set status = p_status,
    started_at = case when p_status = 'PICKED_UP' then coalesce(started_at, now()) else started_at end,
    completed_at = case when p_status in ('DELIVERED', 'CANCELLED') then now() else completed_at end
  where id = p_trip_id;
  insert into public.trip_status_history (trip_id, status, changed_by_actor_id, notes)
  values (p_trip_id, p_status, p_actor_id, nullif(trim(p_notes), ''));
  update public.shipment_requests set status = p_status::text::public.shipment_status where id = v_shipment_id;
  if p_status in ('DELIVERED', 'CANCELLED') then update public.vehicles set is_available = true where id = v_vehicle_id; end if;
end;
$$;

create or replace function public.record_trip_operation(
  p_trip_id uuid, p_actor_id uuid, p_record_type text, p_weight_kg numeric,
  p_package_count integer, p_accepted_quantity numeric, p_observed_quantity numeric,
  p_condition_notes text, p_notes text, p_confirmed boolean
)
returns uuid language plpgsql security definer set search_path = public as $$
declare v_id uuid;
begin
  if not public.can_manage_trip(p_trip_id) or not public.can_act_as(p_actor_id) then raise exception 'Trip access denied'; end if;
  if p_record_type not in ('PICKUP', 'DELIVERY') or not p_confirmed then raise exception 'Confirmed operation required'; end if;
  if p_record_type = 'PICKUP' and not exists (select 1 from public.trips where id = p_trip_id and status = 'SCHEDULED') then
    raise exception 'Pickup can only be recorded for a scheduled trip';
  end if;
  if p_record_type = 'DELIVERY' and not exists (select 1 from public.trips where id = p_trip_id and status in ('IN_TRANSIT', 'DELAYED')) then
    raise exception 'Delivery can only be recorded for a trip in transit';
  end if;
  insert into public.trip_operation_records (trip_id, record_type, recorded_weight_kg, package_count,
    accepted_quantity, observed_quantity, condition_notes, notes, confirmed, recorded_by_actor_id)
  values (p_trip_id, p_record_type, p_weight_kg, p_package_count, p_accepted_quantity,
    p_observed_quantity, nullif(trim(p_condition_notes), ''), nullif(trim(p_notes), ''), true, p_actor_id)
  on conflict (trip_id, record_type) do update set recorded_weight_kg = excluded.recorded_weight_kg,
    package_count = excluded.package_count, accepted_quantity = excluded.accepted_quantity,
    observed_quantity = excluded.observed_quantity, condition_notes = excluded.condition_notes,
    notes = excluded.notes, confirmed = true, recorded_by_actor_id = excluded.recorded_by_actor_id,
    recorded_at = now()
  returning id into v_id;
  return v_id;
end;
$$;

create or replace function public.report_trip_incident(
  p_trip_id uuid, p_actor_id uuid, p_incident_type text, p_description text, p_location_label text default null
)
returns uuid language plpgsql security definer set search_path = public as $$
declare v_id uuid;
begin
  if not public.can_manage_trip(p_trip_id) or not public.can_act_as(p_actor_id) then raise exception 'Trip access denied'; end if;
  insert into public.trip_incidents (trip_id, incident_type, description, location_label, reported_by_actor_id)
  values (p_trip_id, p_incident_type, trim(p_description), nullif(trim(p_location_label), ''), p_actor_id)
  returning id into v_id;
  return v_id;
end;
$$;

create or replace function public.add_trip_evidence(
  p_trip_id uuid, p_actor_id uuid, p_evidence_type public.evidence_type, p_storage_path text,
  p_original_filename text, p_content_type text, p_byte_size bigint, p_notes text default null
)
returns uuid language plpgsql security definer set search_path = public as $$
declare v_id uuid;
begin
  if not public.can_manage_trip(p_trip_id) or not public.can_act_as(p_actor_id) then raise exception 'Trip access denied'; end if;
  if p_storage_path not like p_actor_id::text || '/' || p_trip_id::text || '/%' then raise exception 'Invalid evidence path'; end if;
  insert into public.trip_evidence (trip_id, evidence_type, storage_path, original_filename, content_type,
    byte_size, captured_by_actor_id, notes)
  values (p_trip_id, p_evidence_type, p_storage_path, p_original_filename, p_content_type,
    p_byte_size, p_actor_id, nullif(trim(p_notes), '')) returning id into v_id;
  return v_id;
end;
$$;

revoke all on function public.save_shipment_draft(uuid, uuid, public.logistics_mode, text, text, text, numeric, numeric, integer, numeric, timestamptz, boolean, text) from public;
revoke all on function public.publish_shipment(uuid, uuid) from public;
revoke all on function public.submit_freight_bid(uuid, uuid, uuid, numeric, timestamptz, integer, text, boolean, boolean) from public;
revoke all on function public.withdraw_freight_bid(uuid, uuid) from public;
revoke all on function public.select_freight_bid(uuid, uuid) from public;
revoke all on function public.save_vehicle(uuid, uuid, text, text, text, numeric, numeric, boolean, boolean, boolean) from public;
revoke all on function public.set_vehicle_availability(uuid, uuid, boolean) from public;
revoke all on function public.delete_vehicle(uuid, uuid) from public;
revoke all on function public.transition_trip(uuid, uuid, public.trip_status, text) from public;
revoke all on function public.record_trip_operation(uuid, uuid, text, numeric, integer, numeric, numeric, text, text, boolean) from public;
revoke all on function public.report_trip_incident(uuid, uuid, text, text, text) from public;
revoke all on function public.add_trip_evidence(uuid, uuid, public.evidence_type, text, text, text, bigint, text) from public;

grant execute on function public.save_shipment_draft(uuid, uuid, public.logistics_mode, text, text, text, numeric, numeric, integer, numeric, timestamptz, boolean, text) to authenticated;
grant execute on function public.publish_shipment(uuid, uuid) to authenticated;
grant execute on function public.submit_freight_bid(uuid, uuid, uuid, numeric, timestamptz, integer, text, boolean, boolean) to authenticated;
grant execute on function public.withdraw_freight_bid(uuid, uuid) to authenticated;
grant execute on function public.select_freight_bid(uuid, uuid) to authenticated;
grant execute on function public.save_vehicle(uuid, uuid, text, text, text, numeric, numeric, boolean, boolean, boolean) to authenticated;
grant execute on function public.set_vehicle_availability(uuid, uuid, boolean) to authenticated;
grant execute on function public.delete_vehicle(uuid, uuid) to authenticated;
grant execute on function public.transition_trip(uuid, uuid, public.trip_status, text) to authenticated;
grant execute on function public.record_trip_operation(uuid, uuid, text, numeric, integer, numeric, numeric, text, text, boolean) to authenticated;
grant execute on function public.report_trip_incident(uuid, uuid, text, text, text) to authenticated;
grant execute on function public.add_trip_evidence(uuid, uuid, public.evidence_type, text, text, text, bigint, text) to authenticated;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('trip-evidence', 'trip-evidence', false, 10485760, array['image/jpeg', 'image/png', 'image/webp', 'application/pdf'])
on conflict (id) do update set public = false, file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create policy trip_evidence_storage_insert on storage.objects
for insert to authenticated with check (
  bucket_id = 'trip-evidence'
  and case
    when (storage.foldername(name))[1] ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'
      and (storage.foldername(name))[2] ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'
    then public.can_act_as(((storage.foldername(name))[1])::uuid)
      and public.can_manage_trip(((storage.foldername(name))[2])::uuid)
    else false
  end
);

create policy trip_evidence_storage_delete on storage.objects
for delete to authenticated using (
  bucket_id = 'trip-evidence'
  and case
    when (storage.foldername(name))[1] ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'
      and (storage.foldername(name))[2] ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'
    then public.can_act_as(((storage.foldername(name))[1])::uuid)
      and public.can_manage_trip(((storage.foldername(name))[2])::uuid)
    else false
  end
);

create policy trip_evidence_storage_read on storage.objects
for select to authenticated using (
  bucket_id = 'trip-evidence'
  and exists (
    select 1 from public.trip_evidence te
    join public.trips t on t.id = te.trip_id
    join public.shipment_assignments sa on sa.id = t.shipment_assignment_id
    where te.storage_path = name and public.can_access_shipment(sa.shipment_request_id)
  )
);
