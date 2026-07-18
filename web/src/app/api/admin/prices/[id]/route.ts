import { NextResponse } from "next/server";
import { z } from "zod";
import { adminErrorResponse } from "@/lib/server/admin/http";
import { deletePriceObservation, updatePriceObservation } from "@/lib/server/pricing/observations";

const updateSchema = z.strictObject({
  marketName: z.string().trim().max(120).nullable().optional(),
  observedOn: z.iso.date().optional(),
  priceLow: z.number().positive().nullable().optional(),
  priceMid: z.number().positive().optional(),
  priceHigh: z.number().positive().nullable().optional(),
  sourceUrl: z.string().url().nullable().optional(),
}).refine((value) => Object.keys(value).length > 0);

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const parsed = updateSchema.safeParse(await request.json());
    if (!parsed.success) return NextResponse.json({ error: "Invalid price update." }, { status: 400 });
    await updatePriceObservation((await params).id, parsed.data);
    return NextResponse.json({ updated: true });
  } catch (error) {
    return adminErrorResponse(error);
  }
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await deletePriceObservation((await params).id);
    return NextResponse.json({ deleted: true });
  } catch (error) {
    return adminErrorResponse(error);
  }
}
