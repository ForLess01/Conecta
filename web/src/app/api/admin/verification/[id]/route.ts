import { NextResponse } from "next/server";
import { z } from "zod";
import { adminErrorResponse } from "@/lib/server/admin/http";
import { reviewVerification } from "@/lib/server/admin/data";

const schema = z.strictObject({
  status: z.enum(["NEEDS_INFO", "APPROVED", "REJECTED"]),
  notes: z.string().trim().max(1_000).optional(),
}).refine((value) => value.status === "APPROVED" || Boolean(value.notes), {
  message: "Review notes are required for this decision.",
  path: ["notes"],
});

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const parsed = schema.safeParse(await request.json());
    if (!parsed.success) return NextResponse.json({ error: "Invalid verification action." }, { status: 400 });
    await reviewVerification((await params).id, parsed.data.status, parsed.data.notes);
    return NextResponse.json({ updated: true });
  } catch (error) {
    return adminErrorResponse(error);
  }
}
