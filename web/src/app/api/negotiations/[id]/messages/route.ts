import { NextResponse } from "next/server";
import { sendMessage } from "@/lib/server/commerce/commerce";
import { sendMessageSchema, uuidSchema } from "@/lib/server/commerce/validation";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const input = sendMessageSchema.safeParse(await request.json().catch(() => null));
  if (!uuidSchema.safeParse(id).success || !input.success) {
    return NextResponse.json({ error: "Invalid message." }, { status: 400 });
  }

  try {
    return NextResponse.json(await sendMessage(id, input.data.body), { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Message could not be sent." }, { status: 403 });
  }
}
