create or replace function public.broadcast_negotiation_child_change()
returns trigger
language plpgsql
security definer
set search_path = public, realtime
as $$
declare v_negotiation_id uuid := coalesce(new.negotiation_id, old.negotiation_id);
begin
  perform realtime.broadcast_changes(
    'negotiation:' || v_negotiation_id::text,
    tg_op,
    tg_op,
    tg_table_name,
    tg_table_schema,
    new,
    old
  );
  return null;
end;
$$;

create or replace function public.broadcast_negotiation_change()
returns trigger
language plpgsql
security definer
set search_path = public, realtime
as $$
begin
  perform realtime.broadcast_changes(
    'negotiation:' || coalesce(new.id, old.id)::text,
    tg_op,
    tg_op,
    tg_table_name,
    tg_table_schema,
    new,
    old
  );
  return null;
end;
$$;

drop trigger if exists trg_broadcast_message_change on public.messages;
create trigger trg_broadcast_message_change
after insert on public.messages
for each row execute function public.broadcast_negotiation_child_change();

drop trigger if exists trg_broadcast_proposal_change on public.commercial_proposals;
create trigger trg_broadcast_proposal_change
after insert or update or delete on public.commercial_proposals
for each row execute function public.broadcast_negotiation_child_change();

drop trigger if exists trg_broadcast_negotiation_change on public.negotiations;
create trigger trg_broadcast_negotiation_change
after update on public.negotiations
for each row execute function public.broadcast_negotiation_change();

drop policy if exists negotiation_participants_receive_broadcasts on realtime.messages;
create policy negotiation_participants_receive_broadcasts
on realtime.messages
for select
to authenticated
using (
  realtime.messages.extension = 'broadcast'
  and exists (
    select 1
    from public.negotiations n
    where realtime.topic() = 'negotiation:' || n.id::text
      and (
        public.can_act_as(n.buyer_actor_id)
        or public.can_act_as(n.producer_actor_id)
        or public.is_admin()
      )
  )
);
