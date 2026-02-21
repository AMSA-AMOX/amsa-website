import { NextResponse } from "next/server";
import { Op } from "sequelize";
import slugify from "slugify";
import { getDb } from "@/lib/db";
import { verifyToken, assertRole } from "@/lib/auth";

// GET /api/blogs/:slug
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ param: string }> }
) {
  const { param } = await params;
  try {
    const { Blog, User } = await getDb();
    const blog = await Blog.findOne({
      where: { slug: param },
      include: [
        {
          model: User,
          attributes: ["id", "firstName", "lastName", "eduEmail"],
        },
      ],
    });
    if (!blog) {
      return NextResponse.json({ message: "Not found" }, { status: 404 });
    }
    return NextResponse.json({ blog });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ message: "Failed to load blog" }, { status: 500 });
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
    const id = Number(param);
    if (isNaN(id)) {
      return NextResponse.json({ message: "Invalid id" }, { status: 400 });
    }

    const { Blog } = await getDb();
    const blog = await Blog.findByPk(id);
    if (!blog) {
      return NextResponse.json({ message: "Not found" }, { status: 404 });
    }

    const body = await request.json();
    const data: Record<string, unknown> = { ...body };

    if (data.title) {
      data.slug = slugify(data.title as string, { lower: true, strict: true });
      const other = await Blog.findOne({
        where: {
          slug: data.slug,
          id: { [Op.ne]: id },
        },
      });
      if (other) {
        return NextResponse.json(
          { message: "Another blog already has this title" },
          { status: 409 }
        );
      }
    }

    await (blog as any).update(data);
    return NextResponse.json({ blog });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ message: "Failed to update blog" }, { status: 500 });
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
    const id = Number(param);
    if (isNaN(id)) {
      return NextResponse.json({ message: "Invalid id" }, { status: 400 });
    }

    const { Blog } = await getDb();
    const blog = await Blog.findByPk(id);
    if (!blog) {
      return NextResponse.json({ message: "Not found" }, { status: 404 });
    }

    await (blog as any).destroy();
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ message: "Failed to delete blog" }, { status: 500 });
  }
}
