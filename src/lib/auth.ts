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

export function makeToken(user: { id: number; role: string }): string {
  return jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, {
    expiresIn: "7d",
  });
}

export const isAmsaAdminEmail = (email: string): boolean =>
  email?.toLowerCase().endsWith("@amsa.mn");
