import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { decideProposal } from "@/lib/server/commerce/commerce";

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
    const negotiation = await decideProposal(id, proposalId, parsed.data.action === "accept");
    return NextResponse.json(negotiation);
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Response could not be processed." }, { status: 409 });
  }
}
