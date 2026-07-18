-- Transactional negotiation and order workflows. Private offer pricing is never
-- selected by read RPCs and remains confined to submit_quick_offer.

create or replace function public.commerce_submit_quick_offer(
  p_offer_listing_id uuid,
  p_buyer_actor_id uuid,
  p_quantity numeric,
  p_unit_price numeric,
  p_currency_code char(3)
)
returns table (
  result public.quick_offer_status,
  order_id uuid,
  negotiation_id uuid,
  attempts_remaining integer,
  reservation_expires_at timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null or not public.can_act_as(p_buyer_actor_id) then
    raise exception 'Actor not accessible by current user';
  end if;
  if not exists (
    select 1 from public.actor_roles ar
    join public.app_roles r on r.id = ar.role_id
    where ar.actor_id = p_buyer_actor_id and upper(r.code::text) = 'BUYER'
  ) then
    raise exception 'A buyer actor is required';
  end if;

  return query
  select * from public.submit_quick_offer(
    p_offer_listing_id,
    p_buyer_actor_id,
    p_quantity,
    p_unit_price,
    p_currency_code
  );
end;
$$;

create or replace function public.commerce_create_conversation(
  p_listing_id uuid,
  p_actor_id uuid
)
returns table (negotiation_id uuid, expires_at timestamptz, reused boolean)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_listing public.market_listings%rowtype;
  v_buyer_id uuid;
  v_producer_id uuid;
  v_expiration timestamptz;
  v_negotiation_id uuid;
begin
  if auth.uid() is null or not public.can_act_as(p_actor_id) then
    raise exception 'Actor not accessible by current user';
  end if;

  select * into v_listing
  from public.market_listings
  where id = p_listing_id
  for update;

  if not found or v_listing.status <> 'ACTIVE' then
    raise exception 'Listing is not available';
  end if;
  if v_listing.actor_id = p_actor_id then
    raise exception 'Cannot negotiate with your own listing';
  end if;

  if v_listing.listing_type = 'OFFER' then
    if not exists (
      select 1 from public.actor_roles ar
      join public.app_roles r on r.id = ar.role_id
      where ar.actor_id = p_actor_id and upper(r.code::text) = 'BUYER'
    ) then
      raise exception 'A buyer actor is required';
    end if;
    v_buyer_id := p_actor_id;
    v_producer_id := v_listing.actor_id;
    select now() + make_interval(hours => onp.conversational_window_hours)
    into v_expiration
    from public.offer_negotiation_policies onp
    where onp.offer_listing_id = p_listing_id;
  else
    if not exists (
      select 1 from public.actor_roles ar
      join public.app_roles r on r.id = ar.role_id
      where ar.actor_id = p_actor_id and upper(r.code::text) = 'PRODUCER'
    ) then
      raise exception 'A producer actor is required';
    end if;
    v_buyer_id := v_listing.actor_id;
    v_producer_id := p_actor_id;
  end if;
  v_expiration := coalesce(v_expiration, now() + interval '24 hours');

  select n.id, n.expires_at
  into v_negotiation_id, v_expiration
  from public.negotiations n
  where n.buyer_actor_id = v_buyer_id
    and n.producer_actor_id = v_producer_id
    and n.mode = 'CONVERSATIONAL'
    and n.status in ('OPEN', 'OFFER_SUBMITTED', 'COUNTERED')
    and (n.expires_at is null or n.expires_at > now())
    and (
      (v_listing.listing_type = 'OFFER' and n.offer_listing_id = p_listing_id)
      or (v_listing.listing_type = 'REQUEST' and n.request_listing_id = p_listing_id)
    )
  order by n.created_at desc
  limit 1;

  if v_negotiation_id is not null then
    return query select v_negotiation_id, v_expiration, true;
    return;
  end if;

  insert into public.negotiations (
    buyer_actor_id, producer_actor_id, offer_listing_id, request_listing_id,
    mode, status, expires_at
  ) values (
    v_buyer_id, v_producer_id,
    case when v_listing.listing_type = 'OFFER' then p_listing_id end,
    case when v_listing.listing_type = 'REQUEST' then p_listing_id end,
    'CONVERSATIONAL', 'OPEN', v_expiration
  ) returning id into v_negotiation_id;

  insert into public.negotiation_participants (negotiation_id, actor_id)
  values (v_negotiation_id, v_buyer_id), (v_negotiation_id, v_producer_id);

  return query select v_negotiation_id, v_expiration, false;
end;
$$;

create or replace function public.commerce_send_message(
  p_negotiation_id uuid,
  p_actor_id uuid,
  p_body text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_negotiation public.negotiations%rowtype;
  v_message public.messages%rowtype;
begin
  if auth.uid() is null or not public.can_act_as(p_actor_id) then
    raise exception 'Actor not accessible by current user';
  end if;
  if nullif(trim(p_body), '') is null or length(trim(p_body)) > 4000 then
    raise exception 'Message body is invalid';
  end if;

  select * into v_negotiation from public.negotiations
  where id = p_negotiation_id for update;
  if not found or p_actor_id not in (v_negotiation.buyer_actor_id, v_negotiation.producer_actor_id) then
    raise exception 'Negotiation not accessible';
  end if;
  if v_negotiation.status not in ('OPEN', 'OFFER_SUBMITTED', 'COUNTERED')
     or (v_negotiation.expires_at is not null and v_negotiation.expires_at <= now()) then
    raise exception 'Negotiation is closed';
  end if;

  insert into public.messages (negotiation_id, sender_actor_id, message_type, body)
  values (p_negotiation_id, p_actor_id, 'TEXT', trim(p_body))
  returning * into v_message;

  return jsonb_build_object(
    'id', v_message.id,
    'sender_actor_id', v_message.sender_actor_id,
    'body', v_message.body,
    'created_at', v_message.created_at
  );
end;
$$;

create or replace function public.commerce_create_proposal(
  p_negotiation_id uuid,
  p_actor_id uuid,
  p_quantity numeric,
  p_unit_price numeric,
  p_currency_code char(3),
  p_delivery_date date default null,
  p_logistics_mode public.logistics_mode default null,
  p_expires_at timestamptz default null,
  p_supersedes_proposal_id uuid default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_negotiation public.negotiations%rowtype;
  v_listing public.market_listings%rowtype;
  v_currency_id smallint;
  v_expiration timestamptz;
  v_proposal public.commercial_proposals%rowtype;
begin
  if auth.uid() is null or not public.can_act_as(p_actor_id) then
    raise exception 'Actor not accessible by current user';
  end if;
  if p_quantity <= 0 or p_unit_price <= 0 then
    raise exception 'Quantity and unit price must be positive';
  end if;

  select * into v_negotiation from public.negotiations
  where id = p_negotiation_id for update;
  if not found or p_actor_id not in (v_negotiation.buyer_actor_id, v_negotiation.producer_actor_id) then
    raise exception 'Negotiation not accessible';
  end if;
  if v_negotiation.status not in ('OPEN', 'OFFER_SUBMITTED', 'COUNTERED')
     or (v_negotiation.expires_at is not null and v_negotiation.expires_at <= now()) then
    raise exception 'Negotiation is closed';
  end if;

  select * into v_listing from public.market_listings
  where id = coalesce(v_negotiation.offer_listing_id, v_negotiation.request_listing_id);
  if not found then raise exception 'Negotiation listing was not found'; end if;
  select id into v_currency_id from public.currencies where upper(code::text) = upper(p_currency_code::text);
  if v_currency_id is null then raise exception 'Unsupported currency'; end if;
  if v_negotiation.offer_listing_id is not null and not exists (
    select 1 from public.offer_negotiation_policies onp
    where onp.offer_listing_id = v_negotiation.offer_listing_id
      and onp.currency_id = v_currency_id
  ) then
    raise exception 'Currency not supported by this offer';
  end if;

  v_expiration := least(
    coalesce(p_expires_at, now() + interval '24 hours'),
    coalesce(v_negotiation.expires_at, 'infinity'::timestamptz)
  );
  if v_expiration <= now() then raise exception 'Proposal expiration must be in the future'; end if;

  if p_supersedes_proposal_id is not null then
    update public.commercial_proposals
    set status = 'SUPERSEDED'
    where id = p_supersedes_proposal_id
      and negotiation_id = p_negotiation_id
      and status = 'ACTIVE';
    if not found then raise exception 'Proposal cannot be countered'; end if;
  end if;

  update public.commercial_proposals
  set status = 'SUPERSEDED'
  where negotiation_id = p_negotiation_id and status = 'ACTIVE';

  insert into public.commercial_proposals (
    negotiation_id, created_by_actor_id, supersedes_proposal_id, quantity,
    unit_id, unit_price, currency_id, delivery_date, logistics_mode, expires_at
  ) values (
    p_negotiation_id, p_actor_id, p_supersedes_proposal_id, p_quantity,
    v_listing.unit_id, p_unit_price, v_currency_id, p_delivery_date,
    p_logistics_mode, v_expiration
  ) returning * into v_proposal;

  update public.negotiations
  set status = case when p_supersedes_proposal_id is null then 'OFFER_SUBMITTED' else 'COUNTERED' end
  where id = p_negotiation_id;

  insert into public.messages (negotiation_id, sender_actor_id, message_type, body)
  values (p_negotiation_id, p_actor_id, 'PROPOSAL_REFERENCE', 'Commercial proposal submitted');

  return jsonb_build_object('id', v_proposal.id, 'status', v_proposal.status, 'expires_at', v_proposal.expires_at);
end;
$$;

create or replace function public.commerce_respond_to_proposal(
  p_negotiation_id uuid,
  p_proposal_id uuid,
  p_actor_id uuid,
  p_accept boolean
)
returns table (
  proposal_status public.proposal_status,
  order_id uuid,
  reservation_expires_at timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_proposal public.commercial_proposals%rowtype;
  v_negotiation public.negotiations%rowtype;
  v_listing public.market_listings%rowtype;
  v_offer public.product_offers%rowtype;
  v_policy public.offer_negotiation_policies%rowtype;
  v_order_id uuid;
  v_item_id uuid;
  v_allocation_id uuid;
  v_expiration timestamptz;
  v_released numeric;
begin
  if auth.uid() is null or not public.can_act_as(p_actor_id) then
    raise exception 'Actor not accessible by current user';
  end if;

  select * into v_proposal from public.commercial_proposals
  where id = p_proposal_id for update;
  if not found or v_proposal.negotiation_id <> p_negotiation_id
     or v_proposal.status <> 'ACTIVE'
     or (v_proposal.expires_at is not null and v_proposal.expires_at <= now()) then
    raise exception 'Proposal is no longer active';
  end if;

  select * into v_negotiation from public.negotiations
  where id = v_proposal.negotiation_id for update;
  if p_actor_id not in (v_negotiation.buyer_actor_id, v_negotiation.producer_actor_id)
     or p_actor_id = v_proposal.created_by_actor_id then
    raise exception 'Only the counterpart can respond to this proposal';
  end if;

  if not p_accept then
    update public.commercial_proposals set status = 'REJECTED' where id = p_proposal_id;
    update public.negotiations set status = 'OPEN' where id = v_negotiation.id;
    return query select 'REJECTED'::public.proposal_status, null::uuid, null::timestamptz;
    return;
  end if;

  if v_negotiation.offer_listing_id is null then
    raise exception 'Inventory-backed orders require an offer listing';
  end if;

  select * into v_listing from public.market_listings
  where id = v_negotiation.offer_listing_id for update;
  select * into v_offer from public.product_offers
  where listing_id = v_negotiation.offer_listing_id for update;
  select * into v_policy from public.offer_negotiation_policies
  where offer_listing_id = v_negotiation.offer_listing_id;

  with expired as (
    update public.inventory_reservations
    set status = 'EXPIRED'
    where offer_listing_id = v_negotiation.offer_listing_id
      and status = 'ACTIVE'
      and expires_at <= now()
    returning quantity
  ) select coalesce(sum(quantity), 0) into v_released from expired;
  if v_released > 0 then
    update public.product_offers
    set reserved_quantity = greatest(0, reserved_quantity - v_released)
    where listing_id = v_negotiation.offer_listing_id
    returning * into v_offer;
  end if;

  if v_listing.status <> 'ACTIVE'
     or v_listing.actor_id <> v_negotiation.producer_actor_id
     or v_proposal.quantity > v_listing.quantity - v_offer.reserved_quantity
     or (v_offer.minimum_order_quantity is not null and v_proposal.quantity < v_offer.minimum_order_quantity) then
    raise exception 'Requested inventory is not available';
  end if;

  v_expiration := now() + make_interval(mins => coalesce(v_policy.reservation_minutes, 15));

  insert into public.commercial_orders (
    buyer_actor_id, currency_id, status, agreed_delivery_date, reservation_expires_at
  ) values (
    v_negotiation.buyer_actor_id, v_proposal.currency_id, 'RESERVED',
    v_proposal.delivery_date, v_expiration
  ) returning id into v_order_id;

  insert into public.order_negotiations (order_id, negotiation_id)
  values (v_order_id, v_negotiation.id);

  insert into public.order_items (
    order_id, product_id, variety_id, quantity, unit_id, agreed_unit_price
  ) values (
    v_order_id, v_listing.product_id, v_listing.variety_id,
    v_proposal.quantity, v_proposal.unit_id, v_proposal.unit_price
  ) returning id into v_item_id;

  insert into public.order_supplier_allocations (
    order_item_id, producer_actor_id, source_offer_listing_id, allocated_quantity, unit_price
  ) values (
    v_item_id, v_negotiation.producer_actor_id, v_negotiation.offer_listing_id,
    v_proposal.quantity, v_proposal.unit_price
  ) returning id into v_allocation_id;

  insert into public.inventory_reservations (allocation_id, offer_listing_id, quantity, status, expires_at)
  values (v_allocation_id, v_negotiation.offer_listing_id, v_proposal.quantity, 'ACTIVE', v_expiration);

  update public.product_offers
  set reserved_quantity = reserved_quantity + v_proposal.quantity
  where listing_id = v_negotiation.offer_listing_id;
  update public.commercial_proposals set status = 'ACCEPTED' where id = p_proposal_id;
  update public.commercial_proposals set status = 'REJECTED'
  where negotiation_id = v_negotiation.id and id <> p_proposal_id and status = 'ACTIVE';
  update public.negotiations set status = 'ACCEPTED' where id = v_negotiation.id;

  return query select 'ACCEPTED'::public.proposal_status, v_order_id, v_expiration;
end;
$$;

create or replace function public.commerce_list_negotiations(p_actor_id uuid)
returns jsonb
language plpgsql stable security definer set search_path = public
as $$
begin
  if auth.uid() is null or not public.can_act_as(p_actor_id) then raise exception 'Actor not accessible'; end if;
  return coalesce((
    select jsonb_agg(jsonb_build_object(
      'id', n.id, 'mode', n.mode, 'status', n.status,
      'productName', p.name, 'varietyName', pv.name,
      'counterpartName', case when p_actor_id = n.buyer_actor_id then producer.display_name else buyer.display_name end,
      'expiresAt', n.expires_at, 'updatedAt', n.updated_at,
      'lastMessage', (select m.body from public.messages m where m.negotiation_id = n.id order by m.created_at desc limit 1),
      'hasActiveProposal', exists(select 1 from public.commercial_proposals cp where cp.negotiation_id = n.id and cp.status = 'ACTIVE'),
      'orderId', (select ono.order_id from public.order_negotiations ono where ono.negotiation_id = n.id)
    ) order by n.updated_at desc)
    from public.negotiations n
    join public.actors buyer on buyer.id = n.buyer_actor_id
    join public.actors producer on producer.id = n.producer_actor_id
    join public.market_listings ml on ml.id = coalesce(n.offer_listing_id, n.request_listing_id)
    join public.products p on p.id = ml.product_id
    left join public.product_varieties pv on pv.id = ml.variety_id
    where p_actor_id in (n.buyer_actor_id, n.producer_actor_id)
  ), '[]'::jsonb);
end;
$$;

create or replace function public.commerce_get_negotiation(p_negotiation_id uuid, p_actor_id uuid)
returns jsonb
language plpgsql stable security definer set search_path = public
as $$
declare v_result jsonb;
begin
  if auth.uid() is null or not public.can_act_as(p_actor_id) then raise exception 'Actor not accessible'; end if;
  select jsonb_build_object(
    'id', n.id, 'actorId', p_actor_id, 'buyerActorId', n.buyer_actor_id,
    'producerActorId', n.producer_actor_id, 'listingId', ml.id,
    'mode', n.mode, 'status', n.status, 'productName', p.name,
    'varietyName', pv.name, 'unit', u.symbol,
    'counterpartName', case when p_actor_id = n.buyer_actor_id then producer.display_name else buyer.display_name end,
    'expiresAt', n.expires_at, 'updatedAt', n.updated_at,
    'lastMessage', (select m.body from public.messages m where m.negotiation_id = n.id order by m.created_at desc limit 1),
    'hasActiveProposal', exists(select 1 from public.commercial_proposals cp where cp.negotiation_id = n.id and cp.status = 'ACTIVE'),
    'orderId', (select ono.order_id from public.order_negotiations ono where ono.negotiation_id = n.id),
    'messages', coalesce((select jsonb_agg(jsonb_build_object(
      'id', m.id, 'senderActorId', m.sender_actor_id, 'type', m.message_type,
      'body', m.body, 'createdAt', m.created_at
    ) order by m.created_at) from public.messages m where m.negotiation_id = n.id), '[]'::jsonb),
    'proposals', coalesce((select jsonb_agg(jsonb_build_object(
      'id', cp.id, 'createdByActorId', cp.created_by_actor_id,
      'supersedesProposalId', cp.supersedes_proposal_id, 'quantity', cp.quantity,
      'unit', pu.symbol, 'unitPrice', cp.unit_price, 'currencyCode', c.code,
      'deliveryDate', cp.delivery_date, 'logisticsMode', cp.logistics_mode,
      'status', cp.status, 'expiresAt', cp.expires_at, 'createdAt', cp.created_at
    ) order by cp.created_at desc)
      from public.commercial_proposals cp
      join public.units_of_measure pu on pu.id = cp.unit_id
      join public.currencies c on c.id = cp.currency_id
      where cp.negotiation_id = n.id), '[]'::jsonb)
  ) into v_result
  from public.negotiations n
  join public.actors buyer on buyer.id = n.buyer_actor_id
  join public.actors producer on producer.id = n.producer_actor_id
  join public.market_listings ml on ml.id = coalesce(n.offer_listing_id, n.request_listing_id)
  join public.products p on p.id = ml.product_id
  left join public.product_varieties pv on pv.id = ml.variety_id
  join public.units_of_measure u on u.id = ml.unit_id
  where n.id = p_negotiation_id and p_actor_id in (n.buyer_actor_id, n.producer_actor_id);
  return v_result;
end;
$$;

create or replace function public.commerce_get_order(p_order_id uuid, p_actor_id uuid)
returns jsonb
language plpgsql stable security definer set search_path = public
as $$
declare v_result jsonb;
begin
  if auth.uid() is null or not public.can_act_as(p_actor_id) or not exists (
    select 1 from public.commercial_orders owned_order
    where owned_order.id = p_order_id
      and (
        owned_order.buyer_actor_id = p_actor_id
        or exists (
          select 1 from public.order_items owned_item
          join public.order_supplier_allocations owned_allocation on owned_allocation.order_item_id = owned_item.id
          where owned_item.order_id = owned_order.id
            and owned_allocation.producer_actor_id = p_actor_id
        )
      )
  ) then
    raise exception 'Order not accessible';
  end if;
  select jsonb_build_object(
    'id', co.id, 'buyerName', buyer.display_name, 'currencyCode', c.code,
    'status', co.status, 'agreedDeliveryDate', co.agreed_delivery_date,
    'reservationExpiresAt', co.reservation_expires_at, 'createdAt', co.created_at,
    'updatedAt', co.updated_at,
    'negotiationId', (select ono.negotiation_id from public.order_negotiations ono where ono.order_id = co.id limit 1),
    'total', coalesce((select sum(oi.quantity * oi.agreed_unit_price) from public.order_items oi where oi.order_id = co.id), 0),
    'items', coalesce((select jsonb_agg(jsonb_build_object(
      'id', oi.id, 'productName', p.name, 'varietyName', pv.name,
      'quantity', oi.quantity, 'unit', u.symbol, 'unitPrice', oi.agreed_unit_price,
      'allocations', coalesce((select jsonb_agg(jsonb_build_object(
        'id', osa.id, 'producerActorId', osa.producer_actor_id,
        'producerName', producer.display_name, 'quantity', osa.allocated_quantity,
        'unitPrice', osa.unit_price, 'reservationStatus', ir.status,
        'reservationExpiresAt', ir.expires_at
      ) order by osa.created_at)
        from public.order_supplier_allocations osa
        join public.actors producer on producer.id = osa.producer_actor_id
        left join public.inventory_reservations ir on ir.allocation_id = osa.id
        where osa.order_item_id = oi.id), '[]'::jsonb)
    ) order by oi.created_at)
      from public.order_items oi
      join public.products p on p.id = oi.product_id
      left join public.product_varieties pv on pv.id = oi.variety_id
      join public.units_of_measure u on u.id = oi.unit_id
      where oi.order_id = co.id), '[]'::jsonb)
  ) into v_result
  from public.commercial_orders co
  join public.actors buyer on buyer.id = co.buyer_actor_id
  join public.currencies c on c.id = co.currency_id
  where co.id = p_order_id;
  return v_result;
end;
$$;

create or replace function public.commerce_list_orders(p_actor_id uuid)
returns jsonb
language plpgsql stable security definer set search_path = public
as $$
begin
  if auth.uid() is null or not public.can_act_as(p_actor_id) then raise exception 'Actor not accessible'; end if;
  return coalesce((select jsonb_agg(public.commerce_get_order(co.id, p_actor_id) order by co.created_at desc)
    from public.commercial_orders co
    where co.buyer_actor_id = p_actor_id
      or exists (
        select 1 from public.order_items oi
        join public.order_supplier_allocations osa on osa.order_item_id = oi.id
        where oi.order_id = co.id and osa.producer_actor_id = p_actor_id
      )), '[]'::jsonb);
end;
$$;

revoke all on function public.commerce_create_conversation(uuid, uuid) from public;
revoke all on function public.submit_quick_offer(uuid, uuid, numeric, numeric, char(3)) from authenticated;
revoke all on function public.commerce_submit_quick_offer(uuid, uuid, numeric, numeric, char(3)) from public;
revoke all on function public.commerce_send_message(uuid, uuid, text) from public;
revoke all on function public.commerce_create_proposal(uuid, uuid, numeric, numeric, char(3), date, public.logistics_mode, timestamptz, uuid) from public;
revoke all on function public.commerce_respond_to_proposal(uuid, uuid, uuid, boolean) from public;
revoke all on function public.commerce_list_negotiations(uuid) from public;
revoke all on function public.commerce_get_negotiation(uuid, uuid) from public;
revoke all on function public.commerce_list_orders(uuid) from public;
revoke all on function public.commerce_get_order(uuid, uuid) from public;

grant execute on function public.commerce_create_conversation(uuid, uuid) to authenticated;
grant execute on function public.commerce_submit_quick_offer(uuid, uuid, numeric, numeric, char(3)) to authenticated;
grant execute on function public.commerce_send_message(uuid, uuid, text) to authenticated;
grant execute on function public.commerce_create_proposal(uuid, uuid, numeric, numeric, char(3), date, public.logistics_mode, timestamptz, uuid) to authenticated;
grant execute on function public.commerce_respond_to_proposal(uuid, uuid, uuid, boolean) to authenticated;
grant execute on function public.commerce_list_negotiations(uuid) to authenticated;
grant execute on function public.commerce_get_negotiation(uuid, uuid) to authenticated;
grant execute on function public.commerce_list_orders(uuid) to authenticated;
grant execute on function public.commerce_get_order(uuid, uuid) to authenticated;
