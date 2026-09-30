-- delete_user_account: hard-deletes a member and everything they own in one
-- call, so DELETE /api/user/account is atomic — it never leaves half a user
-- behind or trips a foreign key partway through. Leaf tables go first.
--
-- Content other members attached to the user's content goes too (answers on
-- their hub questions, replies to their comments, votes on their posts): with
-- the parent gone those rows would be orphans either way.
--
-- Admins are refused by the API route, not here: their events are org content
-- (POST /api/events is admin-only), so "Events" is deliberately untouched.
-- Storage objects (avatar, post images) are not touched here either — the
-- route removes the avatar via the storage API after this succeeds.
--
-- Apply in the Supabase SQL editor. Safe to re-run (create or replace).

set search_path = public;

create or replace function public.delete_user_account(p_user_id bigint)
returns boolean
language plpgsql volatile as $$
begin
  if not exists (select 1 from "Users" where id = p_user_id) then
    return false;
  end if;

  -- Hub (Q&A): the user's questions, their comments, replies to those
  -- comments, and every vote on any of it. Replies are one level deep
  -- (parentId must be a top-level comment), so one pass covers them.
  delete from "HubCommentUpvotes"
  where "userId" = p_user_id
     or "commentId" in (
       select c.id from "HubComments" c
       where c."authorId" = p_user_id
          or c."threadId" in (select id from "HubThreads" where "askerId" = p_user_id)
          or c."parentId" in (select id from "HubComments" where "authorId" = p_user_id));

  delete from "HubComments" c
  where c."authorId" = p_user_id
     or c."threadId" in (select id from "HubThreads" where "askerId" = p_user_id)
     or c."parentId" in (select id from "HubComments" where "authorId" = p_user_id);

  delete from "HubThreadUpvotes"
  where "userId" = p_user_id
     or "threadId" in (select id from "HubThreads" where "askerId" = p_user_id);

  delete from "HubThreads" where "askerId" = p_user_id;

  -- Feed posts and the votes/reports on them.
  delete from "PostHelpfuls"
  where "userId" = p_user_id
     or "postId" in (select id from "Posts" where "userId" = p_user_id);

  delete from "PostReports"
  where "reporterId" = p_user_id
     or "postId" in (select id from "Posts" where "userId" = p_user_id);

  delete from "Posts" where "userId" = p_user_id;

  -- Direct questions to ambassadors, whichever side the user was on.
  delete from "Threads" where "askerId" = p_user_id or "recipientId" = p_user_id;

  -- Event reservations and the emails logged for them.
  delete from "EventEmails" where "userId" = p_user_id;
  delete from "EventReservations" where "userId" = p_user_id;

  -- Reviews they wrote, and their id in other reviews' helpful votes.
  delete from place_reviews where user_id = p_user_id;
  delete from college_reviews where user_id = p_user_id;

  update place_reviews
     set helpful_user_ids = (select coalesce(array_agg(x), '{}') from unnest(helpful_user_ids) x where x <> p_user_id)
   where p_user_id = any(helpful_user_ids);

  update college_reviews
     set helpful_user_ids = (select coalesce(array_agg(x), '{}') from unnest(helpful_user_ids) x where x <> p_user_id)
   where p_user_id = any(helpful_user_ids);

  -- Profile-owned rows.
  delete from "Education"      where "userId" = p_user_id;
  delete from "Experiences"    where "userId" = p_user_id;
  delete from "ShopRedemptions" where "userId" = p_user_id;
  delete from amsa_memberships where user_id = p_user_id;
  delete from follows          where "followerId" = p_user_id or "followingId" = p_user_id;

  delete from "Users" where id = p_user_id;
  return true;
end;
$$;
