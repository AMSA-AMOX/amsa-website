-- Members can send direct questions to alums, and alums answer them like
-- ambassadors and US members do (src/app/api/threads). This adds 'alum' to the
-- roles that get "New question" items in the notifications list and the unseen
-- count. It also links a follower who is an alum to their profile, which is in
-- the network like the other non-member roles. The functions are otherwise
-- unchanged from 20261002_0007_safety.sql.
--
-- Apply in the Supabase SQL editor. Safe to re-run. The API change works
-- without it: until it's applied, alums get the push but no "New question"
-- item in Notifications.

set search_path = public;

create or replace function public.get_shell(
  p_user_id    bigint,
  p_role       text,
  p_seen_after timestamptz default null
) returns jsonb
language sql stable as $$
  with can_answer as (select p_role in ('ambassador','us_member','alum','board_member','admin') as ok),
       is_mod     as (select p_role in ('admin','board_member') as ok),
       -- Mirrors the sources (and per-source limits) of get_notifications so
       -- the unseen count matches what the notifications page shows.
       recent as (
         select "createdAt" as at from "Users" where id = p_user_id
         union all (select "createdAt" from follows where "followingId" = p_user_id order by "createdAt" desc limit 20)
         union all (select "createdAt" from "Events" order by "createdAt" desc limit 20)
         union all (select "answeredAt" from "Threads" where "askerId" = p_user_id and answer is not null order by "answeredAt" desc limit 10)
         union all (select t."createdAt" from "Threads" t, can_answer where can_answer.ok and t."recipientId" = p_user_id and t.answer is null order by t."createdAt" desc limit 10)
         union all (select r."createdAt" from "ContentReports" r, is_mod where is_mod.ok and r.status = 'open' order by r."createdAt" desc limit 20)
       )
  select jsonb_build_object(
    'membershipStatus',    (select review_status from amsa_memberships where user_id = p_user_id),
    'unseenNotifications', (select count(*) from (select at from recent order by at desc limit 30) n
                              where n.at > coalesce(p_seen_after, '-infinity'::timestamptz)),
    'pending', jsonb_build_object(
      'posts',        case when (select ok from is_mod) then (select count(*) from "Posts" where "reviewStatus" = 'pending') else 0 end,
      'threads',      case when (select ok from is_mod) then (select count(*) from "HubThreads" where status = 'pending') else 0 end,
      'verification', case when p_role = 'admin'       then (select count(*) from amsa_memberships where review_status = 'pending') else 0 end,
      'reports',      case when (select ok from is_mod) then (select count(*) from "ContentReports" where status = 'open') else 0 end
    )
  );
$$;

-- ---------------------------------------------------------------------------
-- get_notifications: post-report items replaced by open reports on any content.
-- ---------------------------------------------------------------------------
create or replace function public.get_notifications(
  p_user_id bigint,
  p_role    text
) returns jsonb
language sql stable as $$
  with can_answer as (select p_role in ('ambassador','us_member','alum','board_member','admin') as ok),
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
           'href', case when a.role in ('ambassador','us_member','alum','board_member','admin') then '/dashboard/network/' || a.id end,
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
         -- questions asked to me (ambassador+, alum)
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
         -- open reports on any content (moderators)
         (select r."createdAt", jsonb_build_object(
           'id', 'report-' || r.id, 'type', 'content_report', 'title', 'Content reported',
           'description', coalesce(nullif(trim(coalesce(a."firstName",'') || ' ' || coalesce(a."lastName",'')), ''), 'Someone')
                          || ' reported ' || case r."targetType"
                               when 'post' then 'a post' when 'hub_thread' then 'a thread' when 'hub_comment' then 'a comment'
                               when 'college_review' then 'a college review' when 'place_review' then 'a place review'
                               when 'question' then 'a question' else 'a member' end || '.',
           'happenedAt', r."createdAt", 'href', '/dashboard/admin/reports', 'avatarUrl', a."profilePic")
         from "ContentReports" r left join "Users" a on a.id = r."reporterId", is_mod
         where is_mod.ok and r.status = 'open' order by r."createdAt" desc limit 20)
       )
  select jsonb_build_object('notifications', coalesce(
    (select jsonb_agg(item order by at desc) from (select * from items order by at desc nulls last limit 30) top),
    '[]'::jsonb));
$$;
