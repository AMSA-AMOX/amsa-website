-- get_network_profile: expose the member's resolved college (Users.college_unitid,
-- written by src/lib/user-denorm.ts) as `collegeId` so the profile page can link
-- the school logo to /dashboard/research/college/<unitid>. Otherwise identical
-- to the 20260913_0002_rpc.sql definition.

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
      'collegeId', u.college_unitid,
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
