import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import {
  ListingNotFoundError,
  ListingServerConfigurationError,
  ListingTransitionError,
  transitionListingStatus,
} from "@/lib/server/marketplace/listing-service";
import { listingSupabaseAdapter } from "@/lib/server/marketplace/listing-supabase-adapter";

const transitionRequestSchema = z.object({
  action: z.enum(["pause", "reactivate", "close"]),
});

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const parsed = transitionRequestSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid status action." }, { status: 400 });
  }

  try {
    const listing = await transitionListingStatus(id, parsed.data.action, listingSupabaseAdapter);
    return NextResponse.json(listing);
  } catch (error) {
    if (error instanceof ListingNotFoundError) {
      return NextResponse.json({ error: "Listing not found." }, { status: 404 });
    }
    if (error instanceof ListingTransitionError) {
      return NextResponse.json({ error: error.message }, { status: 409 });
    }
    if (error instanceof ListingServerConfigurationError) {
      return NextResponse.json({ error: "Listing status change is unavailable." }, { status: 503 });
    }
    return NextResponse.json({ error: "Listing status could not be changed." }, { status: 500 });
  }
}
