import { NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";
import { rpc } from "@/lib/rpc";
import type { SearchableMember } from "@/lib/network-users";

type RouteContext = {
  params: Promise<{ id: string }>;
};

type NetworkProfile = {
  user: {
    id: number;
    firstName: string;
    lastName: string;
    role: string;
    roles: string[];
    profilePic: string | null;
    bio: string | null;
    schoolName: string | null;
    schoolEmail: string | null;
    major: string | null;
    degreeLevel: string | null;
    schoolYear: string | null;
    graduationYear: string | null;
    linkedin: string | null;
    instagram: string | null;
    facebook: string | null;
    x: string | null;
    logoDomain: string | null;
    followersCount: number;
    followingCount: number;
    isFollowing: boolean;
  };
  experiences: unknown[];
  nextProfiles: SearchableMember[];
};

/**
 * One round trip: `get_network_profile` returns the member, their
 * experiences, follow counts and 8 ranked "next profiles" (it used to be ~9
 * sequential queries).
 */
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

    const profile = await rpc<NetworkProfile | null>("get_network_profile", {
      p_viewer_id: payload.id,
      p_target_id: targetId,
    });

    if (!profile) {
      return NextResponse.json({ message: "Member not found" }, { status: 404 });
    }

    return NextResponse.json(profile);
  } catch (e) {
    console.error("Network profile fetch error:", e);
    return NextResponse.json({ message: "Failed to load member profile" }, { status: 500 });
  }
}
