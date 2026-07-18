import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import {
  ConversationNotFoundError,
  ConversationPermissionError,
  ConversationServerConfigurationError,
  ConversationTransitionError,
  createProposal,
} from "@/lib/server/negotiation/conversation-service";

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
    const proposal = await createProposal({ negotiationId: id, ...parsed.data });
    return NextResponse.json(proposal, { status: 201 });
  } catch (error) {
    if (error instanceof ConversationNotFoundError) {
      return NextResponse.json({ error: "Negotiation not found." }, { status: 404 });
    }
    if (error instanceof ConversationPermissionError) {
      return NextResponse.json({ error: "Not a participant of this negotiation." }, { status: 403 });
    }
    if (error instanceof ConversationTransitionError) {
      return NextResponse.json({ error: error.message }, { status: 409 });
    }
    if (error instanceof ConversationServerConfigurationError) {
      return NextResponse.json({ error: "Conversations are unavailable." }, { status: 503 });
    }
    return NextResponse.json({ error: "Proposal could not be created." }, { status: 500 });
  }
}
