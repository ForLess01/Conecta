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
  if auth.uid() is null or not public.can_act_as(p_actor_id) then raise exception 'Actor not accessible by current user'; end if;
  if p_quantity <= 0 or p_unit_price <= 0 then raise exception 'Quantity and unit price must be positive'; end if;
  select * into v_negotiation from public.negotiations where id = p_negotiation_id for update;
  if not found or p_actor_id not in (v_negotiation.buyer_actor_id, v_negotiation.producer_actor_id) then raise exception 'Negotiation not accessible'; end if;
  if v_negotiation.status not in ('OPEN', 'OFFER_SUBMITTED', 'COUNTERED')
     or (v_negotiation.expires_at is not null and v_negotiation.expires_at <= now()) then raise exception 'Negotiation is closed'; end if;
  select * into v_listing from public.market_listings where id = coalesce(v_negotiation.offer_listing_id, v_negotiation.request_listing_id);
  if not found then raise exception 'Negotiation listing was not found'; end if;
  select id into v_currency_id from public.currencies where upper(code::text) = upper(p_currency_code::text);
  if v_currency_id is null then raise exception 'Unsupported currency'; end if;
  if v_negotiation.offer_listing_id is not null and not exists (
    select 1 from public.offer_negotiation_policies onp
    where onp.offer_listing_id = v_negotiation.offer_listing_id and onp.currency_id = v_currency_id
  ) then raise exception 'Currency not supported by this offer'; end if;
  v_expiration := least(coalesce(p_expires_at, now() + interval '24 hours'), coalesce(v_negotiation.expires_at, 'infinity'::timestamptz));
  if v_expiration <= now() then raise exception 'Proposal expiration must be in the future'; end if;
  if p_supersedes_proposal_id is not null then
    update public.commercial_proposals set status = 'SUPERSEDED'
    where id = p_supersedes_proposal_id and negotiation_id = p_negotiation_id and status = 'ACTIVE';
    if not found then raise exception 'Proposal cannot be countered'; end if;
  end if;
  update public.commercial_proposals set status = 'SUPERSEDED' where negotiation_id = p_negotiation_id and status = 'ACTIVE';
  insert into public.commercial_proposals (
    negotiation_id, created_by_actor_id, supersedes_proposal_id, quantity,
    unit_id, unit_price, currency_id, delivery_date, logistics_mode, expires_at
  ) values (
    p_negotiation_id, p_actor_id, p_supersedes_proposal_id, p_quantity,
    v_listing.unit_id, p_unit_price, v_currency_id, p_delivery_date, p_logistics_mode, v_expiration
  ) returning * into v_proposal;
  update public.negotiations set status = case
    when p_supersedes_proposal_id is null then 'OFFER_SUBMITTED'::public.negotiation_status
    else 'COUNTERED'::public.negotiation_status
  end where id = p_negotiation_id;
  insert into public.messages (negotiation_id, sender_actor_id, message_type, body)
  values (p_negotiation_id, p_actor_id, 'PROPOSAL_REFERENCE', 'Commercial proposal submitted');
  return jsonb_build_object('id', v_proposal.id, 'status', v_proposal.status, 'expires_at', v_proposal.expires_at);
end;
$$;
