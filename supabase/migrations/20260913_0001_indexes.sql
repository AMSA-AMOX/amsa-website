-- Indexes for the hot predicates used by the API routes and RPC functions,
-- plus write-time denormalized columns on "Users" so college/state lookups
-- become single indexed queries instead of full scans filtered in JS.
--
-- Apply in the Supabase SQL editor (or `supabase db push`). Safe to re-run.

create extension if not exists pg_trgm;

-- Users ---------------------------------------------------------------------
alter table "Users" add column if not exists college_unitid integer references colleges_base(unitid);
alter table "Users" add column if not exists state_abbr    char(2);
alter table "Users" add column if not exists logo_domain   text;

create index if not exists users_role_created_idx  on "Users"(role, "createdAt" desc);
create index if not exists users_college_idx       on "Users"(college_unitid) where college_unitid is not null;
create index if not exists users_state_abbr_idx    on "Users"(state_abbr)     where state_abbr is not null;
create index if not exists users_email_idx         on "Users"(email);

-- follows -------------------------------------------------------------------
create unique index if not exists follows_pair_idx  on follows("followerId", "followingId");
create index if not exists follows_following_idx    on follows("followingId", "createdAt" desc);

-- Threads (Q&A) -------------------------------------------------------------
create index if not exists threads_recipient_open_idx on "Threads"("recipientId", "createdAt" desc) where answer is null;
create index if not exists threads_asker_answered_idx on "Threads"("askerId", "answeredAt" desc)    where answer is not null;

-- Posts ---------------------------------------------------------------------
create index if not exists posts_review_created_idx on "Posts"("reviewStatus", "createdAt" desc);
create index if not exists posts_user_created_idx   on "Posts"("userId", "createdAt" desc);
create unique index if not exists post_helpfuls_pair_idx on "PostHelpfuls"("postId", "userId");
create index if not exists post_reports_created_idx on "PostReports"("createdAt" desc);

-- Hub threads ---------------------------------------------------------------
create index if not exists hub_threads_status_approved_idx on "HubThreads"(status, "approvedAt" desc);
create index if not exists hub_comments_thread_idx         on "HubComments"("threadId", "createdAt");
create unique index if not exists hub_thread_upvotes_pair_idx  on "HubThreadUpvotes"("threadId", "userId");
create unique index if not exists hub_comment_upvotes_pair_idx on "HubCommentUpvotes"("commentId", "userId");

-- Events --------------------------------------------------------------------
create index if not exists events_start_idx               on "Events"("startAt");
create index if not exists reservations_event_status_idx  on "EventReservations"("eventId", status);
create index if not exists reservations_user_idx          on "EventReservations"("userId", "eventId");

-- Memberships ---------------------------------------------------------------
create unique index if not exists memberships_user_idx   on amsa_memberships(user_id);
create index if not exists memberships_status_idx        on amsa_memberships(review_status);

-- Colleges (ilike matching in college-match.ts) -----------------------------
create index if not exists colleges_name_trgm_idx on colleges_base using gin (name gin_trgm_ops);
create index if not exists colleges_url_trgm_idx  on colleges_base using gin (school_url gin_trgm_ops);
