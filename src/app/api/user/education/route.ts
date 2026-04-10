import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { verifyToken } from "@/lib/auth";

export async function GET(request: Request) {
  let payload;
  try {
    payload = verifyToken(request);
  } catch (res) {
    return res as NextResponse;
  }

  try {
    const { data: educations, error } = await supabase
      .from("Education")
      .select("*")
      .eq("userId", payload.id)
      .order("currentlyEnrolled", { ascending: false })
      .order("graduationYear", { ascending: false });

    if (error) throw error;
    return NextResponse.json({ educations });
  } catch (e: any) {
    console.error(e);
    return NextResponse.json({ message: "Failed to load education" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  let payload;
  try {
    payload = verifyToken(request);
  } catch (res) {
    return res as NextResponse;
  }

  try {
    const body = await request.json();
    const { schoolName, degreeLevel, major, schoolYear, graduationYear, currentlyEnrolled } = body;

    if (!schoolName) {
      return NextResponse.json({ message: "School name is required" }, { status: 400 });
    }

    const { data: education, error } = await supabase
      .from("Education")
      .insert({
        userId: payload.id,
        schoolName,
        degreeLevel: degreeLevel || null,
        major: major || null,
        schoolYear: schoolYear || null,
        graduationYear: currentlyEnrolled ? null : (graduationYear || null),
        currentlyEnrolled: !!currentlyEnrolled,
      })
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json({ education }, { status: 201 });
  } catch (e: any) {
    console.error(e);
    return NextResponse.json({ message: "Failed to create education entry" }, { status: 500 });
  }
}
