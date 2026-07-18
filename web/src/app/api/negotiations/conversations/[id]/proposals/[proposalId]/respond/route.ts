import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import {
  ConversationNotFoundError,
  ConversationPermissionError,
  ConversationServerConfigurationError,
  ConversationTransitionError,
  respondToProposal,
} from "@/lib/server/negotiation/conversation-service";

interface RouteParams {
  params: Promise<{ id: string; proposalId: string }>;
}

const respondRequestSchema = z.object({
  actorId: z.string().trim().min(1).max(100),
  action: z.enum(["accept", "reject"]),
});

export async function POST(request: NextRequest, { params }: RouteParams) {
  const { id, proposalId } = await params;
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const parsed = respondRequestSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid response." }, { status: 400 });
  }

  try {
    const negotiation = await respondToProposal(
      id,
      proposalId,
      parsed.data.actorId,
      parsed.data.action,
    );
    return NextResponse.json(negotiation);
  } catch (error) {
    if (error instanceof ConversationNotFoundError) {
      return NextResponse.json({ error: "Negotiation or proposal not found." }, { status: 404 });
    }
    if (error instanceof ConversationPermissionError) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    if (error instanceof ConversationTransitionError) {
      return NextResponse.json({ error: error.message }, { status: 409 });
    }
    if (error instanceof ConversationServerConfigurationError) {
      return NextResponse.json({ error: "Conversations are unavailable." }, { status: 503 });
    }
    return NextResponse.json({ error: "Response could not be processed." }, { status: 500 });
  }
}
