import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import {
  ListingServerConfigurationError,
  createListing,
} from "@/lib/server/marketplace/listing-service";

const categorySchema = z.enum(["papa", "fibra_alpaca", "quinua", "cebolla", "trucha"]);

const createListingRequestSchema = z.object({
  listingType: z.enum(["OFFER", "REQUEST"]),
  actorId: z.string().trim().min(1).max(100),
  category: categorySchema,
  title: z.string().trim().min(1).max(200),
  description: z.string().trim().max(2000).optional(),
  quantity: z.number().finite().positive().max(1_000_000),
  unit: z.string().trim().min(1).max(20),
  minimumOrderQuantity: z.number().finite().positive().max(1_000_000).optional(),
  acceptsPartialOffers: z.boolean().optional(),
  acceptsMultipleSuppliers: z.boolean().optional(),
});

export async function POST(request: NextRequest) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const parsed = createListingRequestSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid listing details." }, { status: 400 });
  }

  try {
    const listing = await createListing(parsed.data);
    return NextResponse.json(listing, { status: 201 });
  } catch (error) {
    if (error instanceof ListingServerConfigurationError) {
      return NextResponse.json({ error: "Listing creation is unavailable." }, { status: 503 });
    }
    return NextResponse.json({ error: "Listing could not be created." }, { status: 500 });
  }
}
