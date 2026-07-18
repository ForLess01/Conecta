import { NextResponse } from "next/server";
import { decideProposal } from "@/lib/server/commerce/commerce";
import { proposalDecisionSchema, uuidSchema } from "@/lib/server/commerce/validation";

export async function POST(request: Request, { params }: { params: Promise<{ id: string; proposalId: string }> }) {
  const { id, proposalId } = await params;
  const input = proposalDecisionSchema.safeParse(await request.json().catch(() => null));
  if (!uuidSchema.safeParse(id).success || !uuidSchema.safeParse(proposalId).success || !input.success) {
    return NextResponse.json({ error: "Invalid proposal decision." }, { status: 400 });
  }

  try {
    return NextResponse.json(await decideProposal(id, proposalId, input.data.decision === "accept"));
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Proposal could not be updated." }, { status: 403 });
  }
}
