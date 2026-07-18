do $$
declare
  v_table text;
begin
  foreach v_table in array array['messages', 'commercial_proposals', 'negotiations'] loop
    if not exists (
      select 1
      from pg_publication_tables
      where pubname = 'supabase_realtime'
        and schemaname = 'public'
        and tablename = v_table
    ) then
      execute format('alter publication supabase_realtime add table public.%I', v_table);
    end if;
  end loop;
end;
$$;

create or replace function public.touch_negotiation_from_message()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.negotiations
  set updated_at = greatest(updated_at, new.created_at)
  where id = new.negotiation_id;
  return new;
end;
$$;

drop trigger if exists trg_touch_negotiation_from_message on public.messages;
create trigger trg_touch_negotiation_from_message
after insert on public.messages
for each row execute function public.touch_negotiation_from_message();
