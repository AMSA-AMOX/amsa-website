import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { verifyToken } from "@/lib/auth";
import { getFollowsTableName } from "@/lib/follows-table";

type NotificationItem = {
  id: string;
  type: "follow" | "event" | "thread_question" | "thread_answered" | "welcome";
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

export async function GET(request: Request) {
  let payload;
  try {
    payload = verifyToken(request);
  } catch (res) {
    return res as NextResponse;
  }

  try {
    const notifications: NotificationItem[] = [];

    // Fetch current user info for welcome notification
    const { data: currentUser } = await supabase
      .from("Users")
      .select("firstName, createdAt")
      .eq("id", payload.id)
      .single();

    if (currentUser?.createdAt) {
      notifications.push({
        id: `welcome-${payload.id}`,
        type: "welcome",
        title: `Welcome to AMSA, ${currentUser.firstName ?? ""}!`.trim(),
        description: "Your account is all set. Explore the network and connect with other Mongolian students.",
        happenedAt: currentUser.createdAt,
        href: "/dashboard/feed",
      });
    }

    try {
      const followsTable = await getFollowsTableName();
      const withCreatedAt = await supabase
        .from(followsTable)
        .select("followerId, createdAt")
        .eq("followingId", payload.id)
        .order("createdAt", { ascending: false })
        .limit(20);

      // Fallback when createdAt does not exist on follows table.
      const followersQuery =
        withCreatedAt.error && String(withCreatedAt.error.message || "").toLowerCase().includes("createdat")
          ? await supabase
          .from(followsTable)
          .select("followerId")
          .eq("followingId", payload.id)
          .limit(20)
          : withCreatedAt;

      if (!followersQuery.error) {
        const followRows = (followersQuery.data ?? []) as Array<{ followerId: number; createdAt?: string | null }>;
        const followerIds = Array.from(new Set(followRows.map((row) => row.followerId)));
        if (followerIds.length > 0) {
          const { data: users } = await supabase
            .from("Users")
            .select("id, firstName, lastName, profilePic, role")
            .in("id", followerIds);

          const userById = new Map<number, UserRow>((users ?? []).map((u: any) => [u.id, u as UserRow]));

          for (const row of followRows) {
            const actor = userById.get(row.followerId);
            if (!actor) continue;
            const fullName = `${actor.firstName ?? ""} ${actor.lastName ?? ""}`.trim() || "Someone";
            const canOpenProfile = ["ambassador", "us_member", "board_member", "admin"].includes(actor.role ?? "");
            notifications.push({
              id: `follow-${row.followerId}-${row.createdAt ?? "na"}`,
              type: "follow",
              title: "New follower",
              description: `${fullName} followed you.`,
              happenedAt: row.createdAt ?? new Date(0).toISOString(),
              href: canOpenProfile ? `/dashboard/network/${row.followerId}` : undefined,
              avatarUrl: actor.profilePic,
            });
          }
        }
      }
    } catch (e: any) {
      if (e?.code !== "PGRST205") {
        console.error("Notifications follow feed error:", e);
      }
    }

    const { data: events, error: eventsError } = await supabase
      .from("Events")
      .select("id, title, startAt, createdAt")
      .order("createdAt", { ascending: false })
      .limit(20);

    if (!eventsError) {
      for (const event of (events ?? []) as EventRow[]) {
        notifications.push({
          id: `event-${event.id}`,
          type: "event",
          title: "Event update",
          description: `${event.title ?? "Untitled event"} is available in Events.`,
          happenedAt: event.createdAt ?? event.startAt ?? new Date(0).toISOString(),
          href: "/dashboard/events",
        });
      }
    } else {
      console.error("Notifications events feed error:", eventsError);
    }

    // Thread question notifications (for ambassador+ only)
    if (["ambassador", "us_member", "board_member", "admin"].includes(payload.role ?? "")) {
      try {
        const { data: threadRows, error: threadError } = await supabase
          .from("Threads")
          .select("id, askerId, question, createdAt")
          .eq("recipientId", payload.id)
          .is("answer", null)
          .order("createdAt", { ascending: false })
          .limit(10);

        if (!threadError && threadRows && threadRows.length > 0) {
          const askerIds = Array.from(new Set((threadRows as any[]).map((r) => r.askerId)));
          const { data: askers } = await supabase
            .from("Users")
            .select("id, firstName, lastName, profilePic")
            .in("id", askerIds);

          const askerById = new Map<number, UserRow>(
            ((askers ?? []) as any[]).map((u) => [u.id, u as UserRow])
          );

          for (const row of threadRows as any[]) {
            const asker = askerById.get(row.askerId);
            const name = asker
              ? `${asker.firstName ?? ""} ${asker.lastName ?? ""}`.trim() || "Someone"
              : "Someone";
            notifications.push({
              id: `thread-${row.id}`,
              type: "thread_question",
              title: "New question",
              description: `${name} asked you a question.`,
              happenedAt: row.createdAt,
              href: "/welcome?threads=unanswered",
              avatarUrl: asker?.profilePic ?? null,
            });
          }
        }
      } catch (e) {
        console.error("Notifications thread question feed error:", e);
      }
    }

    // Thread answered notifications (for askers whose questions got answered)
    try {
      const { data: answeredRows, error: answeredError } = await supabase
        .from("Threads")
        .select("id, recipientId, answeredAt, isAnonymous")
        .eq("askerId", payload.id)
        .not("answer", "is", null)
        .order("answeredAt", { ascending: false })
        .limit(10);

      if (!answeredError && answeredRows && answeredRows.length > 0) {
        const nonAnonRows = (answeredRows as any[]).filter((r) => !r.isAnonymous);
        const recipientIds = Array.from(new Set(nonAnonRows.map((r) => r.recipientId)));

        const recipientById = new Map<number, UserRow>();
        if (recipientIds.length > 0) {
          const { data: recipients } = await supabase
            .from("Users")
            .select("id, firstName, lastName, profilePic")
            .in("id", recipientIds);
          ((recipients ?? []) as any[]).forEach((u) => recipientById.set(u.id, u as UserRow));
        }

        for (const row of answeredRows as any[]) {
          const isAnon = row.isAnonymous ?? false;
          const recipient = isAnon ? null : recipientById.get(row.recipientId);
          const name = recipient
            ? `${recipient.firstName ?? ""} ${recipient.lastName ?? ""}`.trim() || "Someone"
            : "Someone";
          notifications.push({
            id: `thread-answered-${row.id}`,
            type: "thread_answered",
            title: "Question answered",
            description: isAnon ? "Someone answered your question." : `${name} answered your question.`,
            happenedAt: row.answeredAt,
            href: "/dashboard/inbox",
            avatarUrl: isAnon ? null : (recipient?.profilePic ?? null),
          });
        }
      }
    } catch (e) {
      console.error("Notifications thread answered feed error:", e);
    }

    notifications.sort((a, b) => {
      const aTime = new Date(a.happenedAt).getTime();
      const bTime = new Date(b.happenedAt).getTime();
      return bTime - aTime;
    });

    return NextResponse.json({ notifications: notifications.slice(0, 30) });
  } catch (e: any) {
    console.error("GET /api/user/notifications failed:", e);
    return NextResponse.json({ notifications: [] }, { status: 500 });
  }
}
