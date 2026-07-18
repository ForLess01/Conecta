-- Transactional marketplace publishing and deliberately narrow public reads.

create or replace function public.get_active_marketplace_listings(
  p_limit integer default 60,
  p_listing_type public.listing_type default null,
  p_listing_id uuid default null,
  p_query text default null
)
returns table (
  id uuid,
  listing_type public.listing_type,
  actor_id uuid,
  actor_display_name text,
  product_id uuid,
  product_name text,
  variety_id uuid,
  variety_name text,
  title text,
  description text,
  quantity numeric,
  unit_id smallint,
  unit_symbol text,
  location_label text,
  available_from date,
  deadline_at timestamptz,
  created_at timestamptz,
  minimum_order_quantity numeric,
  allow_partial_quantity boolean,
  accepts_partial_offers boolean,
  accepts_multiple_suppliers boolean,
  quick_negotiation_enabled boolean,
  conversational_window_hours integer,
  saved boolean
)
language sql
stable
security definer
set search_path = public
as $$
  select
    ml.id,
    ml.listing_type,
    ml.actor_id,
    a.display_name,
    ml.product_id,
    p.name,
    ml.variety_id,
    pv.name,
    ml.title,
    ml.description,
    ml.quantity,
    ml.unit_id,
    u.symbol,
    lp.label,
    ml.available_from,
    ml.deadline_at,
    ml.created_at,
    po.minimum_order_quantity,
    po.allow_partial_quantity,
    pr.accepts_partial_offers,
    pr.accepts_multiple_suppliers,
    onp.quick_negotiation_enabled,
    onp.conversational_window_hours,
    exists (
      select 1 from public.saved_listings sl
      where sl.user_id = auth.uid() and sl.listing_id = ml.id
    )
  from public.market_listings ml
  join public.actors a on a.id = ml.actor_id and a.is_active
  join public.products p on p.id = ml.product_id and p.is_active
  left join public.product_varieties pv on pv.id = ml.variety_id
  join public.units_of_measure u on u.id = ml.unit_id
  join public.location_points lp on lp.id = ml.location_point_id
  left join public.product_offers po on po.listing_id = ml.id
  left join public.purchase_requests pr on pr.listing_id = ml.id
  left join public.offer_negotiation_policies onp on onp.offer_listing_id = ml.id
  where ml.status = 'ACTIVE'
    and (p_listing_type is null or ml.listing_type = p_listing_type)
    and (p_listing_id is null or ml.id = p_listing_id)
    and (
      nullif(trim(p_query), '') is null
      or ml.title ilike '%' || trim(p_query) || '%'
      or p.name ilike '%' || trim(p_query) || '%'
      or coalesce(pv.name, '') ilike '%' || trim(p_query) || '%'
      or lp.label ilike '%' || trim(p_query) || '%'
    )
  order by ml.created_at desc
  limit least(greatest(coalesce(p_limit, 60), 1), 100);
$$;

revoke all on function public.get_active_marketplace_listings(integer, public.listing_type, uuid, text) from public;
grant execute on function public.get_active_marketplace_listings(integer, public.listing_type, uuid, text) to anon, authenticated;

create or replace function public.get_public_actor_profile(p_actor_id uuid)
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  select jsonb_build_object(
    'id', a.id,
    'name', a.display_name,
    'kind', a.kind,
    'verification', coalesce(vs.code::text, 'UNVERIFIED'),
    'verificationName', coalesce(vs.name, 'Sin verificar'),
    'memberSince', a.created_at,
    'roles', coalesce((
      select jsonb_agg(upper(r.code::text) order by r.id)
      from public.actor_roles ar
      join public.app_roles r on r.id = ar.role_id
      where ar.actor_id = a.id
    ), '[]'::jsonb),
    'locations', coalesce((
      select jsonb_agg(jsonb_build_object('label', lp.label, 'name', al.label) order by al.is_primary desc)
      from public.actor_locations al
      join public.location_points lp on lp.id = al.location_point_id
      where al.actor_id = a.id and al.is_public
    ), '[]'::jsonb)
  )
  from public.actors a
  left join public.verification_statuses vs on vs.id = a.verification_status_id
  where a.id = p_actor_id and a.is_active;
$$;

revoke all on function public.get_public_actor_profile(uuid) from public;
grant execute on function public.get_public_actor_profile(uuid) to authenticated;

create or replace function public.toggle_saved_listing(p_listing_id uuid)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then raise exception 'Authentication required'; end if;
  delete from public.saved_listings where user_id = auth.uid() and listing_id = p_listing_id;
  if found then return false; end if;
  if not exists (
    select 1 from public.market_listings ml
    join public.actors a on a.id = ml.actor_id and a.is_active
    where ml.id = p_listing_id and ml.status = 'ACTIVE'
  ) then
    raise exception 'Listing is not active';
  end if;
  insert into public.saved_listings (user_id, listing_id) values (auth.uid(), p_listing_id);
  return true;
end;
$$;

revoke all on function public.toggle_saved_listing(uuid) from public;
grant execute on function public.toggle_saved_listing(uuid) to authenticated;

create or replace function public.toggle_saved_actor(p_actor_id uuid)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then raise exception 'Authentication required'; end if;
  delete from public.saved_actors where user_id = auth.uid() and actor_id = p_actor_id;
  if found then return false; end if;
  if not exists (select 1 from public.actors where id = p_actor_id and is_active) then
    raise exception 'Actor is not active';
  end if;
  insert into public.saved_actors (user_id, actor_id) values (auth.uid(), p_actor_id);
  return true;
end;
$$;

revoke all on function public.toggle_saved_actor(uuid) from public;
grant execute on function public.toggle_saved_actor(uuid) to authenticated;

create or replace function public.create_market_offer(
  p_actor_id uuid,
  p_product_id uuid,
  p_variety_id uuid,
  p_title text,
  p_description text,
  p_quantity numeric,
  p_unit_id smallint,
  p_minimum_order_quantity numeric,
  p_allow_partial_quantity boolean,
  p_location_label text,
  p_latitude numeric,
  p_longitude numeric,
  p_available_from date,
  p_quick_negotiation_enabled boolean,
  p_conversational_window_hours integer,
  p_hidden_floor_price numeric,
  p_publish boolean default true
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_listing_id uuid;
  v_location_id uuid;
  v_currency_id smallint;
begin
  if auth.uid() is null or not public.can_act_as(p_actor_id) then
    raise exception 'Actor access denied';
  end if;
  if not exists (
    select 1 from public.actor_roles ar join public.app_roles r on r.id = ar.role_id
    where ar.actor_id = p_actor_id and upper(r.code::text) = 'PRODUCER'
  ) then
    raise exception 'A producer role is required';
  end if;
  if nullif(trim(p_title), '') is null or nullif(trim(p_location_label), '') is null then
    raise exception 'Title and location are required';
  end if;
  if p_quantity <= 0 or p_minimum_order_quantity <= 0 or p_minimum_order_quantity > p_quantity then
    raise exception 'Invalid quantities';
  end if;
  if not exists (select 1 from public.products where id = p_product_id and is_active) then
    raise exception 'Product is not active';
  end if;
  if not exists (select 1 from public.units_of_measure where id = p_unit_id) then
    raise exception 'Unit is not configured';
  end if;
  if p_quick_negotiation_enabled and (p_hidden_floor_price is null or p_hidden_floor_price <= 0) then
    raise exception 'Quick negotiation requires a positive private floor';
  end if;
  if p_variety_id is not null and not exists (
    select 1 from public.product_varieties where id = p_variety_id and product_id = p_product_id and is_active
  ) then
    raise exception 'Variety does not belong to product';
  end if;

  select id into v_currency_id from public.currencies where code = 'PEN';
  if v_currency_id is null then raise exception 'PEN currency is not configured'; end if;

  insert into public.location_points (label, latitude, longitude, is_approximate)
  values (trim(p_location_label), p_latitude, p_longitude, true)
  returning id into v_location_id;

  insert into public.market_listings (
    listing_type, actor_id, product_id, variety_id, title, description, quantity,
    unit_id, location_point_id, available_from, status
  ) values (
    'OFFER', p_actor_id, p_product_id, p_variety_id, trim(p_title), nullif(trim(p_description), ''),
    p_quantity, p_unit_id, v_location_id, p_available_from,
    case when p_publish then 'ACTIVE'::public.listing_status else 'DRAFT'::public.listing_status end
  ) returning id into v_listing_id;

  insert into public.product_offers (listing_id, minimum_order_quantity, allow_partial_quantity)
  values (v_listing_id, p_minimum_order_quantity, p_allow_partial_quantity);

  insert into public.offer_negotiation_policies (
    offer_listing_id, currency_id, quick_negotiation_enabled, auto_accept_enabled,
    conversational_window_hours
  ) values (
    v_listing_id, v_currency_id, p_quick_negotiation_enabled,
    p_quick_negotiation_enabled, p_conversational_window_hours
  );

  if p_hidden_floor_price is not null then
    insert into public.offer_private_pricing (offer_listing_id, hidden_floor_price)
    values (v_listing_id, p_hidden_floor_price);
  end if;

  insert into public.audit_logs (user_id, actor_id, action, entity_table, entity_id)
  values (auth.uid(), p_actor_id, case when p_publish then 'OFFER_PUBLISHED' else 'OFFER_DRAFTED' end, 'market_listings', v_listing_id::text);
  return v_listing_id;
end;
$$;

revoke all on function public.create_market_offer(uuid, uuid, uuid, text, text, numeric, smallint, numeric, boolean, text, numeric, numeric, date, boolean, integer, numeric, boolean) from public;
grant execute on function public.create_market_offer(uuid, uuid, uuid, text, text, numeric, smallint, numeric, boolean, text, numeric, numeric, date, boolean, integer, numeric, boolean) to authenticated;

create or replace function public.create_purchase_request(
  p_actor_id uuid,
  p_product_id uuid,
  p_variety_id uuid,
  p_title text,
  p_description text,
  p_quantity numeric,
  p_unit_id smallint,
  p_location_label text,
  p_latitude numeric,
  p_longitude numeric,
  p_deadline_at timestamptz,
  p_delivery_deadline date,
  p_accepts_partial_offers boolean,
  p_accepts_multiple_suppliers boolean,
  p_publish boolean default true
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_listing_id uuid;
  v_location_id uuid;
begin
  if auth.uid() is null or not public.can_act_as(p_actor_id) then
    raise exception 'Actor access denied';
  end if;
  if not exists (
    select 1 from public.actor_roles ar join public.app_roles r on r.id = ar.role_id
    where ar.actor_id = p_actor_id and upper(r.code::text) = 'BUYER'
  ) then
    raise exception 'A buyer role is required';
  end if;
  if nullif(trim(p_title), '') is null or nullif(trim(p_location_label), '') is null or p_quantity <= 0 then
    raise exception 'Title, location and positive quantity are required';
  end if;
  if not exists (select 1 from public.products where id = p_product_id and is_active) then
    raise exception 'Product is not active';
  end if;
  if not exists (select 1 from public.units_of_measure where id = p_unit_id) then
    raise exception 'Unit is not configured';
  end if;
  if p_deadline_at is not null and p_deadline_at <= now() then
    raise exception 'Deadline must be in the future';
  end if;
  if p_variety_id is not null and not exists (
    select 1 from public.product_varieties where id = p_variety_id and product_id = p_product_id and is_active
  ) then
    raise exception 'Variety does not belong to product';
  end if;

  insert into public.location_points (label, latitude, longitude, is_approximate)
  values (trim(p_location_label), p_latitude, p_longitude, true)
  returning id into v_location_id;

  insert into public.market_listings (
    listing_type, actor_id, product_id, variety_id, title, description, quantity,
    unit_id, location_point_id, deadline_at, status
  ) values (
    'REQUEST', p_actor_id, p_product_id, p_variety_id, trim(p_title), nullif(trim(p_description), ''),
    p_quantity, p_unit_id, v_location_id, p_deadline_at,
    case when p_publish then 'ACTIVE'::public.listing_status else 'DRAFT'::public.listing_status end
  ) returning id into v_listing_id;

  insert into public.purchase_requests (
    listing_id, accepts_partial_offers, accepts_multiple_suppliers,
    requires_single_supplier, delivery_deadline
  ) values (
    v_listing_id, p_accepts_partial_offers, p_accepts_multiple_suppliers,
    not p_accepts_multiple_suppliers, p_delivery_deadline
  );

  insert into public.audit_logs (user_id, actor_id, action, entity_table, entity_id)
  values (auth.uid(), p_actor_id, case when p_publish then 'REQUEST_PUBLISHED' else 'REQUEST_DRAFTED' end, 'market_listings', v_listing_id::text);
  return v_listing_id;
end;
$$;

revoke all on function public.create_purchase_request(uuid, uuid, uuid, text, text, numeric, smallint, text, numeric, numeric, timestamptz, date, boolean, boolean, boolean) from public;
grant execute on function public.create_purchase_request(uuid, uuid, uuid, text, text, numeric, smallint, text, numeric, numeric, timestamptz, date, boolean, boolean, boolean) to authenticated;
