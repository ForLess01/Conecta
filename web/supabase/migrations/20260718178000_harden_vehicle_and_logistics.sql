create or replace function public.sync_order_from_shipment_mode()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.order_id is null then return new; end if;

  if new.logistics_mode = 'MARKETPLACE_FREIGHT' then
    update public.commercial_orders
    set status = 'PENDING_LOGISTICS'
    where id = new.order_id and status = 'CONFIRMED' and new.status = 'DRAFT';
  else
    update public.commercial_orders
    set status = 'CONFIRMED', reservation_expires_at = null
    where id = new.order_id and status = 'PENDING_LOGISTICS';
  end if;

  return new;
end;
$$;

drop trigger if exists trg_sync_order_from_shipment_mode on public.shipment_requests;
create trigger trg_sync_order_from_shipment_mode
after insert or update of logistics_mode on public.shipment_requests
for each row execute function public.sync_order_from_shipment_mode();

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
declare
  v_bid_id uuid;
  v_currency_id smallint;
  v_shipment public.shipment_requests%rowtype;
  v_vehicle public.vehicles%rowtype;
begin
  if p_fare <= 0 or p_duration_minutes <= 0 then raise exception 'Fare and duration must be positive'; end if;
  if p_departure_at <= now() then raise exception 'Departure must be in the future'; end if;
  if not public.can_act_as(p_actor_id) then raise exception 'Bid access denied'; end if;

  select * into v_shipment from public.shipment_requests
  where id = p_shipment_id and status = 'OPEN_FOR_BIDS' for update;
  if not found then raise exception 'Shipment is not open for bids'; end if;

  select * into v_vehicle from public.vehicles
  where id = p_vehicle_id and owner_actor_id = p_actor_id and status = 'ACTIVE' and is_available
  for update;
  if not found then raise exception 'Vehicle is unavailable'; end if;
  if v_shipment.total_weight_kg is not null and v_vehicle.capacity_kg < v_shipment.total_weight_kg then
    raise exception 'Vehicle capacity is insufficient for this shipment';
  end if;
  if v_shipment.scheduled_pickup_at is not null and p_departure_at > v_shipment.scheduled_pickup_at then
    raise exception 'Departure must be before the scheduled pickup';
  end if;
  if exists (
    select 1 from public.freight_bids
    where shipment_request_id = p_shipment_id and transporter_actor_id = p_actor_id and status = 'ACTIVE'
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

create or replace function public.select_freight_bid(p_bid_id uuid, p_actor_id uuid)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_shipment_id uuid;
  v_vehicle_id uuid;
  v_assignment_id uuid;
  v_trip_id uuid;
begin
  select fb.shipment_request_id, fb.vehicle_id into v_shipment_id, v_vehicle_id
  from public.freight_bids fb
  join public.shipment_requests sr on sr.id = fb.shipment_request_id
  join public.vehicles v on v.id = fb.vehicle_id
  where fb.id = p_bid_id and fb.status = 'ACTIVE' and sr.status = 'OPEN_FOR_BIDS'
    and sr.requested_by_actor_id = p_actor_id and public.can_act_as(p_actor_id)
    and v.status = 'ACTIVE' and v.is_available
  for update of fb, sr, v;
  if v_shipment_id is null then raise exception 'Bid cannot be selected'; end if;

  if exists (
    select 1
    from public.freight_bids vehicle_bid
    join public.shipment_assignments sa on sa.freight_bid_id = vehicle_bid.id
    join public.trips t on t.shipment_assignment_id = sa.id
    where vehicle_bid.vehicle_id = v_vehicle_id and t.status not in ('DELIVERED', 'CANCELLED')
  ) then raise exception 'Vehicle already has an active trip'; end if;

  insert into public.shipment_assignments (shipment_request_id, freight_bid_id, accepted_by_actor_id)
  values (v_shipment_id, p_bid_id, p_actor_id) returning id into v_assignment_id;
  insert into public.trips (shipment_assignment_id) values (v_assignment_id) returning id into v_trip_id;
  insert into public.trip_status_history (trip_id, status, changed_by_actor_id, notes)
  values (v_trip_id, 'SCHEDULED', p_actor_id, 'Transportista seleccionado');

  update public.freight_bids set status = 'WITHDRAWN'
  where vehicle_id = v_vehicle_id and id <> p_bid_id and status = 'ACTIVE';
  update public.vehicles set is_available = false where id = v_vehicle_id;
  update public.shipment_requests set status = 'SCHEDULED' where id = v_shipment_id;
  return v_trip_id;
end;
$$;

create or replace function public.set_vehicle_availability(p_vehicle_id uuid, p_actor_id uuid, p_available boolean)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.can_act_as(p_actor_id) then raise exception 'Vehicle access denied'; end if;
  if p_available and exists (
    select 1
    from public.freight_bids fb
    join public.shipment_assignments sa on sa.freight_bid_id = fb.id
    join public.trips t on t.shipment_assignment_id = sa.id
    where fb.vehicle_id = p_vehicle_id and t.status not in ('DELIVERED', 'CANCELLED')
  ) then raise exception 'Vehicle has an active logistics commitment'; end if;

  update public.vehicles set is_available = p_available
  where id = p_vehicle_id and owner_actor_id = p_actor_id and status = 'ACTIVE';
  if not found then raise exception 'Vehicle not found'; end if;
end;
$$;

create or replace function public.delete_vehicle(p_vehicle_id uuid, p_actor_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.can_act_as(p_actor_id) then raise exception 'Vehicle access denied'; end if;
  if exists (
    select 1
    from public.freight_bids fb
    left join public.shipment_assignments sa on sa.freight_bid_id = fb.id
    left join public.trips t on t.shipment_assignment_id = sa.id
    where fb.vehicle_id = p_vehicle_id
      and (fb.status in ('ACTIVE', 'ACCEPTED') or t.status not in ('DELIVERED', 'CANCELLED'))
  ) then raise exception 'Vehicle has an active logistics commitment'; end if;

  update public.vehicles set status = 'INACTIVE', is_available = false
  where id = p_vehicle_id and owner_actor_id = p_actor_id and status = 'ACTIVE';
  if not found then raise exception 'Vehicle not found'; end if;
end;
$$;

create or replace function public.review_verification_request(p_request_id uuid, p_status text, p_notes text default null)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare v_request public.verification_requests%rowtype;
begin
  if not public.is_admin() then raise exception 'Admin role required'; end if;
  if p_status not in ('NEEDS_INFO', 'APPROVED', 'REJECTED') then raise exception 'Invalid review status'; end if;
  if p_status <> 'APPROVED' and nullif(trim(p_notes), '') is null then raise exception 'Review notes are required'; end if;

  select * into v_request from public.verification_requests
  where id = p_request_id and status in ('PENDING', 'NEEDS_INFO') for update;
  if not found then raise exception 'Verification request is not pending'; end if;
  if p_status = 'APPROVED' and jsonb_array_length(v_request.document_paths) = 0 then
    raise exception 'Verification documents are required for approval';
  end if;

  update public.verification_requests set status = p_status, reviewer_notes = nullif(trim(p_notes), ''),
    reviewed_by = auth.uid(), reviewed_at = now() where id = p_request_id;
  if p_status = 'APPROVED' then
    update public.actors set verification_status_id = v_request.requested_status_id where id = v_request.actor_id;
  end if;
  insert into public.audit_logs (user_id, action, entity_table, entity_id)
  values (auth.uid(), 'VERIFICATION_' || p_status, 'verification_requests', p_request_id::text);
end;
$$;
