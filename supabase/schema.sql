-- =====================================================================
-- Disce! Supabase schema
-- Paste this entire file into: Supabase Dashboard -> SQL Editor -> Run.
-- It is safe to run more than once.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. Community word classifications ("honor system")
--    Anyone may read, add and change a classification. Nobody can delete.
-- ---------------------------------------------------------------------
create table if not exists public.community_classifications (
  card_id    text primary key,
  pos        text not null check (pos in ('verb','noun','adjective','adverb','preposition','conjunction','pronoun','other')),
  grammar    jsonb not null default '{}'::jsonb check (octet_length(grammar::text) < 4000),
  updated_at timestamptz not null default now()
);

alter table public.community_classifications enable row level security;

drop policy if exists "classifications public read"   on public.community_classifications;
drop policy if exists "classifications public insert" on public.community_classifications;
drop policy if exists "classifications public update" on public.community_classifications;

create policy "classifications public read"
  on public.community_classifications for select using (true);
create policy "classifications public insert"
  on public.community_classifications for insert with check (true);
create policy "classifications public update"
  on public.community_classifications for update using (true) with check (true);

-- ---------------------------------------------------------------------
-- 2. PIN accounts
--    The table has RLS enabled and NO direct policies, so the browser
--    can never read or list it directly (that would expose every PIN).
--    All access goes through the three SECURITY DEFINER RPCs below.
-- ---------------------------------------------------------------------
create table if not exists public.user_profiles (
  pin        text primary key check (pin ~ '^[0-9]{6}$'),
  data       jsonb not null default '{}'::jsonb check (octet_length(data::text) < 2000000),
  updated_at timestamptz not null default now()
);

alter table public.user_profiles enable row level security;

-- Create an account: generates a unique random 6-digit PIN server-side.
create or replace function public.create_profile(p_data jsonb default '{}'::jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_pin   text;
  v_ts    timestamptz;
  v_tries int := 0;
begin
  loop
    v_pin := lpad(floor(random() * 1000000)::int::text, 6, '0');
    begin
      insert into public.user_profiles (pin, data)
      values (v_pin, coalesce(p_data, '{}'::jsonb))
      returning updated_at into v_ts;
      return jsonb_build_object('pin', v_pin, 'updated_at', v_ts);
    exception when unique_violation then
      v_tries := v_tries + 1;
      if v_tries > 25 then
        raise exception 'Could not allocate a PIN, please try again';
      end if;
    end;
  end loop;
end;
$$;

-- Fetch an account's data by PIN (returns null if the PIN does not exist).
create or replace function public.get_profile(p_pin text)
returns jsonb
language sql
security definer
set search_path = public
as $$
  select jsonb_build_object('data', p.data, 'updated_at', p.updated_at)
  from public.user_profiles p
  where p.pin = p_pin;
$$;

-- Overwrite an account's data by PIN.
create or replace function public.save_profile(p_pin text, p_data jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_ts timestamptz;
begin
  update public.user_profiles
     set data = coalesce(p_data, '{}'::jsonb), updated_at = now()
   where pin = p_pin
  returning updated_at into v_ts;

  if v_ts is null then
    raise exception 'Unknown PIN';
  end if;
  return jsonb_build_object('updated_at', v_ts);
end;
$$;

revoke all on function public.create_profile(jsonb)      from public;
revoke all on function public.get_profile(text)          from public;
revoke all on function public.save_profile(text, jsonb)  from public;
grant execute on function public.create_profile(jsonb)     to anon, authenticated;
grant execute on function public.get_profile(text)         to anon, authenticated;
grant execute on function public.save_profile(text, jsonb) to anon, authenticated;
