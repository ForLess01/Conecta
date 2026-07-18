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
  v_request public.purchase_requests%rowtype;
  v_offer public.product_offers%rowtype;
  v_policy public.offer_negotiation_policies%rowtype;
  v_order_id uuid; v_order_currency_id smallint; v_item_id uuid; v_allocation_id uuid;
  v_expiration timestamptz; v_released numeric;
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
    select * into v_request from public.purchase_requests where listing_id = v_negotiation.request_listing_id for update;

    if v_request.accepts_multiple_suppliers then
      select co.id, co.currency_id into v_order_id, v_order_currency_id
      from public.commercial_orders co
      join public.order_negotiations ono on ono.order_id = co.id
      join public.negotiations existing_negotiation on existing_negotiation.id = ono.negotiation_id
      where existing_negotiation.request_listing_id = v_negotiation.request_listing_id
        and co.buyer_actor_id = v_negotiation.buyer_actor_id
        and co.status = 'PENDING_LOGISTICS'
      order by co.created_at
      limit 1
      for update of co;
      if v_order_id is not null and v_order_currency_id <> v_proposal.currency_id then
        raise exception 'All suppliers in a request order must use the same currency';
      end if;
    end if;

    if v_order_id is null then
      insert into public.commercial_orders (buyer_actor_id, currency_id, status, agreed_delivery_date)
      values (v_negotiation.buyer_actor_id, v_proposal.currency_id, 'PENDING_LOGISTICS', v_proposal.delivery_date)
      returning id into v_order_id;
    end if;
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

revoke all on function public.commerce_respond_to_proposal(uuid, uuid, uuid, boolean) from public;
grant execute on function public.commerce_respond_to_proposal(uuid, uuid, uuid, boolean) to authenticated;
