-- Persistent admin workflows for grounded risk analysis, verification, and moderation.

create table if not exists public.analysis_risk_candidates (
  id uuid primary key default gen_random_uuid(),
  analysis_run_id uuid not null references public.analysis_runs(id) on delete cascade,
  external_key text not null,
  event_type_code citext not null,
  title text not null,
  summary text not null,
  region text not null,
  province text,
  district text,
  road_name text,
  severity smallint not null check (severity between 1 and 5),
  source_confidence numeric(5,2) not null check (source_confidence between 0 and 100),
  risk_score numeric(5,2) not null check (risk_score between 0 and 100),
  starts_at timestamptz,
  ends_at timestamptz,
  status public.risk_event_status not null default 'UNCONFIRMED',
  risk_event_id uuid references public.risk_events(id) on delete set null,
  reviewed_by uuid references public.user_profiles(id),
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  unique (analysis_run_id, external_key),
  check (status in ('UNCONFIRMED', 'CONFIRMED', 'DISCARDED'))
);

create index if not exists idx_analysis_risk_candidates_queue
on public.analysis_risk_candidates(status, created_at desc);

create table if not exists public.analysis_candidate_citations (
  id uuid primary key default gen_random_uuid(),
  candidate_id uuid not null references public.analysis_risk_candidates(id) on delete cascade,
  title text not null,
  source_url text not null,
  created_at timestamptz not null default now(),
  unique (candidate_id, source_url),
  check (source_url ~ '^https?://')
);

create table if not exists public.verification_requests (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid not null references public.actors(id) on delete cascade,
  requested_status_id smallint not null references public.verification_statuses(id),
  status text not null default 'PENDING' check (status in ('PENDING', 'NEEDS_INFO', 'APPROVED', 'REJECTED')),
  document_paths jsonb not null default '[]'::jsonb check (jsonb_typeof(document_paths) = 'array'),
  applicant_notes text,
  reviewer_notes text,
  reviewed_by uuid references public.user_profiles(id),
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists idx_verification_requests_one_open
on public.verification_requests(actor_id) where status in ('PENDING', 'NEEDS_INFO');

create trigger trg_verification_requests_updated_at
before update on public.verification_requests
for each row execute function public.set_updated_at();

create table if not exists public.moderation_reports (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references public.market_listings(id) on delete cascade,
  reporter_user_id uuid not null references public.user_profiles(id) on delete cascade,
  reason text not null,
  details text,
  status text not null default 'OPEN' check (status in ('OPEN', 'REVIEWING', 'DISMISSED', 'ACTIONED')),
  action text check (action is null or action in ('NONE', 'PAUSE_LISTING', 'CLOSE_LISTING')),
  moderator_notes text,
  reviewed_by uuid references public.user_profiles(id),
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (listing_id, reporter_user_id, reason)
);

create index if not exists idx_moderation_reports_queue
on public.moderation_reports(status, created_at desc);

create trigger trg_moderation_reports_updated_at
before update on public.moderation_reports
for each row execute function public.set_updated_at();

insert into public.risk_sources (code, name, source_type, base_reliability)
values ('GEMINI_GROUNDED', 'Gemini con fuentes web citadas', 'NEWS', 0.70)
on conflict (code) do nothing;

insert into public.verification_requests (actor_id, requested_status_id)
select a.id, target.id
from public.actors a
join public.verification_statuses current_status on current_status.id = a.verification_status_id
cross join lateral (
  select id from public.verification_statuses where upper(code::text) = 'IDENTITY_VERIFIED' limit 1
) target
where upper(current_status.code::text) = 'UNVERIFIED'
on conflict do nothing;

alter table public.analysis_risk_candidates enable row level security;
alter table public.analysis_candidate_citations enable row level security;
alter table public.verification_requests enable row level security;
alter table public.moderation_reports enable row level security;

create policy analysis_risk_candidates_admin on public.analysis_risk_candidates
for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy analysis_candidate_citations_admin on public.analysis_candidate_citations
for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy verification_requests_admin on public.verification_requests
for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy verification_requests_owner_read on public.verification_requests
for select to authenticated using (
  exists (select 1 from public.actors a where a.id = actor_id and a.user_id = auth.uid())
);
create policy moderation_reports_admin on public.moderation_reports
for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy moderation_reports_submit on public.moderation_reports
for insert to authenticated with check (reporter_user_id = auth.uid());
create policy moderation_reports_owner_read on public.moderation_reports
for select to authenticated using (reporter_user_id = auth.uid());

create policy analysis_run_risk_events_admin on public.analysis_run_risk_events
for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy analysis_run_price_suggestions_admin on public.analysis_run_price_suggestions
for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy audit_logs_admin_insert on public.audit_logs
for insert to authenticated with check (public.is_admin() and user_id = auth.uid());

grant select, insert, update, delete on public.analysis_risk_candidates to authenticated;
grant select, insert, update, delete on public.analysis_candidate_citations to authenticated;
grant select, insert, update, delete on public.verification_requests to authenticated;
grant select, insert, update, delete on public.moderation_reports to authenticated;
grant select, insert, update, delete on public.analysis_runs to authenticated;
grant select, insert, update, delete on public.analysis_run_risk_events to authenticated;
grant select, insert, update, delete on public.risk_events to authenticated;
grant select, insert, update, delete on public.risk_event_evidence to authenticated;
grant select, insert, update, delete on public.market_price_observations to authenticated;
grant select, insert on public.audit_logs to authenticated;

create or replace function public.confirm_risk_candidate(p_candidate_id uuid)
returns uuid
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_candidate public.analysis_risk_candidates%rowtype;
  v_event_type_id smallint;
  v_source_id smallint;
  v_event_id uuid;
begin
  if not public.is_admin() then raise exception 'Admin role required'; end if;

  select * into v_candidate
  from public.analysis_risk_candidates
  where id = p_candidate_id and status = 'UNCONFIRMED'
  for update;
  if not found then raise exception 'Candidate is not pending'; end if;

  select id into v_event_type_id from public.risk_event_types
  where upper(code::text) = upper(v_candidate.event_type_code::text);
  if v_event_type_id is null then raise exception 'Unknown risk event type'; end if;

  insert into public.risk_events (
    event_type_id, title, summary, road_name, severity, source_confidence,
    status, starts_at, ends_at
  ) values (
    v_event_type_id, v_candidate.title, v_candidate.summary, v_candidate.road_name,
    v_candidate.severity, v_candidate.source_confidence, 'CONFIRMED',
    v_candidate.starts_at, v_candidate.ends_at
  ) returning id into v_event_id;

  select id into v_source_id from public.risk_sources
  where upper(code::text) = 'GEMINI_GROUNDED';

  insert into public.risk_event_evidence (
    risk_event_id, source_id, headline, source_url, evidence_confidence
  )
  select v_event_id, v_source_id, c.title, c.source_url, v_candidate.source_confidence
  from public.analysis_candidate_citations c
  where c.candidate_id = p_candidate_id;

  update public.analysis_risk_candidates
  set status = 'CONFIRMED', risk_event_id = v_event_id,
      reviewed_by = auth.uid(), reviewed_at = now()
  where id = p_candidate_id;

  insert into public.analysis_run_risk_events (analysis_run_id, risk_event_id)
  values (v_candidate.analysis_run_id, v_event_id);
  insert into public.audit_logs (user_id, action, entity_table, entity_id)
  values (auth.uid(), 'RISK_CANDIDATE_CONFIRMED', 'risk_events', v_event_id::text);

  return v_event_id;
end;
$$;

create or replace function public.review_verification_request(
  p_request_id uuid,
  p_status text,
  p_notes text default null
)
returns void
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_request public.verification_requests%rowtype;
begin
  if not public.is_admin() then raise exception 'Admin role required'; end if;
  if p_status not in ('NEEDS_INFO', 'APPROVED', 'REJECTED') then raise exception 'Invalid review status'; end if;

  select * into v_request from public.verification_requests
  where id = p_request_id and status in ('PENDING', 'NEEDS_INFO') for update;
  if not found then raise exception 'Verification request is not pending'; end if;

  update public.verification_requests
  set status = p_status, reviewer_notes = nullif(trim(p_notes), ''),
      reviewed_by = auth.uid(), reviewed_at = now()
  where id = p_request_id;

  if p_status = 'APPROVED' then
    update public.actors set verification_status_id = v_request.requested_status_id
    where id = v_request.actor_id;
  end if;

  insert into public.audit_logs (user_id, action, entity_table, entity_id)
  values (auth.uid(), 'VERIFICATION_' || p_status, 'verification_requests', p_request_id::text);
end;
$$;

create or replace function public.review_moderation_report(
  p_report_id uuid,
  p_status text,
  p_action text default 'NONE',
  p_notes text default null
)
returns void
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_report public.moderation_reports%rowtype;
begin
  if not public.is_admin() then raise exception 'Admin role required'; end if;
  if p_status not in ('REVIEWING', 'DISMISSED', 'ACTIONED') then raise exception 'Invalid moderation status'; end if;
  if p_action not in ('NONE', 'PAUSE_LISTING', 'CLOSE_LISTING') then raise exception 'Invalid moderation action'; end if;
  if p_status = 'ACTIONED' and p_action = 'NONE' then raise exception 'An action is required'; end if;

  select * into v_report from public.moderation_reports
  where id = p_report_id and status in ('OPEN', 'REVIEWING') for update;
  if not found then raise exception 'Moderation report is not open'; end if;

  if p_action = 'PAUSE_LISTING' then
    update public.market_listings set status = 'PAUSED' where id = v_report.listing_id;
  elsif p_action = 'CLOSE_LISTING' then
    update public.market_listings set status = 'CLOSED' where id = v_report.listing_id;
  end if;

  update public.moderation_reports
  set status = p_status, action = p_action, moderator_notes = nullif(trim(p_notes), ''),
      reviewed_by = auth.uid(), reviewed_at = now()
  where id = p_report_id;

  insert into public.audit_logs (user_id, action, entity_table, entity_id)
  values (auth.uid(), 'MODERATION_' || p_status, 'moderation_reports', p_report_id::text);
end;
$$;

revoke all on function public.confirm_risk_candidate(uuid) from public;
revoke all on function public.review_verification_request(uuid, text, text) from public;
revoke all on function public.review_moderation_report(uuid, text, text, text) from public;
grant execute on function public.confirm_risk_candidate(uuid) to authenticated;
grant execute on function public.review_verification_request(uuid, text, text) to authenticated;
grant execute on function public.review_moderation_report(uuid, text, text, text) to authenticated;
