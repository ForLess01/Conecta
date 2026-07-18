import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getNegotiation, sendMessage } from "@/lib/server/commerce/commerce";

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
  try {
    const negotiation = await getNegotiation(id);
    if (!negotiation) return NextResponse.json({ error: "Negotiation not found." }, { status: 404 });
    return NextResponse.json(negotiation.messages);
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Messages could not be retrieved." }, { status: 403 });
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
    const message = await sendMessage(id, parsed.data.body);
    return NextResponse.json(message, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Message could not be sent." }, { status: 409 });
  }
}
