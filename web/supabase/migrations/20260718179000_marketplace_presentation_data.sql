-- Return stable catalog identifiers and privacy-safe approximate map coordinates.
drop function if exists public.get_active_marketplace_listings(integer, public.listing_type, uuid, text);

create function public.get_active_marketplace_listings(
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
  product_code text,
  product_name text,
  variety_id uuid,
  variety_code text,
  variety_name text,
  title text,
  description text,
  quantity numeric,
  unit_id smallint,
  unit_symbol text,
  location_label text,
  approximate_latitude numeric,
  approximate_longitude numeric,
  available_from date,
  deadline_at timestamptz,
  created_at timestamptz,
  minimum_order_quantity numeric,
  allow_partial_quantity boolean,
  accepts_partial_offers boolean,
  accepts_multiple_suppliers boolean,
  quick_negotiation_enabled boolean,
  conversational_window_hours integer,
  saved boolean,
  actor_verification_code text,
  currency_symbol text,
  price_low numeric,
  price_mid numeric,
  price_high numeric,
  price_confidence numeric,
  price_calculated_at timestamptz
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
    p.code,
    p.name,
    ml.variety_id,
    pv.code,
    pv.name,
    ml.title,
    ml.description,
    ml.quantity,
    ml.unit_id,
    u.symbol,
    lp.label,
    round(lp.latitude::numeric, 2),
    round(lp.longitude::numeric, 2),
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
      select 1
      from public.saved_listings sl
      where sl.user_id = auth.uid() and sl.listing_id = ml.id
    ),
    coalesce(vs.code::text, 'UNVERIFIED'),
    latest_price.currency_symbol,
    latest_price.price_low,
    latest_price.price_mid,
    latest_price.price_high,
    latest_price.confidence,
    latest_price.calculated_at
  from public.market_listings ml
  join public.actors a on a.id = ml.actor_id and a.is_active
  join public.products p on p.id = ml.product_id and p.is_active
  left join public.product_varieties pv on pv.id = ml.variety_id
  join public.units_of_measure u on u.id = ml.unit_id
  join public.location_points lp on lp.id = ml.location_point_id
  left join public.verification_statuses vs on vs.id = a.verification_status_id
  left join public.product_offers po on po.listing_id = ml.id
  left join public.purchase_requests pr on pr.listing_id = ml.id
  left join public.offer_negotiation_policies onp on onp.offer_listing_id = ml.id
  left join lateral (
    select
      c.symbol as currency_symbol,
      lps.price_low,
      lps.price_mid,
      lps.price_high,
      lps.confidence,
      lps.calculated_at
    from public.listing_price_suggestions lps
    join public.currencies c on c.id = lps.currency_id
    where lps.listing_id = ml.id
    order by lps.calculated_at desc
    limit 1
  ) latest_price on true
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
