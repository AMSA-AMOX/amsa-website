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

  try {
    const { id } = await params;
    const body = await request.json();
    const { jobTitle, company, employmentType, startMonth, startYear, endMonth, endYear, currentlyWorking, location, description } = body;

    if (!jobTitle || !company || !startMonth || !startYear) {
      return NextResponse.json({ message: "Job title, company, start month, and start year are required" }, { status: 400 });
    }

    const { data: experience, error } = await supabase
      .from("Experiences")
      .update({
        jobTitle,
        company,
        employmentType: employmentType || null,
        startMonth,
        startYear,
        endMonth: currentlyWorking ? null : (endMonth || null),
        endYear: currentlyWorking ? null : (endYear || null),
        currentlyWorking: !!currentlyWorking,
        location: location || null,
        description: description || null,
      })
      .eq("id", id)
      .eq("userId", payload.id)
      .select()
      .single();

    if (error) throw error;
    if (!experience) return NextResponse.json({ message: "Not found" }, { status: 404 });

    return NextResponse.json({ experience });
  } catch (e: any) {
    console.error(e);
    return NextResponse.json({ message: "Failed to update experience" }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  let payload;
  try {
    payload = verifyToken(request);
  } catch (res) {
    return res as NextResponse;
  }

  try {
    const { id } = await params;

    const { error } = await supabase
      .from("Experiences")
      .delete()
      .eq("id", id)
      .eq("userId", payload.id);

    if (error) throw error;
    return NextResponse.json({ message: "Deleted" });
  } catch (e: any) {
    console.error(e);
    return NextResponse.json({ message: "Failed to delete experience" }, { status: 500 });
  }
}
