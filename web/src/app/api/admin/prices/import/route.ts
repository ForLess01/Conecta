import { NextResponse } from "next/server";
import { adminErrorResponse } from "@/lib/server/admin/http";
import { importPriceCsv } from "@/lib/server/pricing/observations";

export async function POST(request: Request) {
  try {
    const contentType = request.headers.get("content-type") ?? "";
    if (!contentType.startsWith("text/csv")) return NextResponse.json({ error: "Expected text/csv." }, { status: 415 });
    const csv = await request.text();
    if (new TextEncoder().encode(csv).byteLength > 1_000_000) return NextResponse.json({ error: "CSV is too large." }, { status: 413 });
    return NextResponse.json({ imported: await importPriceCsv(csv) });
  } catch (error) {
    return adminErrorResponse(error);
  }
}
