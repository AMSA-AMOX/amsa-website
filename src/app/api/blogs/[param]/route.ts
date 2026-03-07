import { NextResponse } from "next/server";
import slugify from "slugify";
import { supabase } from "@/lib/supabase";
import { verifyToken, assertRole } from "@/lib/auth";

// GET /api/blogs/:slug
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ param: string }> }
) {
  const { param } = await params;
  try {
    const { data: blog, error } = await supabase
      .from("website_blogs")
      .select("*, Users(id, firstName, lastName, email)")
      .eq("slug", param)
      .single();

    if (error || !blog) {
      return NextResponse.json({ message: "Not found" }, { status: 404 });
    }
    return NextResponse.json({ blog });
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { message: "Failed to load blog" },
      { status: 500 }
    );
  }
}

// PUT /api/blogs/:id
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ param: string }> }
) {
  const { param } = await params;
  let userPayload;
  try {
    userPayload = verifyToken(request);
    assertRole(userPayload, "admin");
  } catch (res) {
    return res as NextResponse;
  }

  try {
    const body = await request.json();
    const data: Record<string, unknown> = { ...body };

    if (data.title) {
      const newSlug = slugify(data.title as string, { lower: true, strict: true });
      const { data: other } = await supabase
        .from("website_blogs")
        .select("id")
        .eq("slug", newSlug)
        .neq("id", Number(param))
        .single();

      if (other) {
        return NextResponse.json(
          { message: "Another blog already has this title" },
          { status: 409 }
        );
      }
      data.slug = newSlug;
    }

    const { data: blog, error } = await supabase
      .from("website_blogs")
      .update(data)
      .eq("id", Number(param))
      .select()
      .single();

    if (error || !blog) {
      return NextResponse.json({ message: "Not found" }, { status: 404 });
    }
    return NextResponse.json({ blog });
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { message: "Failed to update blog" },
      { status: 500 }
    );
  }
}

// DELETE /api/blogs/:id
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ param: string }> }
) {
  const { param } = await params;
  let userPayload;
  try {
    userPayload = verifyToken(request);
    assertRole(userPayload, "admin");
  } catch (res) {
    return res as NextResponse;
  }

  try {
    const { error } = await supabase
      .from("website_blogs")
      .delete()
      .eq("id", Number(param));

    if (error) {
      return NextResponse.json({ message: "Not found" }, { status: 404 });
    }
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { message: "Failed to delete blog" },
      { status: 500 }
    );
  }
}
