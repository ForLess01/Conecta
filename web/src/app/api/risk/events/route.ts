import { NextResponse } from "next/server";
import { z } from "zod";
import { adminErrorResponse } from "@/lib/server/admin/http";
import { createRiskEvent, listRiskEvents } from "@/lib/server/risk/events";

export const riskEventInputSchema = z.strictObject({
  eventTypeCode: z.enum(["ROAD_BLOCK", "PROTEST", "HEAVY_RAIN", "ACCIDENT", "ACCESS_DIFFICULTY", "ROAD_DAMAGE"]),
  title: z.string().trim().min(4).max(160),
  summary: z.string().trim().max(600).nullable().optional(),
  roadName: z.string().trim().max(160).nullable().optional(),
  latitude: z.number().min(-90).max(90).nullable().optional(),
  longitude: z.number().min(-180).max(180).nullable().optional(),
  affectedRadiusKm: z.number().positive().max(1_000),
  severity: z.number().int().min(1).max(5),
  sourceConfidence: z.number().min(0).max(100),
  status: z.enum(["UNCONFIRMED", "CONFIRMED", "ACTIVE", "RESOLVED", "DISCARDED", "STALE"]).optional(),
  startsAt: z.string().datetime().nullable().optional(),
  endsAt: z.string().datetime().nullable().optional(),
  sourceUrl: z.string().url().nullable().optional(),
}).refine((value) => (value.latitude === null || value.latitude === undefined) === (value.longitude === null || value.longitude === undefined), {
  message: "Latitude and longitude must be provided together.",
}).refine((value) => !value.startsAt || !value.endsAt || Date.parse(value.endsAt) >= Date.parse(value.startsAt), {
  message: "The end date must not be earlier than the start date.",
  path: ["endsAt"],
});

export async function GET() {
  try {
    return NextResponse.json({ events: await listRiskEvents() });
  } catch (error) {
    return adminErrorResponse(error);
  }
}

export async function POST(request: Request) {
  try {
    const parsed = riskEventInputSchema.safeParse(await request.json());
    if (!parsed.success) return NextResponse.json({ error: "Invalid risk event." }, { status: 400 });
    const id = await createRiskEvent(parsed.data);
    return NextResponse.json({ id }, { status: 201 });
  } catch (error) {
    return adminErrorResponse(error);
  }
}
