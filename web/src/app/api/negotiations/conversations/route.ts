import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createConversation } from "@/lib/server/commerce/commerce";

const startConversationRequestSchema = z
  .object({
    offerListingId: z.string().trim().min(1).max(100).optional(),
    requestListingId: z.string().trim().min(1).max(100).optional(),
    buyerActorId: z.string().trim().min(1).max(100),
    producerActorId: z.string().trim().min(1).max(100),
    windowHours: z.union([z.literal(12), z.literal(24), z.literal(48), z.literal(72)]).optional(),
    requiredQuantity: z.number().finite().positive().max(1_000_000).optional(),
  })
  .refine((data) => Boolean(data.offerListingId) || Boolean(data.requestListingId), {
    message: "offerListingId or requestListingId is required.",
  });

export async function POST(request: NextRequest) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const parsed = startConversationRequestSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid conversation details." }, { status: 400 });
  }

  try {
    const listingId = parsed.data.offerListingId ?? parsed.data.requestListingId;
    if (!listingId) return NextResponse.json({ error: "Listing is required." }, { status: 400 });
    const negotiation = await createConversation(listingId);
    return NextResponse.json(negotiation, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Conversation could not be started." }, { status: 409 });
  }
}
