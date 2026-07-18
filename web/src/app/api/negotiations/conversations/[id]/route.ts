import { type NextRequest, NextResponse } from "next/server";
import { getNegotiation } from "@/lib/server/commerce/commerce";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  try {
    const negotiation = await getNegotiation(id);
    if (!negotiation) {
      return NextResponse.json({ error: "Negotiation not found." }, { status: 404 });
    }
    return NextResponse.json(negotiation);
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Negotiation could not be retrieved." }, { status: 403 });
  }
}
