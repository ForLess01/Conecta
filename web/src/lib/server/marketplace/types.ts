import type { NegotiationMode, PriceRange, RiskInfo, VerificationLevel } from "@/types/domain";

export interface MarketplaceListing {
  id: string;
  type: "offer" | "request";
  actorId: string;
  actorName: string;
  productId: string;
  productCode?: string;
  productName: string;
  varietyId: string | null;
  varietyName: string | null;
  title: string;
  description: string | null;
  quantity: number;
  unitId: number;
  unitSymbol: string;
  locationLabel: string;
  approximateLatitude?: number;
  approximateLongitude?: number;
  availableFrom: string | null;
  deadlineAt: string | null;
  createdAt: string;
  minimumOrderQuantity: number | null;
  allowPartialQuantity: boolean;
  acceptsPartialOffers: boolean;
  acceptsMultipleSuppliers: boolean;
  quickNegotiationEnabled: boolean;
  conversationalWindowHours: number;
  saved: boolean;
  actorVerification: VerificationLevel;
  imagePosition?: string;
  imageUrl?: string;
  negotiationMode: NegotiationMode;
  priceRange: PriceRange | null;
  risk: RiskInfo | null;
}
