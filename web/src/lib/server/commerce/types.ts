export type ProposalStatus = "ACTIVE" | "ACCEPTED" | "REJECTED" | "SUPERSEDED" | "EXPIRED";

export interface CommerceProposal {
  id: string;
  createdByActorId: string;
  supersedesProposalId: string | null;
  quantity: number;
  unit: string;
  unitPrice: number;
  currencyCode: string;
  deliveryDate: string | null;
  logisticsMode: "BUYER_PICKUP" | "PRODUCER_DELIVERY" | "MARKETPLACE_FREIGHT" | null;
  status: ProposalStatus;
  expiresAt: string | null;
  createdAt: string;
}

export interface CommerceMessage {
  id: string;
  senderActorId: string;
  type: "TEXT" | "SYSTEM" | "PROPOSAL_REFERENCE";
  body: string | null;
  createdAt: string;
}

export interface NegotiationSummary {
  id: string;
  mode: "QUICK" | "CONVERSATIONAL";
  status: string;
  productName: string;
  varietyName: string | null;
  counterpartName: string;
  expiresAt: string | null;
  updatedAt: string;
  lastMessage: string | null;
  hasActiveProposal: boolean;
  orderId: string | null;
}

export interface NegotiationDetail extends NegotiationSummary {
  actorId: string;
  buyerActorId: string;
  producerActorId: string;
  listingId: string;
  unit: string;
  messages: CommerceMessage[];
  proposals: CommerceProposal[];
}

export interface OrderAllocation {
  id: string;
  producerActorId: string;
  producerName: string;
  quantity: number;
  unitPrice: number;
  reservationStatus: string | null;
  reservationExpiresAt: string | null;
}

export interface OrderItem {
  id: string;
  productName: string;
  varietyName: string | null;
  quantity: number;
  unit: string;
  unitPrice: number;
  allocations: OrderAllocation[];
}

export interface CommerceOrder {
  id: string;
  buyerName: string;
  currencyCode: string;
  status: string;
  agreedDeliveryDate: string | null;
  reservationExpiresAt: string | null;
  createdAt: string;
  updatedAt: string;
  negotiationId: string | null;
  items: OrderItem[];
  total: number;
}
