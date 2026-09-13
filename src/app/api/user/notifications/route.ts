import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { verifyToken } from "@/lib/auth";
import { getFollowsTableName } from "@/lib/follows-table";

type NotificationItem = {
  id: string;
  type: "follow" | "event" | "thread_question" | "thread_answered" | "welcome" | "post_report";
  title: string;
  description: string;
  happenedAt: string;
  href?: string;
  avatarUrl?: string | null;
};

type FollowRow = { followerId: number; createdAt?: string | null };
type UserRow = {
  id: number;
  firstName: string | null;
  lastName: string | null;
  profilePic: string | null;
  role: string | null;
};
type EventRow = { id: number; title: string | null; startAt: string | null; createdAt: string | null };
type QuestionRow = { id: number; askerId: number; question: string; createdAt: string };
type AnsweredRow = { id: number; recipientId: number; answeredAt: string; isAnonymous: boolean | null };
type ReportRow = { id: number; postId: number; reporterId: number; createdAt: string };

const NETWORK_ROLES = ["ambassador", "us_member", "board_member", "admin"];
const MOD_ROLES = ["admin", "board_member"];

const fullName = (u: UserRow | undefined) =>
  (u ? `${u.firstName ?? ""} ${u.lastName ?? ""}`.trim() : "") || "Someone";

/** Followers, tolerating a follows table without a createdAt column. */
async function loadFollowers(userId: number): Promise<FollowRow[]> {
  try {
    const table = await getFollowsTableName();
    const withCreatedAt = await supabase
      .from(table)
      .select("followerId, createdAt")
      .eq("followingId", userId)
      .order("createdAt", { ascending: false })
      .limit(20);
    if (!withCreatedAt.error) return (withCreatedAt.data ?? []) as FollowRow[];
    if (!String(withCreatedAt.error.message || "").toLowerCase().includes("createdat")) return [];
    const plain = await supabase.from(table).select("followerId").eq("followingId", userId).limit(20);
    return (plain.data ?? []) as FollowRow[];
  } catch (e: any) {
    if (e?.code !== "PGRST205") console.error("Notifications follow feed error:", e);
    return [];
  }
}

export async function GET(request: Request) {
  let payload;
  try {
    payload = verifyToken(request);
  } catch (res) {
    return res as NextResponse;
  }

  const role = payload.role ?? "";
  const canAnswer = NETWORK_ROLES.includes(role);
  const isMod = MOD_ROLES.includes(role);

  try {
    // Wave 1: every source is independent — fetch them all at once.
    const [me, followRows, events, questions, answered, reports] = await Promise.all([
      supabase.from("Users").select("firstName, createdAt").eq("id", payload.id).maybeSingle(),
      loadFollowers(payload.id),
      supabase.from("Events").select("id, title, startAt, createdAt").order("createdAt", { ascending: false }).limit(20),
      canAnswer
        ? supabase
            .from("Threads")
            .select("id, askerId, question, createdAt")
            .eq("recipientId", payload.id)
            .is("answer", null)
            .order("createdAt", { ascending: false })
            .limit(10)
        : Promise.resolve({ data: [] as QuestionRow[], error: null }),
      supabase
        .from("Threads")
        .select("id, recipientId, answeredAt, isAnonymous")
        .eq("askerId", payload.id)
        .not("answer", "is", null)
        .order("answeredAt", { ascending: false })
        .limit(10),
      isMod
        ? supabase.from("PostReports").select("id, postId, reporterId, createdAt").order("createdAt", { ascending: false }).limit(20)
        : Promise.resolve({ data: [] as ReportRow[], error: null }),
    ]);

    const questionRows = (questions.data ?? []) as QuestionRow[];
    const answeredRows = (answered.data ?? []) as AnsweredRow[];
    const reportRows = (reports.data ?? []) as ReportRow[];
    if (events.error) console.error("Notifications events feed error:", events.error);

    // Wave 2: one Users lookup for every actor referenced above.
    const actorIds = new Set<number>();
    followRows.forEach((r) => actorIds.add(r.followerId));
    questionRows.forEach((r) => actorIds.add(r.askerId));
    answeredRows.filter((r) => !r.isAnonymous).forEach((r) => actorIds.add(r.recipientId));
    reportRows.forEach((r) => actorIds.add(r.reporterId));

    const userById = new Map<number, UserRow>();
    if (actorIds.size > 0) {
      const { data: users } = await supabase
        .from("Users")
        .select("id, firstName, lastName, profilePic, role")
        .in("id", Array.from(actorIds));
      (users ?? []).forEach((u: any) => userById.set(u.id, u as UserRow));
    }

    const notifications: NotificationItem[] = [];

    if (me.data?.createdAt) {
      notifications.push({
        id: `welcome-${payload.id}`,
        type: "welcome",
        title: `Welcome to AMSA, ${me.data.firstName ?? ""}!`.trim(),
        description: "Your account is all set. Explore the network and connect with other Mongolian students.",
        happenedAt: me.data.createdAt,
        href: "/dashboard/feed",
      });
    }

    for (const row of followRows) {
      const actor = userById.get(row.followerId);
      if (!actor) continue;
      const canOpenProfile = NETWORK_ROLES.includes(actor.role ?? "");
      notifications.push({
        id: `follow-${row.followerId}-${row.createdAt ?? "na"}`,
        type: "follow",
        title: "New follower",
        description: `${fullName(actor)} followed you.`,
        happenedAt: row.createdAt ?? new Date(0).toISOString(),
        href: canOpenProfile ? `/dashboard/network/${row.followerId}` : undefined,
        avatarUrl: actor.profilePic,
      });
    }

    for (const event of (events.data ?? []) as EventRow[]) {
      notifications.push({
        id: `event-${event.id}`,
        type: "event",
        title: "Event update",
        description: `${event.title ?? "Untitled event"} is available in Events.`,
        happenedAt: event.createdAt ?? event.startAt ?? new Date(0).toISOString(),
        href: "/dashboard/events",
      });
    }

    for (const row of questionRows) {
      const asker = userById.get(row.askerId);
      notifications.push({
        id: `thread-${row.id}`,
        type: "thread_question",
        title: "New question",
        description: `${fullName(asker)} asked you a question.`,
        happenedAt: row.createdAt,
        href: "/welcome?threads=unanswered",
        avatarUrl: asker?.profilePic ?? null,
      });
    }

    for (const row of answeredRows) {
      const isAnon = row.isAnonymous ?? false;
      const recipient = isAnon ? undefined : userById.get(row.recipientId);
      notifications.push({
        id: `thread-answered-${row.id}`,
        type: "thread_answered",
        title: "Question answered",
        description: isAnon ? "Someone answered your question." : `${fullName(recipient)} answered your question.`,
        happenedAt: row.answeredAt,
        href: "/dashboard/inbox",
        avatarUrl: isAnon ? null : (recipient?.profilePic ?? null),
      });
    }

    for (const report of reportRows) {
      const reporter = userById.get(report.reporterId);
      notifications.push({
        id: `post-report-${report.id}`,
        type: "post_report",
        title: "Post reported",
        description: `${fullName(reporter)} reported a post.`,
        happenedAt: report.createdAt,
        href: `/dashboard/feed?reportedPostId=${report.postId}`,
        avatarUrl: reporter?.profilePic ?? null,
      });
    }

    notifications.sort((a, b) => new Date(b.happenedAt).getTime() - new Date(a.happenedAt).getTime());

    return NextResponse.json({ notifications: notifications.slice(0, 30) });
  } catch (e: any) {
    console.error("GET /api/user/notifications failed:", e);
    return NextResponse.json({ notifications: [] }, { status: 500 });
  }
}
