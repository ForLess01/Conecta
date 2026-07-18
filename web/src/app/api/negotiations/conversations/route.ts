import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import {
  ConversationServerConfigurationError,
  ConversationTransitionError,
  startConversation,
} from "@/lib/server/negotiation/conversation-service";

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
    const negotiation = await startConversation(parsed.data);
    return NextResponse.json(negotiation, { status: 201 });
  } catch (error) {
    if (error instanceof ConversationTransitionError) {
      return NextResponse.json({ error: error.message }, { status: 409 });
    }
    if (error instanceof ConversationServerConfigurationError) {
      return NextResponse.json({ error: "Conversations are unavailable." }, { status: 503 });
    }
    return NextResponse.json({ error: "Conversation could not be started." }, { status: 500 });
  }
}
