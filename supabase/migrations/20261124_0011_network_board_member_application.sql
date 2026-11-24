-- Board members appear in the network only once their US Member Application
-- is approved. They get the board_member role from their @amsa.mn email
-- (src/app/api/auth/signup, src/app/api/auth/login) and nothing makes them
-- submit the application, so without this a board member with an empty
-- profile shows up in the network like a verified member.
--
-- Redefines get_network_members (the Network page list and search). It also
-- covers get_network_profile's "next profiles", which calls it. The function is
-- otherwise unchanged from 20261002_0007_safety.sql. Their profile page itself
-- stays reachable, the same as members who aren't in the network.
--
-- Apply in the Supabase SQL editor. Safe to re-run. It takes effect as soon as
-- it runs; no website deploy is needed.

set search_path = public;

create or replace function public.get_network_members(
  p_viewer_id bigint,
  p_query     text default null,
  p_limit     integer default 24
) returns jsonb
language sql stable as $$
  with q as (
    select nullif(trim(regexp_replace(lower(coalesce(p_query, '')), '[^a-z0-9\s]', ' ', 'g')), '') as text
  ),
  tokens as (
    select t from q, regexp_split_to_table(q.text, '\s+') t where q.text is not null and t <> ''
  ),
  viewer_following as (select "followingId" as id from follows where "followerId" = p_viewer_id),
  cand as (
    select u.id, coalesce(u."firstName", '') as "firstName", coalesce(u."lastName", '') as "lastName",
           u."profilePic", u."schoolName", u."graduationYear", coalesce(u.role, 'member') as role,
           coalesce(u.logo_domain, public.edu_root_domain(u."schoolEmail")) as logo_domain,
           lower(regexp_replace(coalesce(u."firstName",'') || ' ' || coalesce(u."lastName",''), '[^a-z0-9\s]', ' ', 'gi')) as full_n,
           lower(regexp_replace(coalesce(u."firstName",''), '[^a-z0-9\s]', ' ', 'gi')) as first_n,
           lower(regexp_replace(coalesce(u."lastName",''),  '[^a-z0-9\s]', ' ', 'gi')) as last_n,
           lower(regexp_replace(coalesce(u."schoolName",''),'[^a-z0-9\s]', ' ', 'gi')) as school_n,
           (select count(*) from follows f where f."followingId" = u.id)::int as followers_count,
           (select count(*) from follows f where f."followerId"  = u.id)::int as following_count,
           (select count(*) from follows f join viewer_following v on v.id = f."followingId" where f."followerId" = u.id)::int as mutual_count,
           exists(select 1 from viewer_following v where v.id = u.id) as is_following,
           u."createdAt"
    from "Users" u, q
    where u.role in ('ambassador','us_member','board_member','admin','alum')
      and u.id <> p_viewer_id
      -- board members only with an approved US Member Application
      and (u.role <> 'board_member'
           or exists (select 1 from amsa_memberships m
                      where m.user_id = u.id and m.review_status = 'approved'))
      and not exists (select 1 from "UserBlocks" b
                      where (b."blockerId" = p_viewer_id and b."blockedId" = u.id)
                         or (b."blockerId" = u.id and b."blockedId" = p_viewer_id))
      and (q.text is null
           or (coalesce(u."firstName",'') || ' ' || coalesce(u."lastName",'') || ' ' || coalesce(u."schoolName",'')) ilike '%' || q.text || '%'
           or exists (select 1 from tokens t where (coalesce(u."firstName",'') || ' ' || coalesce(u."lastName",'') || ' ' || coalesce(u."schoolName",'')) ilike '%' || t.t || '%'))
  ),
  scored as (
    select c.*,
      case when q.text is null then 0 else
        (case when c.full_n = q.text then 220 else 0 end)
      + (case when c.full_n like q.text || '%' then 120 else 0 end)
      + (case when c.school_n like q.text || '%' then 80 else 0 end)
      + (case when c.school_n like '%' || q.text || '%' then 36 else 0 end)
      + coalesce((select sum(
            (case when c.first_n like t.t || '%' then 55 else 0 end)
          + (case when c.last_n  like t.t || '%' then 55 else 0 end)
          + (case when c.full_n  like '%' || t.t || '%' then 24 else 0 end)
          + (case when c.school_n like '%' || t.t || '%' then 22 else 0 end)) from tokens t), 0)
      + (case when c.role = 'ambassador' then 40 else 0 end)
      + least(c.followers_count, 15)
      + least(c.mutual_count * 3, 30)
      end as score
    from cand c, q
  )
  -- p_query given but nothing searchable in it → no results (matches the old JS).
  select coalesce(jsonb_agg(jsonb_build_object(
    'id', s.id, 'firstName', s."firstName", 'lastName', s."lastName", 'profilePic', s."profilePic",
    'schoolName', s."schoolName", 'graduationYear', s."graduationYear", 'role', s.role,
    'logoDomain', s.logo_domain,
    'followersCount', s.followers_count, 'followingCount', s.following_count,
    'mutualCount', s.mutual_count, 'isFollowing', s.is_following
  ) order by
      case when p_query is null then (s.role = 'ambassador')::int else s.score end desc,
      s.mutual_count desc, s.followers_count desc, s."firstName" asc), '[]'::jsonb)
  from (
    select * from scored s
    where p_query is null or s.score > 0
    order by case when p_query is null then (s.role = 'ambassador')::int else s.score end desc,
             s.mutual_count desc, s.followers_count desc, s."firstName" asc
    limit greatest(1, least(coalesce(p_limit, 24), 120))
  ) s;
$$;

-- create or replace keeps the existing grants; repeated per 20261020_0009_rls.sql.
revoke execute on function public.get_network_members(bigint, text, integer) from public, anon, authenticated;
