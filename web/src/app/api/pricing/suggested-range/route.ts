import { type NextRequest, NextResponse } from "next/server";
import {
  PricingServerConfigurationError,
  getSuggestedRangeForCategory,
  getSuggestedRangeForOffer,
} from "@/lib/server/pricing/pricing-service";
import type { ProductCategory } from "@/types/domain";

const CATEGORIES: ProductCategory[] = ["papa", "fibra_alpaca", "quinua", "cebolla", "trucha"];

function isProductCategory(value: string | null): value is ProductCategory {
  return CATEGORIES.includes(value as ProductCategory);
}

export async function GET(request: NextRequest) {
  const offerListingId = request.nextUrl.searchParams.get("offerListingId");
  const category = request.nextUrl.searchParams.get("category");

  if (!offerListingId && !category) {
    return NextResponse.json(
      { error: "offerListingId or category query parameter is required." },
      { status: 400 },
    );
  }

  try {
    const suggestion = offerListingId
      ? await getSuggestedRangeForOffer(offerListingId)
      : isProductCategory(category)
        ? await getSuggestedRangeForCategory(category)
        : null;

    if (!suggestion) {
      return NextResponse.json({ error: "No suggested range available." }, { status: 404 });
    }
    return NextResponse.json(suggestion);
  } catch (error) {
    if (error instanceof PricingServerConfigurationError) {
      return NextResponse.json({ error: "Price suggestions are unavailable." }, { status: 503 });
    }
    return NextResponse.json({ error: "Suggested range could not be retrieved." }, { status: 500 });
  }
}
