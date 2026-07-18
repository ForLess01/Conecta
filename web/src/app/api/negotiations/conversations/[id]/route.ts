import { type NextRequest, NextResponse } from "next/server";
import {
  ConversationPermissionError,
  ConversationServerConfigurationError,
  getNegotiation,
} from "@/lib/server/negotiation/conversation-service";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  const actorId = request.nextUrl.searchParams.get("actorId");

  if (!actorId) {
    return NextResponse.json({ error: "actorId query parameter is required." }, { status: 400 });
  }

  try {
    const negotiation = await getNegotiation(id, actorId);
    if (!negotiation) {
      return NextResponse.json({ error: "Negotiation not found." }, { status: 404 });
    }
    return NextResponse.json(negotiation);
  } catch (error) {
    if (error instanceof ConversationPermissionError) {
      return NextResponse.json({ error: "Not a participant of this negotiation." }, { status: 403 });
    }
    if (error instanceof ConversationServerConfigurationError) {
      return NextResponse.json({ error: "Conversations are unavailable." }, { status: 503 });
    }
    return NextResponse.json({ error: "Negotiation could not be retrieved." }, { status: 500 });
  }
}
