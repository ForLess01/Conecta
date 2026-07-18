import { type NextRequest, NextResponse } from "next/server";
import { getCategorySuggestion, getOfferSuggestion } from "@/lib/server/pricing/suggestions";
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
      ? await getOfferSuggestion(offerListingId)
      : isProductCategory(category)
        ? await getCategorySuggestion(category)
        : null;

    if (!suggestion) {
      return NextResponse.json({ error: "No suggested range available." }, { status: 404 });
    }
    return NextResponse.json(suggestion);
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Suggested range could not be retrieved." }, { status: 500 });
  }
}
