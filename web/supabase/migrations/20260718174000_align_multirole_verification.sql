create or replace function public.account_get_verification(p_actor_id uuid)
returns jsonb
language plpgsql stable security definer set search_path = public
as $$
declare v_result jsonb;
begin
  if auth.uid() is null or not public.can_act_as(p_actor_id) then raise exception 'Actor not accessible'; end if;
  select jsonb_build_object(
    'level', vs.code, 'requestId', vr.id, 'requestStatus', vr.status,
    'reviewerNotes', vr.reviewer_notes, 'createdAt', vr.created_at,
    'profileComplete',
      exists (
        select 1
        from public.actor_roles ar
        join public.app_roles r on r.id = ar.role_id
        where ar.actor_id = p_actor_id
          and upper(r.code::text) in ('PRODUCER', 'BUYER', 'TRANSPORTER')
      )
      and not exists (
        select 1
        from public.actor_roles ar
        join public.app_roles r on r.id = ar.role_id
        where ar.actor_id = p_actor_id
          and upper(r.code::text) in ('PRODUCER', 'BUYER', 'TRANSPORTER')
          and not exists (
            select 1
            from public.actor_onboarding_details aod
            where aod.actor_id = ar.actor_id
              and aod.role_code = case upper(r.code::text)
                when 'PRODUCER' then 'productor'
                when 'BUYER' then 'comprador'
                when 'TRANSPORTER' then 'transportista'
              end
          )
      )
  ) into v_result
  from public.actors a
  left join public.verification_statuses vs on vs.id = a.verification_status_id
  left join lateral (
    select * from public.verification_requests request
    where request.actor_id = a.id order by request.created_at desc limit 1
  ) vr on true where a.id = p_actor_id;
  return v_result;
end;
$$;

revoke all on function public.account_get_verification(uuid) from public;
grant execute on function public.account_get_verification(uuid) to authenticated;
