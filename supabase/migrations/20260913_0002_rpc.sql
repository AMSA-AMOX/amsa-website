-- "One round trip per page": SQL functions that return the exact JSON shape
-- the API routes used to assemble from 5–10 sequential PostgREST calls.
-- Called via supabase.rpc(...) from src/lib/rpc.ts.
--
-- All functions are STABLE / SECURITY INVOKER. Tables are currently readable
-- by the anon role (no RLS), so no grants are needed. When RLS is enabled
-- (deferred hardening), switch the server to a service-role client and
-- `revoke execute on function public.get_* from anon`.
--
-- Apply in the Supabase SQL editor. Safe to re-run (create or replace).

set search_path = public;

-- Cheap liveness probe used by /api/health?db=1
create or replace function public.ping() returns integer
language sql stable as $$ select 1 $$;

-- "telmen@terpmail.umd.edu" → "umd.edu"; null when there is no .edu address.
-- Used as a fallback for Users.logo_domain so logos never depend on the
-- write-time backfill having run.
create or replace function public.edu_root_domain(p_email text) returns text
language sql immutable as $$
  select case
    when p_email ~* '@([a-z0-9-]+\.)*[a-z0-9-]+\.edu$'
      then lower(substring(p_email from '([a-z0-9-]+\.edu)$'))
    else null end;
$$;

-- ---------------------------------------------------------------------------
-- get_shell: everything the dashboard chrome needs (sidebar badges, banner)
-- in one call. Replaces 4–5 list fetches that were only used for counts.
-- ---------------------------------------------------------------------------
create or replace function public.get_shell(
  p_user_id    bigint,
  p_role       text,
  p_seen_after timestamptz default null
) returns jsonb
language sql stable as $$
  with can_answer as (select p_role in ('ambassador','us_member','board_member','admin') as ok),
       is_mod     as (select p_role in ('admin','board_member') as ok),
       -- Mirrors the sources (and per-source limits) of get_notifications so
       -- the unseen count matches what the notifications page shows.
       recent as (
         select "createdAt" as at from "Users" where id = p_user_id
         union all (select "createdAt" from follows where "followingId" = p_user_id order by "createdAt" desc limit 20)
         union all (select "createdAt" from "Events" order by "createdAt" desc limit 20)
         union all (select "answeredAt" from "Threads" where "askerId" = p_user_id and answer is not null order by "answeredAt" desc limit 10)
         union all (select t."createdAt" from "Threads" t, can_answer where can_answer.ok and t."recipientId" = p_user_id and t.answer is null order by t."createdAt" desc limit 10)
         union all (select r."createdAt" from "PostReports" r, is_mod where is_mod.ok order by r."createdAt" desc limit 20)
       )
  select jsonb_build_object(
    'membershipStatus',    (select review_status from amsa_memberships where user_id = p_user_id),
    'unseenNotifications', (select count(*) from (select at from recent order by at desc limit 30) n
                              where n.at > coalesce(p_seen_after, '-infinity'::timestamptz)),
    'pending', jsonb_build_object(
      'posts',        case when (select ok from is_mod) then (select count(*) from "Posts" where "reviewStatus" = 'pending') else 0 end,
      'threads',      case when (select ok from is_mod) then (select count(*) from "HubThreads" where status = 'pending') else 0 end,
      'verification', case when p_role = 'admin'       then (select count(*) from amsa_memberships where review_status = 'pending') else 0 end
    )
  );
$$;

-- ---------------------------------------------------------------------------
-- get_notifications: the notifications feed (same shape as the old route).
-- ---------------------------------------------------------------------------
create or replace function public.get_notifications(
  p_user_id bigint,
  p_role    text
) returns jsonb
language sql stable as $$
  with can_answer as (select p_role in ('ambassador','us_member','board_member','admin') as ok),
       is_mod     as (select p_role in ('admin','board_member') as ok),
       items as (
         -- welcome
         select u."createdAt" as at, jsonb_build_object(
           'id', 'welcome-' || u.id, 'type', 'welcome',
           'title', trim('Welcome to AMSA, ' || coalesce(u."firstName", '') || '!'),
           'description', 'Your account is all set. Explore the network and connect with other Mongolian students.',
           'happenedAt', u."createdAt", 'href', '/dashboard/feed') as item
         from "Users" u where u.id = p_user_id
         union all
         -- new followers
         (select f."createdAt", jsonb_build_object(
           'id', 'follow-' || f."followerId" || '-' || f."createdAt", 'type', 'follow',
           'title', 'New follower',
           'description', coalesce(nullif(trim(coalesce(a."firstName",'') || ' ' || coalesce(a."lastName",'')), ''), 'Someone') || ' followed you.',
           'happenedAt', f."createdAt",
           'href', case when a.role in ('ambassador','us_member','board_member','admin') then '/dashboard/network/' || a.id end,
           'avatarUrl', a."profilePic")
         from follows f join "Users" a on a.id = f."followerId"
         where f."followingId" = p_user_id order by f."createdAt" desc limit 20)
         union all
         -- events
         (select e."createdAt", jsonb_build_object(
           'id', 'event-' || e.id, 'type', 'event', 'title', 'Event update',
           'description', coalesce(e.title, 'Untitled event') || ' is available in Events.',
           'happenedAt', coalesce(e."createdAt", e."startAt"), 'href', '/dashboard/events')
         from "Events" e order by e."createdAt" desc limit 20)
         union all
         -- questions asked to me (ambassador+)
         (select t."createdAt", jsonb_build_object(
           'id', 'thread-' || t.id, 'type', 'thread_question', 'title', 'New question',
           'description', coalesce(nullif(trim(coalesce(a."firstName",'') || ' ' || coalesce(a."lastName",'')), ''), 'Someone') || ' asked you a question.',
           'happenedAt', t."createdAt", 'href', '/welcome?threads=unanswered', 'avatarUrl', a."profilePic")
         from "Threads" t left join "Users" a on a.id = t."askerId", can_answer
         where can_answer.ok and t."recipientId" = p_user_id and t.answer is null
         order by t."createdAt" desc limit 10)
         union all
         -- my questions that got answered
         (select t."answeredAt", jsonb_build_object(
           'id', 'thread-answered-' || t.id, 'type', 'thread_answered', 'title', 'Question answered',
           'description', case when coalesce(t."isAnonymous", false) then 'Someone answered your question.'
                               else coalesce(nullif(trim(coalesce(r."firstName",'') || ' ' || coalesce(r."lastName",'')), ''), 'Someone') || ' answered your question.' end,
           'happenedAt', t."answeredAt", 'href', '/dashboard/inbox',
           'avatarUrl', case when coalesce(t."isAnonymous", false) then null else r."profilePic" end)
         from "Threads" t left join "Users" r on r.id = t."recipientId"
         where t."askerId" = p_user_id and t.answer is not null
         order by t."answeredAt" desc limit 10)
         union all
         -- post reports (moderators)
         (select pr."createdAt", jsonb_build_object(
           'id', 'post-report-' || pr.id, 'type', 'post_report', 'title', 'Post reported',
           'description', coalesce(nullif(trim(coalesce(a."firstName",'') || ' ' || coalesce(a."lastName",'')), ''), 'Someone') || ' reported a post.',
           'happenedAt', pr."createdAt", 'href', '/dashboard/feed?reportedPostId=' || pr."postId", 'avatarUrl', a."profilePic")
         from "PostReports" pr left join "Users" a on a.id = pr."reporterId", is_mod
         where is_mod.ok order by pr."createdAt" desc limit 20)
       )
  select jsonb_build_object('notifications', coalesce(
    (select jsonb_agg(item order by at desc) from (select * from items order by at desc nulls last limit 30) top),
    '[]'::jsonb));
$$;

-- ---------------------------------------------------------------------------
-- get_network_members: discovery + search with follower/mutual counts and
-- the same ranking as src/lib/network-users.ts, all in one query.
-- ---------------------------------------------------------------------------
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

-- ---------------------------------------------------------------------------
-- get_network_profile: a member's public profile page in one call.
-- ---------------------------------------------------------------------------
create or replace function public.get_network_profile(
  p_viewer_id bigint,
  p_target_id bigint
) returns jsonb
language sql stable as $$
  with u as (select * from "Users" where id = p_target_id),
       pool as (select e.value as m from jsonb_array_elements(public.get_network_members(p_viewer_id, null, 60)) e
                where (e.value->>'id')::bigint <> p_target_id),
       ranked as (
         select m,
           (m->>'mutualCount')::int * 100
           + case when nullif(lower(trim(u."schoolName")), '') is not null and lower(trim(m->>'schoolName')) = lower(trim(u."schoolName")) then 50 else 0 end
           + case when nullif(trim(u."graduationYear"), '') is not null and trim(m->>'graduationYear') = trim(u."graduationYear") then 30 else 0 end
           + (m->>'followersCount')::int as rank_score,
           (m->>'mutualCount')::int as mutual, (m->>'followersCount')::int as followers
         from pool, u
       )
  select case when not exists (select 1 from u) then null else jsonb_build_object(
    'user', (select jsonb_build_object(
      'id', u.id, 'firstName', coalesce(u."firstName",''), 'lastName', coalesce(u."lastName",''),
      'role', case when u.role = 'admin' then 'us_member' else coalesce(u.role, 'member') end,
      'roles', case when u.role = 'admin' then '["us_member"]'::jsonb when coalesce(u.role,'member') <> 'member' then jsonb_build_array(u.role) else '[]'::jsonb end,
      'profilePic', u."profilePic", 'bio', u.bio, 'schoolName', u."schoolName", 'schoolEmail', u."schoolEmail",
      'major', u.major, 'degreeLevel', u."degreeLevel", 'schoolYear', u."schoolYear", 'graduationYear', u."graduationYear",
      'linkedin', u.linkedin, 'instagram', u.instagram, 'facebook', u.facebook, 'x', u.x,
      'logoDomain', coalesce(u.logo_domain, public.edu_root_domain(u."schoolEmail")),
      'followersCount', (select count(*) from follows where "followingId" = p_target_id),
      'followingCount', (select count(*) from follows where "followerId" = p_target_id),
      'isFollowing', exists(select 1 from follows where "followerId" = p_viewer_id and "followingId" = p_target_id)
    ) from u),
    'experiences', coalesce((select jsonb_agg(to_jsonb(e) order by e."currentlyWorking" desc, e."startYear" desc, e."startMonth" desc)
                             from "Experiences" e where e."userId" = p_target_id), '[]'::jsonb),
    'nextProfiles', coalesce((select jsonb_agg(m order by rank_score desc, mutual desc, followers desc)
                              from (select * from ranked order by rank_score desc, mutual desc, followers desc limit 8) r), '[]'::jsonb)
  ) end;
$$;

-- ---------------------------------------------------------------------------
-- get_events_with_counts: events list with seat/waitlist counts and the
-- caller's own reservation, without loading every reservation row.
-- ---------------------------------------------------------------------------
create or replace function public.get_events_with_counts(p_user_id bigint) returns jsonb
language sql stable as $$
  select coalesce(jsonb_agg(ev order by ev->>'startAt'), '[]'::jsonb) from (
    select to_jsonb(e)
      || jsonb_build_object(
        'EventImages', coalesce((select jsonb_agg(jsonb_build_object('id', i.id, 'imageUrl', i."imageUrl", 'sortOrder', i."sortOrder") order by i."sortOrder")
                                 from "EventImages" i where i."eventId" = e.id), '[]'::jsonb),
        'Users', (select jsonb_build_object('id', c.id, 'firstName', c."firstName", 'lastName', c."lastName") from "Users" c where c.id = e."createdBy"),
        'seatsRemaining', greatest(0, e."totalSeats" - (select count(*) from "EventReservations" r where r."eventId" = e.id and r.status in ('reserved','paid'))),
        'waitlistCount', (select count(*) from "EventReservations" r where r."eventId" = e.id and r.status = 'waitlisted'),
        'myReservation', (select jsonb_build_object(
            'status', r.status, 'waitlistPosition', r."waitlistPosition", 'paymentDueAt', r."paymentDueAt", 'paymentStatus', r."paymentStatus",
            'hasPaymentWindow', (r.status = 'reserved' and r."paymentStatus" <> 'paid' and r."paymentDueAt" is not null),
            'paymentWindowHours', 24)
          from "EventReservations" r where r."eventId" = e.id and r."userId" = p_user_id and r.status in ('reserved','paid','waitlisted')
          order by r."createdAt" desc limit 1)
      ) as ev
    from "Events" e
  ) x;
$$;

-- ---------------------------------------------------------------------------
-- appreciate_post: atomic "helpful" — insert, recount, bump author tokens.
-- Returns {status: 'ok'|'not_found'|'not_approved'|'already', appreciationCount}
-- ---------------------------------------------------------------------------
create or replace function public.appreciate_post(p_post_id bigint, p_user_id bigint) returns jsonb
language plpgsql volatile as $$
declare
  v_post   record;
  v_count  integer;
begin
  select id, "reviewStatus", "userId" into v_post from "Posts" where id = p_post_id;
  if not found then return jsonb_build_object('status', 'not_found'); end if;
  if v_post."reviewStatus" <> 'approved' then return jsonb_build_object('status', 'not_approved'); end if;

  insert into "PostHelpfuls" ("postId", "userId") values (p_post_id, p_user_id)
  on conflict ("postId", "userId") do nothing;
  if not found then
    select count(*) into v_count from "PostHelpfuls" where "postId" = p_post_id;
    return jsonb_build_object('status', 'already', 'appreciationCount', v_count);
  end if;

  select count(*) into v_count from "PostHelpfuls" where "postId" = p_post_id;
  update "Posts" set "helpfulCount" = v_count where id = p_post_id;
  if v_post."userId" is not null then
    update "Users" set "appreciationTokens" = coalesce("appreciationTokens", 0) + 1 where id = v_post."userId";
  end if;
  return jsonb_build_object('status', 'ok', 'appreciationCount', v_count);
end;
$$;

-- ---------------------------------------------------------------------------
-- get_state_student_counts: {"MD": 12, "CA": 30, ...} from the denormalized column.
-- ---------------------------------------------------------------------------
create or replace function public.get_state_student_counts() returns jsonb
language sql stable as $$
  select coalesce(jsonb_object_agg(state_abbr, n), '{}'::jsonb)
  from (select state_abbr, count(*) as n from "Users" where state_abbr is not null group by state_abbr) s;
$$;
