import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { getDb } from "@/lib/db";
import { makeToken, isAmsaAdminEmail } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { message: "Missing email or password" },
        { status: 400 }
      );
    }

    const normalizedEmail = email.toLowerCase().trim();
    const { User } = await getDb();

    const user = await User.findOne({
      where: { eduEmail: normalizedEmail },
      attributes: ["id", "eduEmail", "password", "role", "firstName", "lastName"],
    });

    if (!user) {
      return NextResponse.json(
        { message: "Invalid email or password" },
        { status: 401 }
      );
    }

    const match = await bcrypt.compare(password, (user as any).password);
    if (!match) {
      return NextResponse.json(
        { message: "Invalid email or password" },
        { status: 401 }
      );
    }

    // Auto-upgrade AMSA email users to admin
    if (isAmsaAdminEmail((user as any).eduEmail) && (user as any).role !== "admin") {
      (user as any).role = "admin";
      await (user as any).save();
    }

    const token = makeToken({ id: (user as any).id, role: (user as any).role });

    return NextResponse.json({
      message: "Login successful",
      user: {
        id: (user as any).id,
        email: (user as any).eduEmail,
        role: (user as any).role,
        firstName: (user as any).firstName,
        lastName: (user as any).lastName,
      },
      token,
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ message: "Login failed" }, { status: 500 });
  }
}
