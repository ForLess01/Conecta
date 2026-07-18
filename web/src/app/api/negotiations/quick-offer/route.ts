import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import {
  createSubmitQuickOfferRpcAdapter,
  QuickOfferServerConfigurationError,
  submitQuickOffer,
} from "@/lib/server/negotiation/quick-offer-service";
import { createClient } from "@/lib/supabase/server";
import { getMyActorContext } from "@/lib/supabase/session";

const quickOfferRequestSchema = z.object({
  productId: z.string().uuid(),
  quantity: z.number().finite().positive().max(1_000_000),
  offeredPricePerUnit: z.number().finite().positive().max(1_000_000),
});

export async function POST(request: NextRequest) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const parsed = quickOfferRequestSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid quick-offer details." }, { status: 400 });
  }

  try {
    const supabase = await createClient();
    const { data: claims, error: claimsError } = await supabase.auth.getClaims();
    if (claimsError || !claims?.claims?.sub) {
      return NextResponse.json({ error: "Authentication required." }, { status: 401 });
    }
    const actor = await getMyActorContext();
    if (!actor || !actor.roles.includes("comprador")) {
      return NextResponse.json({ error: "A buyer profile is required." }, { status: 403 });
    }

    const adapter = createSubmitQuickOfferRpcAdapter(async (_functionName, args) => {
      const { data, error } = await supabase.rpc("commerce_submit_quick_offer", args);
      if (error) throw new Error(error.message);
      if (!data?.length) throw new Error("Quick offer returned no result.");
      return data[0];
    });
    const result = await submitQuickOffer({
      offerListingId: parsed.data.productId,
      buyerActorId: actor.id,
      quantity: parsed.data.quantity,
      unitPrice: parsed.data.offeredPricePerUnit,
      currencyCode: "PEN",
      attemptKey: actor.id,
    }, adapter);

    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof QuickOfferServerConfigurationError) {
      return NextResponse.json({ error: "Quick offer is unavailable." }, { status: 503 });
    }
    return NextResponse.json({ error: "Quick offer could not be processed." }, { status: 500 });
  }
}
