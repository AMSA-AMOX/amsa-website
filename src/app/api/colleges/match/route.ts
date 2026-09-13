import { NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";
import { verifySchoolEmail } from "@/lib/college-match";

/**
 * GET /api/colleges/match?email=…&name=…
 * Live check used by forms: does this .edu email belong to the named college?
 */
export async function GET(request: Request) {
  try {
    verifyToken(request);
  } catch (res) {
    return res as NextResponse;
  }

  const { searchParams } = new URL(request.url);
  const email = searchParams.get("email")?.trim().toLowerCase() ?? "";
  const name = searchParams.get("name")?.trim() ?? "";

  if (!email.includes("@")) {
    return NextResponse.json({ status: "unknown", college: null });
  }

  const result = await verifySchoolEmail(email, name || null);
  return NextResponse.json(result);
}
