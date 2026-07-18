-- Authenticated account bootstrap and safe application primitives.

create or replace function public.bootstrap_actor(
  p_profile_kind text,
  p_role_codes text[],
  p_display_name text default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_actor_id uuid;
  v_organization_id uuid;
  v_display_name text;
  v_role_code text;
  v_role_id smallint;
  v_verification_id smallint;
begin
  if v_user_id is null then
    raise exception 'Authentication required';
  end if;

  if p_profile_kind not in ('person', 'organization') then
    raise exception 'Unsupported profile kind';
  end if;

  if coalesce(array_length(p_role_codes, 1), 0) = 0 then
    raise exception 'At least one role is required';
  end if;

  select coalesce(nullif(trim(p_display_name), ''), up.full_name)
  into v_display_name
  from public.user_profiles up
  where up.id = v_user_id;

  if v_display_name is null then
    raise exception 'User profile not found';
  end if;

  select id into v_verification_id
  from public.verification_statuses
  where upper(code::text) = 'UNVERIFIED';

  if p_profile_kind = 'person' then
    insert into public.actors (kind, user_id, display_name, verification_status_id)
    values ('PERSON', v_user_id, v_display_name, v_verification_id)
    on conflict (user_id) do update
      set display_name = excluded.display_name,
          is_active = true
    returning id into v_actor_id;
  else
    select a.id into v_actor_id
    from public.actors a
    join public.organization_members om on om.organization_id = a.organization_id
    where om.user_id = v_user_id
      and om.status = 'ACTIVE'
      and om.is_owner
    order by a.created_at
    limit 1;

    if v_actor_id is null then
      insert into public.organizations (
        organization_type_id,
        legal_name,
        trade_name,
        created_by
      )
      select ot.id, v_display_name, v_display_name, v_user_id
      from public.organization_types ot
      where upper(ot.code::text) = 'COMPANY'
      returning id into v_organization_id;

      insert into public.organization_members (
        organization_id,
        user_id,
        member_title,
        status,
        is_owner
      ) values (v_organization_id, v_user_id, 'Propietario', 'ACTIVE', true);

      insert into public.actors (
        kind,
        organization_id,
        display_name,
        verification_status_id
      ) values ('ORGANIZATION', v_organization_id, v_display_name, v_verification_id)
      returning id into v_actor_id;
    end if;
  end if;

  foreach v_role_code in array p_role_codes loop
    if lower(v_role_code) not in ('productor', 'comprador', 'transportista') then
      raise exception 'Role cannot be self-assigned';
    end if;

    select r.id into v_role_id
    from public.app_roles r
    where upper(r.code::text) = case lower(v_role_code)
      when 'productor' then 'PRODUCER'
      when 'comprador' then 'BUYER'
      when 'transportista' then 'TRANSPORTER'
    end;

    insert into public.user_roles (user_id, role_id)
    values (v_user_id, v_role_id)
    on conflict do nothing;

    insert into public.actor_roles (actor_id, role_id)
    values (v_actor_id, v_role_id)
    on conflict do nothing;
  end loop;

  insert into public.audit_logs (user_id, actor_id, action, entity_table, entity_id)
  values (v_user_id, v_actor_id, 'ACTOR_BOOTSTRAPPED', 'actors', v_actor_id::text);

  return v_actor_id;
end;
$$;

revoke all on function public.bootstrap_actor(text, text[], text) from public;
grant execute on function public.bootstrap_actor(text, text[], text) to authenticated;

create or replace function public.get_my_actor_context()
returns table (
  actor_id uuid,
  display_name text,
  role_codes text[]
)
language sql
stable
security definer
set search_path = public
as $$
  select
    a.id,
    a.display_name,
    coalesce(
      array_agg(
        case upper(r.code::text)
          when 'PRODUCER' then 'productor'
          when 'BUYER' then 'comprador'
          when 'TRANSPORTER' then 'transportista'
        end
        order by r.id
      ) filter (where upper(r.code::text) in ('PRODUCER', 'BUYER', 'TRANSPORTER')),
      '{}'::text[]
    )
  from public.actors a
  left join public.organization_members om
    on om.organization_id = a.organization_id
   and om.user_id = auth.uid()
   and om.status = 'ACTIVE'
  left join public.actor_roles ar on ar.actor_id = a.id
  left join public.app_roles r on r.id = ar.role_id
  where a.is_active
    and (a.user_id = auth.uid() or om.user_id = auth.uid())
  group by a.id, a.display_name, a.created_at
  order by a.created_at
  limit 1;
$$;

revoke all on function public.get_my_actor_context() from public;
grant execute on function public.get_my_actor_context() to authenticated;

create table if not exists public.saved_listings (
  user_id uuid not null references public.user_profiles(id) on delete cascade,
  listing_id uuid not null references public.market_listings(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, listing_id)
);

create table if not exists public.saved_actors (
  user_id uuid not null references public.user_profiles(id) on delete cascade,
  actor_id uuid not null references public.actors(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, actor_id)
);

alter table public.saved_listings enable row level security;
alter table public.saved_actors enable row level security;

create policy saved_listings_self
on public.saved_listings for all
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

create policy saved_actors_self
on public.saved_actors for all
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

-- The marketplace projection must honor base-table RLS and never show drafts.
create or replace view public.marketplace_listing_public
with (security_invoker = true)
as
select
  ml.id,
  ml.listing_type,
  ml.actor_id,
  a.display_name as actor_display_name,
  ml.product_id,
  p.name as product_name,
  ml.variety_id,
  pv.name as variety_name,
  ml.title,
  ml.description,
  ml.quantity,
  ml.unit_id,
  u.symbol as unit_symbol,
  ml.location_point_id,
  lp.label as location_label,
  lp.is_approximate,
  ml.available_from,
  ml.deadline_at,
  ml.status,
  ml.created_at,
  po.minimum_order_quantity,
  po.allow_partial_quantity,
  pr.accepts_partial_offers,
  pr.accepts_multiple_suppliers,
  onp.quick_negotiation_enabled
from public.market_listings ml
join public.actors a on a.id = ml.actor_id
join public.products p on p.id = ml.product_id
left join public.product_varieties pv on pv.id = ml.variety_id
join public.units_of_measure u on u.id = ml.unit_id
join public.location_points lp on lp.id = ml.location_point_id
left join public.product_offers po on po.listing_id = ml.id
left join public.purchase_requests pr on pr.listing_id = ml.id
left join public.offer_negotiation_policies onp on onp.offer_listing_id = ml.id
where ml.status = 'ACTIVE';

grant select on public.marketplace_listing_public to authenticated;

-- Intelligence tables are exposed only through deliberate policies.
alter table public.market_price_observations enable row level security;
alter table public.listing_price_suggestions enable row level security;
alter table public.price_suggestion_observations enable row level security;
alter table public.freight_price_suggestions enable row level security;
alter table public.risk_events enable row level security;
alter table public.risk_event_evidence enable row level security;
alter table public.route_plans enable row level security;
alter table public.route_risk_snapshots enable row level security;
alter table public.route_risk_snapshot_events enable row level security;
alter table public.analysis_runs enable row level security;
alter table public.analysis_run_risk_events enable row level security;
alter table public.analysis_run_price_suggestions enable row level security;
alter table public.audit_logs enable row level security;

create policy market_prices_read on public.market_price_observations
for select to authenticated using (true);
create policy listing_price_suggestions_read on public.listing_price_suggestions
for select to authenticated using (true);
create policy freight_price_suggestions_read on public.freight_price_suggestions
for select to authenticated using (true);
create policy risk_events_read on public.risk_events
for select to authenticated using (status in ('CONFIRMED', 'ACTIVE', 'RESOLVED') or public.is_admin());
create policy risk_event_evidence_read on public.risk_event_evidence
for select to authenticated using (
  exists (
    select 1 from public.risk_events re
    where re.id = risk_event_evidence.risk_event_id
      and (re.status in ('CONFIRMED', 'ACTIVE', 'RESOLVED') or public.is_admin())
  )
);
create policy route_plans_read on public.route_plans
for select to authenticated using (public.can_access_shipment(shipment_request_id));
create policy route_risk_snapshots_read on public.route_risk_snapshots
for select to authenticated using (
  exists (
    select 1 from public.route_plans rp
    where rp.id = route_risk_snapshots.route_plan_id
      and public.can_access_shipment(rp.shipment_request_id)
  )
);
create policy route_risk_events_read on public.route_risk_snapshot_events
for select to authenticated using (
  exists (
    select 1
    from public.route_risk_snapshots rrs
    join public.route_plans rp on rp.id = rrs.route_plan_id
    where rrs.id = route_risk_snapshot_events.snapshot_id
      and public.can_access_shipment(rp.shipment_request_id)
  )
);
create policy analysis_runs_admin on public.analysis_runs
for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy audit_logs_admin on public.audit_logs
for select to authenticated using (public.is_admin());

create policy market_prices_admin on public.market_price_observations
for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy risk_events_admin on public.risk_events
for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy risk_event_evidence_admin on public.risk_event_evidence
for all to authenticated using (public.is_admin()) with check (public.is_admin());
