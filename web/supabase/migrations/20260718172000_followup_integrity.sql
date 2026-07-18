-- Follow-up hardening from independent security and reliability review.

create or replace function public.is_assigned_trip_actor(target_trip_id uuid, target_actor_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select (
    exists (
      select 1 from public.actors a
      where a.id = target_actor_id and a.user_id = auth.uid()
    )
    or exists (
      select 1
      from public.actors a
      join public.organization_members om on om.organization_id = a.organization_id
      where a.id = target_actor_id
        and om.user_id = auth.uid()
        and om.status = 'ACTIVE'
    )
  ) and exists (
    select 1
    from public.trips t
    join public.shipment_assignments sa on sa.id = t.shipment_assignment_id
    join public.freight_bids fb on fb.id = sa.freight_bid_id
    where t.id = target_trip_id and fb.transporter_actor_id = target_actor_id
  );
$$;

alter function public.account_get_dashboard(uuid) security invoker;

create or replace function public.guard_trip_cancellation()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
  if new.status = 'CANCELLED' and old.status <> 'CANCELLED' and not public.is_admin() then
    raise exception 'Only an administrator can cancel an assigned trip';
  end if;
  return new;
end;
$$;

drop trigger if exists trg_guard_trip_cancellation on public.trips;
create trigger trg_guard_trip_cancellation
before update of status on public.trips
for each row execute function public.guard_trip_cancellation();

create or replace function public.validate_request_allocation()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_request public.purchase_requests%rowtype;
  v_requested_quantity numeric;
  v_already_allocated numeric;
begin
  if new.source_offer_listing_id is not null then return new; end if;

  select pr.*
  into v_request
  from public.order_items oi
  join public.order_negotiations ono on ono.order_id = oi.order_id
  join public.negotiations n on n.id = ono.negotiation_id
  join public.purchase_requests pr on pr.listing_id = n.request_listing_id
  where oi.id = new.order_item_id;

  if not found then return new; end if;
  select ml.quantity into v_requested_quantity
  from public.market_listings ml where ml.id = v_request.listing_id;
  if new.allocated_quantity > v_requested_quantity then raise exception 'Allocation exceeds requested quantity'; end if;
  if not v_request.accepts_partial_offers and new.allocated_quantity <> v_requested_quantity then
    raise exception 'Request does not accept partial proposals';
  end if;

  select coalesce(sum(existing.allocated_quantity), 0)
  into v_already_allocated
  from public.order_supplier_allocations existing
  join public.order_items existing_item on existing_item.id = existing.order_item_id
  join public.order_negotiations existing_link on existing_link.order_id = existing_item.order_id
  join public.negotiations existing_negotiation on existing_negotiation.id = existing_link.negotiation_id
  where existing_negotiation.request_listing_id = v_request.listing_id;

  if not v_request.accepts_multiple_suppliers and v_already_allocated > 0 then
    raise exception 'Request accepts only one supplier';
  end if;
  if v_already_allocated + new.allocated_quantity > v_requested_quantity then
    raise exception 'Accepted proposals exceed requested quantity';
  end if;
  return new;
end;
$$;

drop trigger if exists trg_validate_request_allocation on public.order_supplier_allocations;
create trigger trg_validate_request_allocation
before insert on public.order_supplier_allocations
for each row execute function public.validate_request_allocation();

create or replace function public.close_fulfilled_request()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare v_request_id uuid; v_requested numeric; v_allocated numeric;
begin
  if new.source_offer_listing_id is not null then return new; end if;
  select n.request_listing_id, ml.quantity into v_request_id, v_requested
  from public.order_items oi
  join public.order_negotiations ono on ono.order_id = oi.order_id
  join public.negotiations n on n.id = ono.negotiation_id
  join public.market_listings ml on ml.id = n.request_listing_id
  where oi.id = new.order_item_id;
  if v_request_id is null then return new; end if;
  select coalesce(sum(osa.allocated_quantity), 0) into v_allocated
  from public.order_supplier_allocations osa
  join public.order_items oi on oi.id = osa.order_item_id
  join public.order_negotiations ono on ono.order_id = oi.order_id
  join public.negotiations n on n.id = ono.negotiation_id
  where n.request_listing_id = v_request_id;
  if v_allocated >= v_requested then
    update public.market_listings set status = 'CLOSED' where id = v_request_id;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_close_fulfilled_request on public.order_supplier_allocations;
create trigger trg_close_fulfilled_request
after insert on public.order_supplier_allocations
for each row execute function public.close_fulfilled_request();

create or replace function public.confirm_order_inventory_on_shipment()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare v_order public.commercial_orders%rowtype; v_allocation record;
begin
  select * into v_order from public.commercial_orders where id = new.order_id for update;
  if v_order.status = 'RESERVED' then
    if v_order.reservation_expires_at is not null and v_order.reservation_expires_at <= now() then
      raise exception 'Order reservation has expired';
    end if;
    for v_allocation in
      select ir.id as reservation_id, ir.offer_listing_id, ir.quantity
      from public.inventory_reservations ir
      join public.order_supplier_allocations osa on osa.id = ir.allocation_id
      join public.order_items oi on oi.id = osa.order_item_id
      where oi.order_id = new.order_id and ir.status = 'ACTIVE' for update of ir
    loop
      update public.inventory_reservations set status = 'CONSUMED' where id = v_allocation.reservation_id;
      update public.product_offers set reserved_quantity = greatest(0, reserved_quantity - v_allocation.quantity)
      where listing_id = v_allocation.offer_listing_id;
      update public.market_listings set quantity = greatest(0, quantity - v_allocation.quantity),
        status = case when quantity - v_allocation.quantity <= 0 then 'SOLD_OUT' else status end
      where id = v_allocation.offer_listing_id;
    end loop;
  end if;
  if v_order.status in ('RESERVED', 'PENDING_LOGISTICS') then
    update public.commercial_orders set
      status = case when new.logistics_mode = 'MARKETPLACE_FREIGHT' then 'PENDING_LOGISTICS' else 'CONFIRMED' end,
      reservation_expires_at = null
    where id = new.order_id;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_confirm_order_inventory_on_shipment on public.shipment_requests;
create trigger trg_confirm_order_inventory_on_shipment
before insert or update of logistics_mode on public.shipment_requests
for each row execute function public.confirm_order_inventory_on_shipment();

create or replace function public.review_verification_request(p_request_id uuid, p_status text, p_notes text default null)
returns void language plpgsql security definer set search_path = public as $$
declare v_request public.verification_requests%rowtype;
begin
  if not public.is_admin() then raise exception 'Admin role required'; end if;
  if p_status not in ('NEEDS_INFO', 'APPROVED', 'REJECTED') then raise exception 'Invalid review status'; end if;
  select * into v_request from public.verification_requests
  where id = p_request_id and status in ('PENDING', 'NEEDS_INFO') for update;
  if not found then raise exception 'Verification request is not pending'; end if;
  update public.verification_requests set status = p_status, reviewer_notes = nullif(trim(p_notes), ''),
    reviewed_by = auth.uid(), reviewed_at = now() where id = p_request_id;
  if p_status = 'APPROVED' then
    update public.actors set verification_status_id = v_request.requested_status_id where id = v_request.actor_id;
  end if;
  insert into public.audit_logs (user_id, action, entity_table, entity_id)
  values (auth.uid(), 'VERIFICATION_' || p_status, 'verification_requests', p_request_id::text);
end;
$$;

drop policy if exists trip_evidence_storage_insert on storage.objects;
create policy trip_evidence_storage_insert on storage.objects
for insert to authenticated with check (
  bucket_id = 'trip-evidence'
  and case when (storage.foldername(name))[1] ~* '^[0-9a-f-]{36}$'
    and (storage.foldername(name))[2] ~* '^[0-9a-f-]{36}$'
    then public.is_assigned_trip_actor(((storage.foldername(name))[2])::uuid, ((storage.foldername(name))[1])::uuid)
    else false end
);

drop policy if exists trip_evidence_storage_delete on storage.objects;
create policy trip_evidence_storage_delete on storage.objects
for delete to authenticated using (
  bucket_id = 'trip-evidence'
  and case when (storage.foldername(name))[1] ~* '^[0-9a-f-]{36}$'
    and (storage.foldername(name))[2] ~* '^[0-9a-f-]{36}$'
    then public.is_assigned_trip_actor(((storage.foldername(name))[2])::uuid, ((storage.foldername(name))[1])::uuid)
    else false end
);

create policy trip_evidence_delete_assigned on public.trip_evidence
for delete to authenticated using (
  public.is_assigned_trip_actor(trip_id, captured_by_actor_id)
);

create or replace function public.record_and_transition_trip_operation(
  p_trip_id uuid, p_actor_id uuid, p_record_type text, p_weight_kg numeric,
  p_package_count integer, p_accepted_quantity numeric, p_observed_quantity numeric,
  p_condition_notes text, p_notes text, p_confirmed boolean
)
returns uuid language plpgsql security definer set search_path = public as $$
declare v_id uuid;
begin
  v_id := public.record_trip_operation(p_trip_id, p_actor_id, p_record_type, p_weight_kg,
    p_package_count, p_accepted_quantity, p_observed_quantity, p_condition_notes, p_notes, p_confirmed);
  perform public.transition_trip(p_trip_id, p_actor_id,
    case when p_record_type = 'PICKUP' then 'PICKED_UP'::public.trip_status else 'DELIVERED'::public.trip_status end,
    case when p_record_type = 'PICKUP' then 'Recojo confirmado' else 'Entrega confirmada' end);
  return v_id;
end;
$$;

revoke all on function public.record_and_transition_trip_operation(uuid, uuid, text, numeric, integer, numeric, numeric, text, text, boolean) from public;
grant execute on function public.record_and_transition_trip_operation(uuid, uuid, text, numeric, integer, numeric, numeric, text, text, boolean) to authenticated;
