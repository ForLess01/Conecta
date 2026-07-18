export interface MarketplaceListing {
  id: string;
  type: "offer" | "request";
  actorId: string;
  actorName: string;
  productId: string;
  productName: string;
  varietyId: string | null;
  varietyName: string | null;
  title: string;
  description: string | null;
  quantity: number;
  unitId: number;
  unitSymbol: string;
  locationLabel: string;
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
}
