-- Close authorization gaps and synchronize commerce/logistics state transitions.

drop policy if exists user_profiles_select on public.user_profiles;
create policy user_profiles_select_self
on public.user_profiles for select to authenticated
using (id = auth.uid() or public.is_admin());

revoke update on public.actors from authenticated;
grant update (display_name, is_active) on public.actors to authenticated;

drop policy if exists shipments_insert on public.shipment_requests;
create policy shipments_insert_draft
on public.shipment_requests for insert to authenticated
with check (
  status = 'DRAFT'
  and public.can_act_as(requested_by_actor_id)
  and exists (
    select 1 from public.commercial_orders co
    where co.id = order_id
      and co.buyer_actor_id = requested_by_actor_id
  )
);

drop policy if exists shipments_select_participant on public.shipment_requests;
create policy shipments_select_participant
on public.shipment_requests for select to authenticated
using (
  public.can_act_as(requested_by_actor_id)
  or exists (
    select 1 from public.commercial_orders co
    where co.id = shipment_requests.order_id
      and public.can_act_as(co.buyer_actor_id)
  )
  or (
    status = 'OPEN_FOR_BIDS'
    and exists (
      select 1
      from public.user_roles ur
      join public.app_roles r on r.id = ur.role_id
      where ur.user_id = auth.uid()
        and upper(r.code::text) = 'TRANSPORTER'
    )
  )
  or public.is_admin()
);

create or replace function public.is_assigned_trip_actor(target_trip_id uuid, target_actor_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.can_act_as(target_actor_id) and exists (
    select 1
    from public.trips t
    join public.shipment_assignments sa on sa.id = t.shipment_assignment_id
    join public.freight_bids fb on fb.id = sa.freight_bid_id
    where t.id = target_trip_id
      and fb.transporter_actor_id = target_actor_id
  );
$$;

revoke all on function public.is_assigned_trip_actor(uuid, uuid) from public;
grant execute on function public.is_assigned_trip_actor(uuid, uuid) to authenticated;

create or replace function public.confirm_order_inventory_on_shipment()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order public.commercial_orders%rowtype;
  v_allocation record;
begin
  select * into v_order
  from public.commercial_orders
  where id = new.order_id
  for update;

  if v_order.status = 'RESERVED' then
    if v_order.reservation_expires_at is not null and v_order.reservation_expires_at <= now() then
      raise exception 'Order reservation has expired';
    end if;

    for v_allocation in
      select ir.id as reservation_id, ir.offer_listing_id, ir.quantity
      from public.inventory_reservations ir
      join public.order_supplier_allocations osa on osa.id = ir.allocation_id
      join public.order_items oi on oi.id = osa.order_item_id
      where oi.order_id = new.order_id and ir.status = 'ACTIVE'
      for update of ir
    loop
      update public.inventory_reservations
      set status = 'CONSUMED'
      where id = v_allocation.reservation_id;

      update public.product_offers
      set reserved_quantity = greatest(0, reserved_quantity - v_allocation.quantity)
      where listing_id = v_allocation.offer_listing_id;

      update public.market_listings
      set quantity = greatest(0, quantity - v_allocation.quantity),
          status = case when quantity - v_allocation.quantity <= 0 then 'SOLD_OUT' else status end
      where id = v_allocation.offer_listing_id;
    end loop;

    update public.commercial_orders
    set status = case
      when new.logistics_mode = 'MARKETPLACE_FREIGHT' then 'PENDING_LOGISTICS'
      else 'CONFIRMED'
    end,
    reservation_expires_at = null
    where id = new.order_id;
  end if;

  return new;
end;
$$;

drop trigger if exists trg_confirm_order_inventory_on_shipment on public.shipment_requests;
create trigger trg_confirm_order_inventory_on_shipment
before insert on public.shipment_requests
for each row execute function public.confirm_order_inventory_on_shipment();

create or replace function public.sync_order_from_trip()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order_id uuid;
begin
  if new.status is not distinct from old.status then return new; end if;
  select sr.order_id into v_order_id
  from public.shipment_assignments sa
  join public.shipment_requests sr on sr.id = sa.shipment_request_id
  where sa.id = new.shipment_assignment_id;

  update public.commercial_orders
  set status = case new.status
    when 'PICKED_UP' then 'IN_TRANSIT'::public.order_status
    when 'IN_TRANSIT' then 'IN_TRANSIT'::public.order_status
    when 'DELAYED' then 'IN_TRANSIT'::public.order_status
    when 'DELIVERED' then 'DELIVERED'::public.order_status
    when 'CANCELLED' then 'CANCELLED'::public.order_status
    else status
  end
  where id = v_order_id;
  return new;
end;
$$;

drop trigger if exists trg_sync_order_from_trip on public.trips;
create trigger trg_sync_order_from_trip
after update of status on public.trips
for each row execute function public.sync_order_from_trip();

create or replace function public.transition_trip(p_trip_id uuid, p_actor_id uuid, p_status public.trip_status, p_notes text default null)
returns void language plpgsql security definer set search_path = public as $$
declare v_current public.trip_status; v_shipment_id uuid; v_vehicle_id uuid;
begin
  if not public.is_assigned_trip_actor(p_trip_id, p_actor_id) then raise exception 'Trip access denied'; end if;
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
  if not public.is_assigned_trip_actor(p_trip_id, p_actor_id) then raise exception 'Trip access denied'; end if;
  if p_record_type not in ('PICKUP', 'DELIVERY') or not p_confirmed then raise exception 'Confirmed operation required'; end if;
  if p_record_type = 'PICKUP' and not exists (select 1 from public.trips where id = p_trip_id and status = 'SCHEDULED') then raise exception 'Pickup can only be recorded for a scheduled trip'; end if;
  if p_record_type = 'DELIVERY' and not exists (select 1 from public.trips where id = p_trip_id and status in ('IN_TRANSIT', 'DELAYED')) then raise exception 'Delivery can only be recorded for a trip in transit'; end if;
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
  if not public.is_assigned_trip_actor(p_trip_id, p_actor_id) then raise exception 'Trip access denied'; end if;
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
  if not public.is_assigned_trip_actor(p_trip_id, p_actor_id) then raise exception 'Trip access denied'; end if;
  if p_storage_path not like p_actor_id::text || '/' || p_trip_id::text || '/%' then raise exception 'Invalid evidence path'; end if;
  insert into public.trip_evidence (trip_id, evidence_type, storage_path, original_filename, content_type,
    byte_size, captured_by_actor_id, notes)
  values (p_trip_id, p_evidence_type, p_storage_path, p_original_filename, p_content_type,
    p_byte_size, p_actor_id, nullif(trim(p_notes), '')) returning id into v_id;
  return v_id;
end;
$$;

create or replace function public.commerce_respond_to_proposal(
  p_negotiation_id uuid,
  p_proposal_id uuid,
  p_actor_id uuid,
  p_accept boolean
)
returns table (proposal_status public.proposal_status, order_id uuid, reservation_expires_at timestamptz)
language plpgsql security definer set search_path = public as $$
declare
  v_proposal public.commercial_proposals%rowtype;
  v_negotiation public.negotiations%rowtype;
  v_listing public.market_listings%rowtype;
  v_offer public.product_offers%rowtype;
  v_policy public.offer_negotiation_policies%rowtype;
  v_order_id uuid; v_item_id uuid; v_allocation_id uuid; v_expiration timestamptz; v_released numeric;
begin
  if auth.uid() is null or not public.can_act_as(p_actor_id) then raise exception 'Actor not accessible by current user'; end if;
  select * into v_proposal from public.commercial_proposals where id = p_proposal_id for update;
  if not found or v_proposal.negotiation_id <> p_negotiation_id or v_proposal.status <> 'ACTIVE'
    or (v_proposal.expires_at is not null and v_proposal.expires_at <= now()) then raise exception 'Proposal is no longer active'; end if;
  select * into v_negotiation from public.negotiations where id = v_proposal.negotiation_id for update;
  if p_actor_id not in (v_negotiation.buyer_actor_id, v_negotiation.producer_actor_id)
    or p_actor_id = v_proposal.created_by_actor_id then raise exception 'Only the counterpart can respond to this proposal'; end if;
  if not p_accept then
    update public.commercial_proposals set status = 'REJECTED' where id = p_proposal_id;
    update public.negotiations set status = 'OPEN' where id = v_negotiation.id;
    return query select 'REJECTED'::public.proposal_status, null::uuid, null::timestamptz; return;
  end if;

  select * into v_listing from public.market_listings
  where id = coalesce(v_negotiation.offer_listing_id, v_negotiation.request_listing_id) for update;

  if v_negotiation.request_listing_id is not null then
    if v_listing.actor_id <> v_negotiation.buyer_actor_id then raise exception 'Request buyer mismatch'; end if;
    insert into public.commercial_orders (buyer_actor_id, currency_id, status, agreed_delivery_date)
    values (v_negotiation.buyer_actor_id, v_proposal.currency_id, 'PENDING_LOGISTICS', v_proposal.delivery_date)
    returning id into v_order_id;
    insert into public.order_negotiations (order_id, negotiation_id) values (v_order_id, v_negotiation.id);
    insert into public.order_items (order_id, product_id, variety_id, quantity, unit_id, agreed_unit_price)
    values (v_order_id, v_listing.product_id, v_listing.variety_id, v_proposal.quantity, v_proposal.unit_id, v_proposal.unit_price)
    returning id into v_item_id;
    insert into public.order_supplier_allocations (order_item_id, producer_actor_id, allocated_quantity, unit_price)
    values (v_item_id, v_negotiation.producer_actor_id, v_proposal.quantity, v_proposal.unit_price);
  else
    select * into v_offer from public.product_offers where listing_id = v_negotiation.offer_listing_id for update;
    select * into v_policy from public.offer_negotiation_policies where offer_listing_id = v_negotiation.offer_listing_id;
    with expired as (
      update public.inventory_reservations set status = 'EXPIRED'
      where offer_listing_id = v_negotiation.offer_listing_id and status = 'ACTIVE' and expires_at <= now()
      returning quantity
    ) select coalesce(sum(quantity), 0) into v_released from expired;
    if v_released > 0 then
      update public.product_offers set reserved_quantity = greatest(0, reserved_quantity - v_released)
      where listing_id = v_negotiation.offer_listing_id returning * into v_offer;
    end if;
    if v_listing.status <> 'ACTIVE' or v_listing.actor_id <> v_negotiation.producer_actor_id
      or v_proposal.quantity > v_listing.quantity - v_offer.reserved_quantity
      or (v_offer.minimum_order_quantity is not null and v_proposal.quantity < v_offer.minimum_order_quantity) then
      raise exception 'Requested inventory is not available';
    end if;
    v_expiration := now() + make_interval(mins => coalesce(v_policy.reservation_minutes, 15));
    insert into public.commercial_orders (buyer_actor_id, currency_id, status, agreed_delivery_date, reservation_expires_at)
    values (v_negotiation.buyer_actor_id, v_proposal.currency_id, 'RESERVED', v_proposal.delivery_date, v_expiration)
    returning id into v_order_id;
    insert into public.order_negotiations (order_id, negotiation_id) values (v_order_id, v_negotiation.id);
    insert into public.order_items (order_id, product_id, variety_id, quantity, unit_id, agreed_unit_price)
    values (v_order_id, v_listing.product_id, v_listing.variety_id, v_proposal.quantity, v_proposal.unit_id, v_proposal.unit_price)
    returning id into v_item_id;
    insert into public.order_supplier_allocations (order_item_id, producer_actor_id, source_offer_listing_id, allocated_quantity, unit_price)
    values (v_item_id, v_negotiation.producer_actor_id, v_negotiation.offer_listing_id, v_proposal.quantity, v_proposal.unit_price)
    returning id into v_allocation_id;
    insert into public.inventory_reservations (allocation_id, offer_listing_id, quantity, status, expires_at)
    values (v_allocation_id, v_negotiation.offer_listing_id, v_proposal.quantity, 'ACTIVE', v_expiration);
    update public.product_offers set reserved_quantity = reserved_quantity + v_proposal.quantity
    where listing_id = v_negotiation.offer_listing_id;
  end if;

  update public.commercial_proposals set status = 'ACCEPTED' where id = p_proposal_id;
  update public.commercial_proposals set status = 'REJECTED'
  where negotiation_id = v_negotiation.id and id <> p_proposal_id and status = 'ACTIVE';
  update public.negotiations set status = 'ACCEPTED' where id = v_negotiation.id;
  return query select 'ACCEPTED'::public.proposal_status, v_order_id, v_expiration;
end;
$$;

create or replace function public.create_risk_event_with_evidence(
  p_event_type_code text, p_title text, p_summary text, p_road_name text,
  p_latitude numeric, p_longitude numeric, p_affected_radius_km numeric,
  p_severity smallint, p_source_confidence numeric, p_status public.risk_event_status,
  p_starts_at timestamptz, p_ends_at timestamptz, p_source_url text
)
returns uuid language plpgsql security invoker set search_path = public as $$
declare v_event_type_id smallint; v_source_id smallint; v_event_id uuid;
begin
  if not public.is_admin() then raise exception 'Admin role required'; end if;
  select id into v_event_type_id from public.risk_event_types where upper(code::text) = upper(p_event_type_code);
  if v_event_type_id is null then raise exception 'Unknown risk event type'; end if;
  insert into public.risk_events (event_type_id, title, summary, road_name, latitude, longitude,
    affected_radius_km, severity, source_confidence, status, starts_at, ends_at)
  values (v_event_type_id, p_title, p_summary, p_road_name, p_latitude, p_longitude,
    p_affected_radius_km, p_severity, p_source_confidence, p_status, p_starts_at, p_ends_at)
  returning id into v_event_id;
  if p_source_url is not null then
    select id into v_source_id from public.risk_sources where upper(code::text) = 'MANUAL_DEMO';
    insert into public.risk_event_evidence (risk_event_id, source_id, headline, source_url, evidence_confidence)
    values (v_event_id, v_source_id, p_title, p_source_url, p_source_confidence);
  end if;
  insert into public.audit_logs (user_id, action, entity_table, entity_id)
  values (auth.uid(), 'RISK_EVENT_CREATED', 'risk_events', v_event_id::text);
  return v_event_id;
end;
$$;

revoke all on function public.create_risk_event_with_evidence(text, text, text, text, numeric, numeric, numeric, smallint, numeric, public.risk_event_status, timestamptz, timestamptz, text) from public;
grant execute on function public.create_risk_event_with_evidence(text, text, text, text, numeric, numeric, numeric, smallint, numeric, public.risk_event_status, timestamptz, timestamptz, text) to authenticated;

create or replace function public.account_submit_verification(p_actor_id uuid, p_notes text default null)
returns uuid language plpgsql security definer set search_path = public as $$
declare v_request_id uuid; v_status_id smallint;
begin
  if auth.uid() is null or not public.can_act_as(p_actor_id) then raise exception 'Actor not accessible'; end if;
  if exists (
    select 1
    from public.actor_roles ar
    join public.app_roles r on r.id = ar.role_id
    where ar.actor_id = p_actor_id
      and upper(r.code::text) in ('PRODUCER', 'BUYER', 'TRANSPORTER')
      and not exists (
        select 1 from public.actor_onboarding_details aod
        where aod.actor_id = ar.actor_id
          and aod.role_code = case upper(r.code::text)
            when 'PRODUCER' then 'productor'
            when 'BUYER' then 'comprador'
            when 'TRANSPORTER' then 'transportista'
          end
      )
  ) then raise exception 'Complete every operational profile before requesting verification'; end if;
  select id into v_request_id from public.verification_requests
  where actor_id = p_actor_id and status in ('PENDING', 'NEEDS_INFO') order by created_at desc limit 1;
  if v_request_id is not null then return v_request_id; end if;
  select id into v_status_id from public.verification_statuses where upper(code::text) = 'IDENTITY_VERIFIED';
  insert into public.verification_requests(actor_id, requested_status_id, applicant_notes)
  values (p_actor_id, v_status_id, nullif(trim(p_notes), '')) returning id into v_request_id;
  return v_request_id;
end;
$$;
