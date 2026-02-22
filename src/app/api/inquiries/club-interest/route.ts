import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      firstName,
      lastName,
      email,
      phone,
      clubName,
      universityName,
      clubType,
      memberCount,
      supportTypes,
      fundraisingIdea,
      timeline,
      fundraisedBefore,
      hearAbout,
      amsaMembers,
      interestedInChapter,
    } = body;

    if (
      !firstName || !lastName || !email || !phone ||
      !clubName || !universityName || !clubType || !memberCount ||
      !fundraisingIdea || !timeline || !fundraisedBefore ||
      !hearAbout || !amsaMembers || !interestedInChapter
    ) {
      return NextResponse.json({ message: "Missing required fields" }, { status: 400 });
    }
    if (!Array.isArray(supportTypes) || supportTypes.length === 0) {
      return NextResponse.json({ message: "At least one support type is required" }, { status: 400 });
    }

    // Log for now — wire to DB or email service as needed
    console.log("[Club Interest]", {
      ...body,
      submittedAt: new Date().toISOString(),
    });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
