import { NextResponse } from "next/server";
import { z } from "zod";
import { adminErrorResponse } from "@/lib/server/admin/http";
import { createPriceObservation, listPriceObservations } from "@/lib/server/pricing/observations";

export const priceObservationSchema = z.strictObject({
  productId: z.string().uuid(),
  varietyId: z.string().uuid().nullable().optional(),
  administrativeAreaId: z.string().uuid().nullable().optional(),
  marketName: z.string().trim().max(120).nullable().optional(),
  observedOn: z.iso.date(),
  unitId: z.number().int().positive(),
  currencyId: z.number().int().positive(),
  priceLow: z.number().positive().nullable().optional(),
  priceMid: z.number().positive(),
  priceHigh: z.number().positive().nullable().optional(),
  sourceId: z.number().int().positive(),
  sourceUrl: z.string().url().nullable().optional(),
}).refine((value) => value.priceLow === null || value.priceLow === undefined || value.priceLow <= value.priceMid, {
  message: "Low price must not exceed mid price.",
}).refine((value) => value.priceHigh === null || value.priceHigh === undefined || value.priceMid <= value.priceHigh, {
  message: "High price must not be below mid price.",
});

export async function GET() {
  try {
    return NextResponse.json({ observations: await listPriceObservations() });
  } catch (error) {
    return adminErrorResponse(error);
  }
}

export async function POST(request: Request) {
  try {
    const parsed = priceObservationSchema.safeParse(await request.json());
    if (!parsed.success) return NextResponse.json({ error: "Invalid price observation." }, { status: 400 });
    return NextResponse.json({ id: await createPriceObservation(parsed.data) }, { status: 201 });
  } catch (error) {
    return adminErrorResponse(error);
  }
}
