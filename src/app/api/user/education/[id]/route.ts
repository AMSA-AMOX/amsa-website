import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { verifyToken } from "@/lib/auth";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  let payload;
  try {
    payload = verifyToken(request);
  } catch (res) {
    return res as NextResponse;
  }

  const { id: rawId } = await params;
  const id = parseInt(rawId, 10);
  if (isNaN(id)) return NextResponse.json({ message: "Invalid id" }, { status: 400 });

  try {
    const body = await request.json();
    const { schoolName, degreeLevel, major, schoolYear, graduationYear, currentlyEnrolled } = body;

    if (!schoolName) {
      return NextResponse.json({ message: "School name is required" }, { status: 400 });
    }

    const { data: education, error } = await supabase
      .from("Education")
      .update({
        schoolName,
        degreeLevel: degreeLevel || null,
        major: major || null,
        schoolYear: schoolYear || null,
        graduationYear: currentlyEnrolled ? null : (graduationYear || null),
        currentlyEnrolled: !!currentlyEnrolled,
      })
      .eq("id", id)
      .eq("userId", payload.id)
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json({ education });
  } catch (e: any) {
    console.error(e);
    return NextResponse.json({ message: "Failed to update education entry" }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  let payload;
  try {
    payload = verifyToken(request);
  } catch (res) {
    return res as NextResponse;
  }

  const { id: rawId } = await params;
  const id = parseInt(rawId, 10);
  if (isNaN(id)) return NextResponse.json({ message: "Invalid id" }, { status: 400 });

  try {
    const { error } = await supabase
      .from("Education")
      .delete()
      .eq("id", id)
      .eq("userId", payload.id);

    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (e: any) {
    console.error(e);
    return NextResponse.json({ message: "Failed to delete education entry" }, { status: 500 });
  }
}
