import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { verifyToken } from "@/lib/auth";
import { getFollowsTableName } from "@/lib/follows-table";
import { listNetworkMembersForUser } from "@/lib/network-users";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(request: Request, { params }: RouteContext) {
  let payload;
  try {
    payload = verifyToken(request);
  } catch (res) {
    return res as NextResponse;
  }

  try {
    const { id } = await params;
    const targetId = Number(id);
    if (!Number.isFinite(targetId)) {
      return NextResponse.json({ message: "Invalid member id" }, { status: 400 });
    }

    const { data: user, error } = await supabase
      .from("Users")
      .select(
        "id, firstName, lastName, role, profilePic, bio, schoolName, major, degreeLevel, schoolYear, graduationYear, linkedin, instagram, facebook, x"
      )
      .eq("id", targetId)
      .single();

    if (error || !user) {
      return NextResponse.json({ message: "Member not found" }, { status: 404 });
    }

    if (!["us_member", "board_member", "admin"].includes(user.role)) {
      return NextResponse.json({ message: "Member not found" }, { status: 404 });
    }

    const { data: experiences, error: experienceError } = await supabase
      .from("Experiences")
      .select("*")
      .eq("userId", targetId)
      .order("currentlyWorking", { ascending: false })
      .order("startYear", { ascending: false })
      .order("startMonth", { ascending: false });

    if (experienceError) {
      console.error("Network profile experience fetch error:", experienceError);
    }

    let followersCount = 0;
    let followingCount = 0;
    let isFollowing = false;

    try {
      const followsTable = await getFollowsTableName();
      const [followersRes, followingRes, isFollowingRes] = await Promise.all([
        supabase.from(followsTable).select("id", { count: "exact", head: true }).eq("followingId", targetId),
        supabase.from(followsTable).select("id", { count: "exact", head: true }).eq("followerId", targetId),
        supabase
          .from(followsTable)
          .select("id", { count: "exact", head: true })
          .eq("followerId", payload.id)
          .eq("followingId", targetId),
      ]);

      followersCount = followersRes.count ?? 0;
      followingCount = followingRes.count ?? 0;
      isFollowing = (isFollowingRes.count ?? 0) > 0;
    } catch (error: any) {
      if (error?.code !== "PGRST205") {
        throw error;
      }
    }

    const targetSchool = (user.schoolName ?? "").trim().toLowerCase();
    const targetYear = (user.graduationYear ?? "").trim();

    const nextProfilesRaw = await listNetworkMembersForUser(payload.id, { limit: 60 });
    const nextProfiles = nextProfilesRaw
      .filter((member) => member.id !== targetId)
      .map((member) => {
        const sameSchool =
          !!targetSchool &&
          (member.schoolName ?? "").trim().toLowerCase() === targetSchool;
        const sameYear = !!targetYear && (member.graduationYear ?? "").trim() === targetYear;
        const rankScore =
          member.mutualCount * 100 +
          (sameSchool ? 50 : 0) +
          (sameYear ? 30 : 0) +
          member.followersCount;
        return { ...member, sameSchool, sameYear, rankScore };
      })
      .sort(
        (a, b) =>
          b.rankScore - a.rankScore ||
          b.mutualCount - a.mutualCount ||
          b.followersCount - a.followersCount
      )
      .slice(0, 8)
      .map(({ rankScore: _rankScore, ...member }) => member);

    return NextResponse.json({
      user: {
        id: user.id,
        firstName: user.firstName ?? "",
        lastName: user.lastName ?? "",
        profilePic: user.profilePic,
        bio: user.bio,
        schoolName: user.schoolName,
        major: user.major,
        degreeLevel: user.degreeLevel,
        schoolYear: user.schoolYear,
        graduationYear: user.graduationYear,
        linkedin: user.linkedin,
        instagram: user.instagram,
        facebook: user.facebook,
        x: user.x,
        followersCount,
        followingCount,
        isFollowing,
      },
      experiences: experiences ?? [],
      nextProfiles,
    });
  } catch (e) {
    console.error("Network profile fetch error:", e);
    return NextResponse.json({ message: "Failed to load member profile" }, { status: 500 });
  }
}
