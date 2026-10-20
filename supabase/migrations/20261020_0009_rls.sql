-- Close the database to the public anon key.
--
-- The anon key ships in the website's JavaScript and in the iOS app, so anyone
-- has it. No table had row level security, and Supabase grants the anon role
-- everything in public by default, so that key could read every table
-- (including Users' emails and password hashes), write to them, and call
-- every function here (delete_user_account with any id, for one).
--
-- After this:
--   * Every table in public has RLS on and no policies, so the anon and
--     authenticated roles see no rows. The website server uses the
--     service-role key (src/lib/supabase-admin.ts), which bypasses RLS. The site has
--     its own login (Users + JWT), not Supabase Auth, so there is nothing for
--     per-user policies to check: every table read and write goes through /api.
--   * anon and authenticated lose their grants on tables, views, sequences and
--     functions in public, now and for objects postgres creates later.
--   * Storage is untouched: the website and the iOS app still upload to the
--     avatars / post-images / event-images buckets with the anon key, under
--     the storage.objects policies set in the dashboard.
--
-- New tables: enable RLS in the migration that creates them. New functions:
-- PostgreSQL still grants EXECUTE to PUBLIC by default, so add
-- `revoke execute on function ... from public, anon, authenticated;`.
--
-- Apply AFTER deploying the website code that uses SUPABASE_SERVICE_ROLE_KEY:
-- the older code reads tables with the anon key and stops working once this
-- runs. Safe to re-run.

set search_path = public;

do $$
declare
  t record;
begin
  for t in
    select c.relname
    from pg_class c
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public' and c.relkind in ('r', 'p')
  loop
    execute format('alter table public.%I enable row level security', t.relname);
  end loop;
end;
$$;

revoke all on all tables in schema public from anon, authenticated;
revoke all on all sequences in schema public from anon, authenticated;
revoke execute on all functions in schema public from public, anon, authenticated;

grant all on all tables in schema public to service_role;
grant all on all sequences in schema public to service_role;
grant execute on all functions in schema public to service_role;

alter default privileges in schema public revoke all on tables from anon, authenticated;
alter default privileges in schema public revoke all on sequences from anon, authenticated;
alter default privileges in schema public revoke execute on functions from anon, authenticated;
