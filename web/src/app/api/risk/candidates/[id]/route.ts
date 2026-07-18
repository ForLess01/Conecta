import { NextResponse } from "next/server";
import { z } from "zod";
import { adminErrorResponse } from "@/lib/server/admin/http";
import { confirmRiskCandidate, discardRiskCandidate } from "@/lib/server/risk/events";

const actionSchema = z.strictObject({ action: z.enum(["confirm", "discard"]) });

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const parsed = actionSchema.safeParse(await request.json());
    if (!parsed.success) return NextResponse.json({ error: "Invalid candidate action." }, { status: 400 });
    const id = (await params).id;
    const riskEventId = parsed.data.action === "confirm" ? await confirmRiskCandidate(id) : (await discardRiskCandidate(id), null);
    return NextResponse.json({ updated: true, riskEventId });
  } catch (error) {
    return adminErrorResponse(error);
  }
}
