import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { verifyToken } from "@/lib/auth";
import { getFollowsTableName } from "@/lib/follows-table";

type NotificationItem = {
  id: string;
  type: "follow" | "event";
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
            const canOpenProfile = ["us_member", "board_member", "admin"].includes(actor.role ?? "");
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
