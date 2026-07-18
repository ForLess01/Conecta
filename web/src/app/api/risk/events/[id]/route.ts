import { NextResponse } from "next/server";
import { z } from "zod";
import { adminErrorResponse } from "@/lib/server/admin/http";
import { deleteRiskEvent, updateRiskEvent } from "@/lib/server/risk/events";

const updateSchema = z.strictObject({
  status: z.enum(["UNCONFIRMED", "CONFIRMED", "ACTIVE", "RESOLVED", "DISCARDED", "STALE"]).optional(),
  severity: z.number().int().min(1).max(5).optional(),
  sourceConfidence: z.number().min(0).max(100).optional(),
  title: z.string().trim().min(4).max(160).optional(),
  summary: z.string().trim().max(600).nullable().optional(),
  affectedRadiusKm: z.number().positive().max(1_000).optional(),
}).refine((value) => Object.keys(value).length > 0);

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const parsed = updateSchema.safeParse(await request.json());
    if (!parsed.success) return NextResponse.json({ error: "Invalid risk event update." }, { status: 400 });
    await updateRiskEvent((await params).id, parsed.data);
    return NextResponse.json({ updated: true });
  } catch (error) {
    return adminErrorResponse(error);
  }
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await deleteRiskEvent((await params).id);
    return NextResponse.json({ deleted: true });
  } catch (error) {
    return adminErrorResponse(error);
  }
}
