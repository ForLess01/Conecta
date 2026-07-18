create or replace function public.create_risk_event_with_evidence(p_payload jsonb)
returns uuid
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_event_type_id smallint;
  v_source_id smallint;
  v_event_id uuid;
  v_status public.risk_event_status;
begin
  if not public.is_admin() then raise exception 'Admin role required'; end if;
  if jsonb_typeof(p_payload) <> 'object' then raise exception 'Invalid risk event payload'; end if;

  select id into v_event_type_id
  from public.risk_event_types
  where upper(code::text) = upper(p_payload->>'eventTypeCode');
  if v_event_type_id is null then raise exception 'Unknown risk event type'; end if;
  v_status := coalesce((p_payload->>'status')::public.risk_event_status, 'CONFIRMED');

  insert into public.risk_events (
    event_type_id, title, summary, road_name, latitude, longitude,
    affected_radius_km, severity, source_confidence, status, starts_at, ends_at
  ) values (
    v_event_type_id,
    p_payload->>'title',
    nullif(p_payload->>'summary', ''),
    nullif(p_payload->>'roadName', ''),
    nullif(p_payload->>'latitude', '')::numeric,
    nullif(p_payload->>'longitude', '')::numeric,
    (p_payload->>'affectedRadiusKm')::numeric,
    (p_payload->>'severity')::smallint,
    (p_payload->>'sourceConfidence')::numeric,
    v_status,
    nullif(p_payload->>'startsAt', '')::timestamptz,
    nullif(p_payload->>'endsAt', '')::timestamptz
  ) returning id into v_event_id;

  if nullif(p_payload->>'sourceUrl', '') is not null then
    select id into v_source_id from public.risk_sources where upper(code::text) = 'MANUAL_DEMO';
    insert into public.risk_event_evidence (
      risk_event_id, source_id, headline, source_url, evidence_confidence
    ) values (
      v_event_id, v_source_id, p_payload->>'title', p_payload->>'sourceUrl',
      (p_payload->>'sourceConfidence')::numeric
    );
  end if;

  insert into public.audit_logs (user_id, action, entity_table, entity_id)
  values (auth.uid(), 'RISK_EVENT_CREATED', 'risk_events', v_event_id::text);
  return v_event_id;
end;
$$;

revoke all on function public.create_risk_event_with_evidence(jsonb) from public;
grant execute on function public.create_risk_event_with_evidence(jsonb) to authenticated;
