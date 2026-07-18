import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import {
  ConversationNotFoundError,
  ConversationPermissionError,
  ConversationServerConfigurationError,
  ConversationTransitionError,
  listMessages,
  sendMessage,
} from "@/lib/server/negotiation/conversation-service";

interface RouteParams {
  params: Promise<{ id: string }>;
}

const sendMessageRequestSchema = z.object({
  senderActorId: z.string().trim().min(1).max(100),
  body: z.string().trim().min(1).max(4000),
  messageType: z.enum(["TEXT", "IMAGE", "FILE", "SYSTEM", "PROPOSAL_REFERENCE"]).optional(),
});

export async function GET(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  const actorId = request.nextUrl.searchParams.get("actorId");

  if (!actorId) {
    return NextResponse.json({ error: "actorId query parameter is required." }, { status: 400 });
  }

  try {
    const messages = await listMessages(id, actorId);
    return NextResponse.json(messages);
  } catch (error) {
    if (error instanceof ConversationNotFoundError) {
      return NextResponse.json({ error: "Negotiation not found." }, { status: 404 });
    }
    if (error instanceof ConversationPermissionError) {
      return NextResponse.json({ error: "Not a participant of this negotiation." }, { status: 403 });
    }
    if (error instanceof ConversationServerConfigurationError) {
      return NextResponse.json({ error: "Conversations are unavailable." }, { status: 503 });
    }
    return NextResponse.json({ error: "Messages could not be retrieved." }, { status: 500 });
  }
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const parsed = sendMessageRequestSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid message." }, { status: 400 });
  }

  try {
    const message = await sendMessage({ negotiationId: id, ...parsed.data });
    return NextResponse.json(message, { status: 201 });
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
    return NextResponse.json({ error: "Message could not be sent." }, { status: 500 });
  }
}
