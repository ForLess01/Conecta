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
  where oi.id = new.order_item_id
  limit 1;

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
  where existing_item.order_id in (
    select distinct existing_link.order_id
    from public.order_negotiations existing_link
    join public.negotiations existing_negotiation on existing_negotiation.id = existing_link.negotiation_id
    where existing_negotiation.request_listing_id = v_request.listing_id
  );

  if not v_request.accepts_multiple_suppliers and v_already_allocated > 0 then
    raise exception 'Request accepts only one supplier';
  end if;
  if v_already_allocated + new.allocated_quantity > v_requested_quantity then
    raise exception 'Accepted proposals exceed requested quantity';
  end if;
  return new;
end;
$$;

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
  where oi.id = new.order_item_id
  limit 1;
  if v_request_id is null then return new; end if;
  select coalesce(sum(osa.allocated_quantity), 0) into v_allocated
  from public.order_supplier_allocations osa
  join public.order_items oi on oi.id = osa.order_item_id
  where oi.order_id in (
    select distinct ono.order_id
    from public.order_negotiations ono
    join public.negotiations n on n.id = ono.negotiation_id
    where n.request_listing_id = v_request_id
  );
  if v_allocated >= v_requested then
    update public.market_listings set status = 'CLOSED' where id = v_request_id;
  end if;
  return new;
end;
$$;
