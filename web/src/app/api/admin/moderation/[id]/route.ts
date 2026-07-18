import { NextResponse } from "next/server";
import { z } from "zod";
import { adminErrorResponse } from "@/lib/server/admin/http";
import { reviewModeration } from "@/lib/server/admin/data";

const schema = z.strictObject({
  status: z.enum(["REVIEWING", "DISMISSED", "ACTIONED"]),
  action: z.enum(["NONE", "PAUSE_LISTING", "CLOSE_LISTING"]).default("NONE"),
  notes: z.string().trim().max(1_000).optional(),
}).refine((value) => value.status !== "ACTIONED" || value.action !== "NONE")
  .refine((value) => value.status === "REVIEWING" || Boolean(value.notes), {
    message: "Moderation notes are required for a final decision.",
    path: ["notes"],
  });

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const parsed = schema.safeParse(await request.json());
    if (!parsed.success) return NextResponse.json({ error: "Invalid moderation action." }, { status: 400 });
    await reviewModeration((await params).id, parsed.data.status, parsed.data.action, parsed.data.notes);
    return NextResponse.json({ updated: true });
  } catch (error) {
    return adminErrorResponse(error);
  }
}
