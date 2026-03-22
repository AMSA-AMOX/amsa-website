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
    const { data: experiences, error } = await supabase
      .from("Experiences")
      .select("*")
      .eq("userId", payload.id)
      .order("currentlyWorking", { ascending: false })
      .order("startYear", { ascending: false })
      .order("startMonth", { ascending: false });

    if (error) throw error;
    return NextResponse.json({ experiences });
  } catch (e: any) {
    console.error(e);
    return NextResponse.json({ message: "Failed to load experiences" }, { status: 500 });
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
    const { jobTitle, company, employmentType, startMonth, startYear, endMonth, endYear, currentlyWorking, location, description } = body;

    if (!jobTitle || !company || !startMonth || !startYear) {
      return NextResponse.json({ message: "Job title, company, start month, and start year are required" }, { status: 400 });
    }

    const { data: experience, error } = await supabase
      .from("Experiences")
      .insert({
        userId: payload.id,
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
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json({ experience }, { status: 201 });
  } catch (e: any) {
    console.error(e);
    return NextResponse.json({ message: "Failed to create experience" }, { status: 500 });
  }
}
