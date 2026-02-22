import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, firstName, lastName, orgName, orgWebsite, partnershipTypes, description } = body;

    if (!email || !firstName || !lastName || !orgName || !orgWebsite || !description) {
      return NextResponse.json({ message: "Missing required fields" }, { status: 400 });
    }
    if (!Array.isArray(partnershipTypes) || partnershipTypes.length === 0) {
      return NextResponse.json({ message: "At least one partnership type is required" }, { status: 400 });
    }

    // Log for now — wire to DB or email service as needed
    console.log("[Partnership Inquiry]", {
      email,
      firstName,
      lastName,
      orgName,
      orgWebsite,
      partnershipTypes,
      description,
      additionalInfo: body.additionalInfo ?? "",
      submittedAt: new Date().toISOString(),
    });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
