import { NextResponse } from "next/server";
import { createProposal } from "@/lib/server/commerce/commerce";
import { proposalSchema, uuidSchema } from "@/lib/server/commerce/validation";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const input = proposalSchema.safeParse(await request.json().catch(() => null));
  if (!uuidSchema.safeParse(id).success || !input.success) {
    return NextResponse.json({ error: "Invalid proposal." }, { status: 400 });
  }

  try {
    return NextResponse.json(await createProposal(id, input.data), { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Proposal could not be created." }, { status: 403 });
  }
}
