import { NextResponse } from "next/server";
import { getAdminContext } from "@/lib/server/admin/auth";
import { adminErrorResponse } from "@/lib/server/admin/http";

export async function POST() {
  try {
    const { userId } = await getAdminContext();
    return NextResponse.json(
      { authenticated: true, userId },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    return adminErrorResponse(error);
  }
}

export async function DELETE() {
  return NextResponse.json(
    { authenticated: false },
    { headers: { "Cache-Control": "no-store" } },
  );
}
