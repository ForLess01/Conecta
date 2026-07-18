import { NextResponse } from "next/server";
import { createConversation } from "@/lib/server/commerce/commerce";
import { createConversationSchema } from "@/lib/server/commerce/validation";

export async function POST(request: Request) {
  const parsed = createConversationSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid listing." }, { status: 400 });

  try {
    const result = await createConversation(parsed.data.listingId);
    return NextResponse.json(result, { status: result.reused ? 200 : 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Conversation could not be created." },
      { status: 403 },
    );
  }
}
