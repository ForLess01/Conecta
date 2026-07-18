import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import {
  ListingNotFoundError,
  ListingServerConfigurationError,
  ListingTransitionError,
  getListing,
  updateListing,
} from "@/lib/server/marketplace/listing-service";

const updateListingRequestSchema = z.object({
  title: z.string().trim().min(1).max(200).optional(),
  description: z.string().trim().max(2000).optional(),
  quantity: z.number().finite().min(0).max(1_000_000).optional(),
  minimumOrderQuantity: z.number().finite().positive().max(1_000_000).optional(),
});

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(_request: NextRequest, { params }: RouteParams) {
  const { id } = await params;

  try {
    const listing = await getListing(id);
    if (!listing) {
      return NextResponse.json({ error: "Listing not found." }, { status: 404 });
    }
    return NextResponse.json(listing);
  } catch (error) {
    if (error instanceof ListingServerConfigurationError) {
      return NextResponse.json({ error: "Listing lookup is unavailable." }, { status: 503 });
    }
    return NextResponse.json({ error: "Listing could not be retrieved." }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const parsed = updateListingRequestSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid listing update." }, { status: 400 });
  }

  try {
    const listing = await updateListing(id, parsed.data);
    return NextResponse.json(listing);
  } catch (error) {
    if (error instanceof ListingNotFoundError) {
      return NextResponse.json({ error: "Listing not found." }, { status: 404 });
    }
    if (error instanceof ListingTransitionError) {
      return NextResponse.json({ error: error.message }, { status: 409 });
    }
    if (error instanceof ListingServerConfigurationError) {
      return NextResponse.json({ error: "Listing update is unavailable." }, { status: 503 });
    }
    return NextResponse.json({ error: "Listing could not be updated." }, { status: 500 });
  }
}
