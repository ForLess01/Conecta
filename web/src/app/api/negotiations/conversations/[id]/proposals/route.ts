import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createProposal } from "@/lib/server/commerce/commerce";

interface RouteParams {
  params: Promise<{ id: string }>;
}

const createProposalRequestSchema = z.object({
  createdByActorId: z.string().trim().min(1).max(100),
  quantity: z.number().finite().positive().max(1_000_000),
  unit: z.string().trim().min(1).max(20),
  unitPrice: z.number().finite().positive().max(1_000_000),
  deliveryDate: z.string().trim().min(1).max(20).optional(),
  logisticsMode: z.enum(["BUYER_PICKUP", "PRODUCER_DELIVERY", "MARKETPLACE_FREIGHT"]).optional(),
});

export async function POST(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const parsed = createProposalRequestSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid proposal." }, { status: 400 });
  }

  try {
    const proposal = await createProposal(id, {
      quantity: parsed.data.quantity,
      unitPrice: parsed.data.unitPrice,
      currencyCode: "PEN",
      deliveryDate: parsed.data.deliveryDate,
      logisticsMode: parsed.data.logisticsMode,
    });
    return NextResponse.json(proposal, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Proposal could not be created." }, { status: 409 });
  }
}
