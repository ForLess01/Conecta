import { NextResponse } from "next/server";
import { AdminAuthorizationError } from "./auth";

export function adminErrorResponse(error: unknown) {
  if (error instanceof AdminAuthorizationError) {
    return NextResponse.json({ error: "Supabase ADMIN role required." }, { status: 403 });
  }
  return NextResponse.json(
    { error: error instanceof Error ? error.message : "Administrative operation failed." },
    { status: 500 },
  );
}
