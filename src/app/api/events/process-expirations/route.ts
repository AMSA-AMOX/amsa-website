import { NextResponse } from "next/server";

export async function POST(request: Request) {
  void request;
  return NextResponse.json(
    {
      message:
        "Automatic expiration is disabled. Payments are manually verified by admins.",
      processed: 0,
      promoted: 0,
      disabled: true,
    },
    { status: 200 }
  );
}
