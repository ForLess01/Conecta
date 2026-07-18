do $$
declare
  has_openai boolean;
  has_gemini boolean;
begin
  if to_regtype('public.analysis_provider') is null then
    return;
  end if;

  select exists (
    select 1
    from pg_enum e
    join pg_type t on t.oid = e.enumtypid
    join pg_namespace n on n.oid = t.typnamespace
    where n.nspname = 'public'
      and t.typname = 'analysis_provider'
      and e.enumlabel = 'OPENAI'
  ) into has_openai;

  select exists (
    select 1
    from pg_enum e
    join pg_type t on t.oid = e.enumtypid
    join pg_namespace n on n.oid = t.typnamespace
    where n.nspname = 'public'
      and t.typname = 'analysis_provider'
      and e.enumlabel = 'GEMINI'
  ) into has_gemini;

  if not has_gemini then
    if has_openai then
      alter type public.analysis_provider rename value 'OPENAI' to 'GEMINI';
    else
      alter type public.analysis_provider add value 'GEMINI';
    end if;
  end if;
end
$$;
