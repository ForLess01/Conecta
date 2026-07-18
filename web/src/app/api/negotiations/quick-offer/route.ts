import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import {
  QuickOfferServerConfigurationError,
  submitQuickOffer,
} from "@/lib/server/negotiation/quick-offer-service";

const quickOfferRequestSchema = z.object({
  productId: z.string().trim().min(1).max(100),
  quantity: z.number().finite().positive().max(1_000_000),
  offeredPricePerUnit: z.number().finite().positive().max(1_000_000),
});

const LOCAL_DEMO_ATTEMPT_KEY = "local-demo";

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
    const result = await submitQuickOffer({
      offerListingId: parsed.data.productId,
      quantity: parsed.data.quantity,
      unitPrice: parsed.data.offeredPricePerUnit,
      currencyCode: "PEN",
      // Deliberately fixed: a route-issued cookie is not authentication and
      // deleting it must never restore private-floor probes. Production fails
      // closed in the service until real actor/RPC wiring is supplied.
      attemptKey: LOCAL_DEMO_ATTEMPT_KEY,
    });

    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof QuickOfferServerConfigurationError) {
      return NextResponse.json({ error: "Quick offer is unavailable." }, { status: 503 });
    }
    return NextResponse.json({ error: "Quick offer could not be processed." }, { status: 500 });
  }
}
