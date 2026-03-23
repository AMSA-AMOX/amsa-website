import "server-only";
import { supabase } from "@/lib/supabase";
import { getFollowsTableName } from "@/lib/follows-table";

type BaseUserRow = {
  id: number;
  firstName: string | null;
  lastName: string | null;
  profilePic: string | null;
  schoolName: string | null;
  graduationYear: string | null;
};

type SearchableMember = {
  id: number;
  firstName: string;
  lastName: string;
  profilePic: string | null;
  schoolName: string | null;
  graduationYear: string | null;
  followersCount: number;
  followingCount: number;
  mutualCount: number;
  isFollowing: boolean;
};

const normalize = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const scoreMember = (member: SearchableMember, query: string) => {
  if (!query) return 0;

  const q = normalize(query);
  if (!q) return 0;

  const fullName = normalize(`${member.firstName} ${member.lastName}`);
  const first = normalize(member.firstName);
  const last = normalize(member.lastName);
  const school = normalize(member.schoolName ?? "");
  const tokens = q.split(" ").filter(Boolean);

  let score = 0;
  if (fullName === q) score += 220;
  if (fullName.startsWith(q)) score += 120;
  if (school.startsWith(q)) score += 80;
  if (school.includes(q)) score += 36;

  for (const token of tokens) {
    if (first.startsWith(token)) score += 55;
    if (last.startsWith(token)) score += 55;
    if (fullName.includes(token)) score += 24;
    if (school.includes(token)) score += 22;
  }

  // Slightly prioritize active members in discovery.
  score += Math.min(member.followersCount, 15);
  score += Math.min(member.mutualCount * 3, 30);

  return score;
};

const clampLimit = (input: number | undefined, fallback = 24) =>
  Math.min(120, Math.max(1, Number.isFinite(input) ? Math.floor(input as number) : fallback));

export async function listNetworkMembersForUser(
  userId: number,
  options?: { query?: string; limit?: number }
): Promise<SearchableMember[]> {
  const q = options?.query?.trim() ?? "";
  const limit = clampLimit(options?.limit, q ? 60 : 24);

  const candidateLimit = q ? Math.max(120, limit * 3) : limit;
  let usersQuery = supabase
    .from("Users")
    .select("id, firstName, lastName, profilePic, schoolName, graduationYear")
    .eq("acceptanceStatus", "approved")
    .neq("id", userId)
    .limit(candidateLimit);

  if (!q) {
    usersQuery = usersQuery.order("createdAt", { ascending: false });
  }

  const { data, error } = await usersQuery;
  if (error) throw error;

  const users = (data ?? []) as BaseUserRow[];
  const zeroEnriched: SearchableMember[] = users.map((member) => ({
    id: member.id,
    firstName: member.firstName ?? "",
    lastName: member.lastName ?? "",
    profilePic: member.profilePic,
    schoolName: member.schoolName,
    graduationYear: member.graduationYear,
    followersCount: 0,
    followingCount: 0,
    mutualCount: 0,
    isFollowing: false,
  }));

  const memberIds = users.map((u) => u.id);
  if (memberIds.length === 0) return [];

  let enriched = zeroEnriched;

  try {
    const followsTable = await getFollowsTableName();
    const [followingData, followersRowsRes, followingRowsRes] = await Promise.all([
      supabase.from(followsTable).select("followingId").eq("followerId", userId),
      supabase.from(followsTable).select("followingId").in("followingId", memberIds),
      supabase.from(followsTable).select("followerId").in("followerId", memberIds),
    ]);

    if (followingData.error) throw followingData.error;
    if (followersRowsRes.error) throw followersRowsRes.error;
    if (followingRowsRes.error) throw followingRowsRes.error;

    const followingSet = new Set<number>(
      (followingData.data ?? []).map((row) => Number(row.followingId)).filter(Number.isFinite)
    );

    const mutualRowsRes = followingSet.size
      ? await supabase
          .from(followsTable)
          .select("followerId")
          .in("followerId", memberIds)
          .in("followingId", Array.from(followingSet))
      : { data: [], error: null };

    if (mutualRowsRes.error) throw mutualRowsRes.error;

    const followersByUser = (followersRowsRes.data ?? []).reduce((acc, row) => {
      const id = Number(row.followingId);
      acc.set(id, (acc.get(id) ?? 0) + 1);
      return acc;
    }, new Map<number, number>());

    const followingByUser = (followingRowsRes.data ?? []).reduce((acc, row) => {
      const id = Number(row.followerId);
      acc.set(id, (acc.get(id) ?? 0) + 1);
      return acc;
    }, new Map<number, number>());

    const mutualByUser = (mutualRowsRes.data ?? []).reduce((acc, row) => {
      const id = Number(row.followerId);
      acc.set(id, (acc.get(id) ?? 0) + 1);
      return acc;
    }, new Map<number, number>());

    enriched = users.map((member) => ({
      id: member.id,
      firstName: member.firstName ?? "",
      lastName: member.lastName ?? "",
      profilePic: member.profilePic,
      schoolName: member.schoolName,
      graduationYear: member.graduationYear,
      followersCount: followersByUser.get(member.id) ?? 0,
      followingCount: followingByUser.get(member.id) ?? 0,
      mutualCount: mutualByUser.get(member.id) ?? 0,
      isFollowing: followingSet.has(member.id),
    }));
  } catch (error: any) {
    if (error?.code !== "PGRST205") {
      throw error;
    }
  }

  if (!q) {
    return enriched
      .sort(
        (a, b) =>
          b.mutualCount - a.mutualCount ||
          b.followersCount - a.followersCount ||
          a.firstName.localeCompare(b.firstName)
      )
      .slice(0, limit);
  }

  const scored = enriched
    .map((member) => ({ member, score: scoreMember(member, q) }))
    .filter((entry) => entry.score > 0)
    .sort(
      (a, b) =>
        b.score - a.score ||
        b.member.mutualCount - a.member.mutualCount ||
        b.member.followersCount - a.member.followersCount
    )
    .slice(0, limit)
    .map((entry) => entry.member);

  return scored;
}
