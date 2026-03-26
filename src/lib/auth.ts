import "server-only";
import jwt from "jsonwebtoken";
import { NextResponse } from "next/server";

const JWT_SECRET = process.env.JWT_SECRET || "dev-secret";

export type JwtPayload = { id: number; role: string; iat?: number; exp?: number };

export function verifyToken(request: Request): JwtPayload {
  const authHeader = request.headers.get("authorization") || "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;
  if (!token) {
    throw NextResponse.json({ message: "No token" }, { status: 401 });
  }
  try {
    return jwt.verify(token, JWT_SECRET) as JwtPayload;
  } catch {
    throw NextResponse.json({ message: "Invalid token" }, { status: 401 });
  }
}

export function assertRole(payload: JwtPayload, role: string): void {
  if (payload.role !== role) {
    throw NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }
}

/**
 * Allows both "admin" and "board_member" roles to create/edit/delete content.
 */
export function assertContentCreator(payload: JwtPayload): void {
  if (payload.role !== "admin" && payload.role !== "board_member") {
    throw NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }
}

export function makeToken(user: { id: number; role: string }): string {
  return jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, {
    expiresIn: "7d",
  });
}

export const isAmsaAdminEmail = (email: string): boolean =>
  email?.toLowerCase().endsWith("@amsa.mn");

export const ROLES = {
  ADMIN: "admin",
  BOARD_MEMBER: "board_member",
  US_MEMBER: "us_member",
  MEMBER: "member",
} as const;

export function getRoleLabel(role: string): string {
  switch (role) {
    case ROLES.ADMIN:
      return "Admin";
    case ROLES.BOARD_MEMBER:
      return "Board Member";
    case ROLES.US_MEMBER:
      return "US Member";
    default:
      return "Member";
  }
}
