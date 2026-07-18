import "server-only";

import { randomUUID } from "node:crypto";

export type OrderStatus =
  | "RESERVED"
  | "PENDING_LOGISTICS"
  | "CONFIRMED"
  | "READY_FOR_PICKUP"
  | "IN_TRANSIT"
  | "DELIVERED"
  | "OBSERVED"
  | "COMPLETED"
  | "CANCELLED"
  | "EXPIRED";

export type OrderSource = "QUICK_OFFER" | "CONVERSATIONAL_PROPOSAL";

export interface OrderItemRecord {
  id: string;
  // Optional: a conversational proposal may originate from a REQUEST
  // listing with no pre-existing offer, matching `order_supplier_allocations
  // .source_offer_listing_id` being nullable in the schema.
  offerListingId?: string;
  producerActorId: string;
  quantity: number;
  unit: string;
  agreedUnitPrice: number;
}

export interface OrderRecord {
  id: string;
  buyerActorId: string;
  status: OrderStatus;
  source: OrderSource;
  negotiationId?: string;
  // Present when this order fulfills a REQUEST listing: groups every
  // producer's contribution (S2-08) under one order instead of one per
  // negotiation, and lets coverage be checked against the requested total.
  requestListingId?: string;
  requiredQuantity?: number;
  items: OrderItemRecord[];
  reservationExpiresAt: string | null;
  createdAt: string;
  updatedAt: string;
}

interface OrderLineInput {
  offerListingId?: string;
  producerActorId: string;
  quantity: number;
  unit: string;
  unitPrice: number;
}

export interface CreateOrderFromQuickOfferInput extends OrderLineInput {
  buyerActorId: string;
  reservationExpiresAt: string;
  negotiationId?: string;
}

export interface CreateOrderFromProposalInput extends OrderLineInput {
  buyerActorId: string;
  negotiationId: string;
  requestListingId?: string;
  requiredQuantity?: number;
}

export interface OrderAdapter {
  createFromQuickOffer(input: CreateOrderFromQuickOfferInput): Promise<OrderRecord>;
  createFromAcceptedProposal(input: CreateOrderFromProposalInput): Promise<OrderRecord>;
  getById(id: string, requesterActorId: string): Promise<OrderRecord | null>;
}

export class OrderServerConfigurationError extends Error {}
export class OrderPermissionError extends Error {}
export class OrderAlreadyExistsError extends Error {}
export class OrderCoverageExceededError extends Error {}

interface OrderStoreState {
  orders: Map<string, OrderRecord>;
  orderIdByNegotiation: Map<string, string>;
  orderIdByRequest: Map<string, string>;
}

const globalOrderState = globalThis as typeof globalThis & {
  conectaOrderStore?: OrderStoreState;
};

function emptyState(): OrderStoreState {
  return { orders: new Map(), orderIdByNegotiation: new Map(), orderIdByRequest: new Map() };
}

function getState(): OrderStoreState {
  return globalOrderState.conectaOrderStore ?? (globalOrderState.conectaOrderStore = emptyState());
}

function requestKey(requestListingId: string, buyerActorId: string): string {
  return `${requestListingId}:${buyerActorId}`;
}

function toItem(line: OrderLineInput): OrderItemRecord {
  return {
    id: randomUUID(),
    offerListingId: line.offerListingId,
    producerActorId: line.producerActorId,
    quantity: line.quantity,
    unit: line.unit,
    agreedUnitPrice: line.unitPrice,
  };
}

/** Sum of every producer contribution recorded on the order so far. */
export function getOrderCoverage(order: OrderRecord): {
  coveredQuantity: number;
  requiredQuantity?: number;
  isFullyCovered: boolean;
} {
  const coveredQuantity = order.items.reduce((total, item) => total + item.quantity, 0);
  return {
    coveredQuantity,
    requiredQuantity: order.requiredQuantity,
    isFullyCovered:
      order.requiredQuantity !== undefined ? coveredQuantity >= order.requiredQuantity : false,
  };
}

function assertWithinRequiredQuantity(order: OrderRecord, additionalQuantity: number): void {
  if (order.requiredQuantity === undefined) return;
  const covered = order.items.reduce((total, item) => total + item.quantity, 0);
  if (covered + additionalQuantity > order.requiredQuantity) {
    throw new OrderCoverageExceededError(
      `Order ${order.id} only needs ${order.requiredQuantity - covered} more, got ${additionalQuantity}`,
    );
  }
}

// Both entry points build the exact same order/order-item shape (S2-07:
// "ambos flujos crean misma estructura de orden") — only `source` and the
// reservation window differ.
function buildOrder(
  source: OrderSource,
  buyerActorId: string,
  line: OrderLineInput,
  reservationExpiresAt: string | null,
  negotiationId?: string,
  requestListingId?: string,
  requiredQuantity?: number,
): OrderRecord {
  const now = new Date().toISOString();
  return {
    id: randomUUID(),
    buyerActorId,
    status: "RESERVED",
    source,
    negotiationId,
    requestListingId,
    requiredQuantity,
    items: [toItem(line)],
    reservationExpiresAt,
    createdAt: now,
    updatedAt: now,
  };
}

function registerNegotiation(order: OrderRecord, negotiationId: string): void {
  const state = getState();
  // Mirrors the `unique (negotiation_id)` constraint on order_negotiations:
  // a negotiation can only ever produce (or contribute to) one order.
  const existingId = state.orderIdByNegotiation.get(negotiationId);
  if (existingId) {
    throw new OrderAlreadyExistsError(
      `Negotiation ${negotiationId} already produced order ${existingId}`,
    );
  }
  state.orderIdByNegotiation.set(negotiationId, order.id);
}

const demoAdapter: OrderAdapter = {
  async createFromQuickOffer(input) {
    const order = buildOrder(
      "QUICK_OFFER",
      input.buyerActorId,
      input,
      input.reservationExpiresAt,
      input.negotiationId,
    );
    if (input.negotiationId) registerNegotiation(order, input.negotiationId);
    getState().orders.set(order.id, order);
    return order;
  },

  async createFromAcceptedProposal(input) {
    const state = getState();

    // S2-08: a second (or third...) producer accepted for the same
    // requerimiento joins the existing order instead of starting a new one.
    if (input.requestListingId) {
      const key = requestKey(input.requestListingId, input.buyerActorId);
      const existingOrderId = state.orderIdByRequest.get(key);
      if (existingOrderId) {
        const existingOrder = state.orders.get(existingOrderId);
        if (!existingOrder) {
          throw new OrderServerConfigurationError(`Order ${existingOrderId} vanished from the store`);
        }
        assertWithinRequiredQuantity(existingOrder, input.quantity);
        registerNegotiation(existingOrder, input.negotiationId);
        const updated: OrderRecord = {
          ...existingOrder,
          items: [...existingOrder.items, toItem(input)],
          updatedAt: new Date().toISOString(),
        };
        state.orders.set(updated.id, updated);
        return updated;
      }
    }

    const order = buildOrder(
      "CONVERSATIONAL_PROPOSAL",
      input.buyerActorId,
      input,
      null,
      input.negotiationId,
      input.requestListingId,
      input.requiredQuantity,
    );
    assertWithinRequiredQuantity(order, 0); // validates requiredQuantity vs. this first line already set
    registerNegotiation(order, input.negotiationId);
    if (input.requestListingId) {
      state.orderIdByRequest.set(requestKey(input.requestListingId, input.buyerActorId), order.id);
    }
    state.orders.set(order.id, order);
    return order;
  },

  async getById(id, requesterActorId) {
    const order = getState().orders.get(id);
    if (!order) return null;
    const isParticipant =
      order.buyerActorId === requesterActorId ||
      order.items.some((item) => item.producerActorId === requesterActorId);
    if (!isParticipant) {
      throw new OrderPermissionError(`Actor ${requesterActorId} cannot view order ${id}`);
    }
    return order;
  },
};

function resolveAdapter(adapter?: OrderAdapter): OrderAdapter {
  if (adapter) return adapter;
  if (process.env.NODE_ENV === "production") {
    throw new OrderServerConfigurationError(
      "Order creation requires a real adapter (commercial_orders/order_items) in production",
    );
  }
  return demoAdapter;
}

export async function createOrderFromQuickOffer(
  input: CreateOrderFromQuickOfferInput,
  adapter?: OrderAdapter,
): Promise<OrderRecord> {
  return resolveAdapter(adapter).createFromQuickOffer(input);
}

export async function createOrderFromAcceptedProposal(
  input: CreateOrderFromProposalInput,
  adapter?: OrderAdapter,
): Promise<OrderRecord> {
  return resolveAdapter(adapter).createFromAcceptedProposal(input);
}

export async function getOrder(
  id: string,
  requesterActorId: string,
  adapter?: OrderAdapter,
): Promise<OrderRecord | null> {
  return resolveAdapter(adapter).getById(id, requesterActorId);
}

export function resetDemoOrderStore(): void {
  globalOrderState.conectaOrderStore = emptyState();
}
