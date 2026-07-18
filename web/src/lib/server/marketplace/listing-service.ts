import "server-only";

import { randomUUID } from "node:crypto";
import { PRODUCTS } from "@/lib/mock/products";
import { PURCHASE_REQUESTS } from "@/lib/mock/requests";
import type { ProductCategory } from "@/types/domain";

export type ListingType = "OFFER" | "REQUEST";
export type ListingStatus = "DRAFT" | "ACTIVE" | "PAUSED" | "SOLD_OUT" | "CLOSED";
export type ListingTransitionAction = "pause" | "reactivate" | "close";

export interface ListingRecord {
  id: string;
  listingType: ListingType;
  actorId: string;
  category: ProductCategory;
  title: string;
  description: string;
  quantity: number;
  unit: string;
  status: ListingStatus;
  minimumOrderQuantity?: number;
  acceptsPartialOffers?: boolean;
  acceptsMultipleSuppliers?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateListingInput {
  listingType: ListingType;
  actorId: string;
  category: ProductCategory;
  title: string;
  description?: string;
  quantity: number;
  unit: string;
  minimumOrderQuantity?: number;
  acceptsPartialOffers?: boolean;
  acceptsMultipleSuppliers?: boolean;
}

export interface UpdateListingInput {
  title?: string;
  description?: string;
  quantity?: number;
  minimumOrderQuantity?: number;
}

export interface ListingAdapter {
  create(input: CreateListingInput): Promise<ListingRecord>;
  getById(id: string): Promise<ListingRecord | null>;
  update(id: string, patch: UpdateListingInput): Promise<ListingRecord>;
  transitionStatus(id: string, action: ListingTransitionAction): Promise<ListingRecord>;
}

export class ListingServerConfigurationError extends Error {}
export class ListingNotFoundError extends Error {}
export class ListingTransitionError extends Error {}

// Mirrors the transitions and edit rules closed for S0-06 (docs/ARQUITECTURA.md #6):
// only ACTIVE/PAUSED are editable, SOLD_OUT only accepts a quantity replenish,
// and CLOSED is terminal.
const ALLOWED_TRANSITIONS: Record<
  ListingStatus,
  Partial<Record<ListingTransitionAction, ListingStatus>>
> = {
  DRAFT: {},
  ACTIVE: { pause: "PAUSED", close: "CLOSED" },
  PAUSED: { reactivate: "ACTIVE", close: "CLOSED" },
  SOLD_OUT: { close: "CLOSED" },
  CLOSED: {},
};

function nextStatus(current: ListingStatus, action: ListingTransitionAction): ListingStatus {
  const next = ALLOWED_TRANSITIONS[current][action];
  if (!next) {
    throw new ListingTransitionError(`Cannot ${action} a listing in status ${current}`);
  }
  return next;
}

type ListingStore = Map<string, ListingRecord>;

const globalListingState = globalThis as typeof globalThis & {
  conectaListingStore?: ListingStore;
};

function statusFromMockProduct(status: "activo" | "pausado" | "agotado"): ListingStatus {
  if (status === "pausado") return "PAUSED";
  if (status === "agotado") return "SOLD_OUT";
  return "ACTIVE";
}

function seedStore(): ListingStore {
  const store: ListingStore = new Map();
  const now = new Date().toISOString();

  for (const product of PRODUCTS) {
    store.set(product.id, {
      id: product.id,
      listingType: "OFFER",
      actorId: product.producerId,
      category: product.category,
      title: product.name,
      description: product.description,
      quantity: product.quantityAvailable,
      unit: product.unit,
      status: statusFromMockProduct(product.status),
      minimumOrderQuantity: product.minOrder,
      createdAt: now,
      updatedAt: now,
    });
  }

  for (const request of PURCHASE_REQUESTS) {
    store.set(request.id, {
      id: request.id,
      listingType: "REQUEST",
      actorId: request.buyerId,
      category: request.category,
      title: request.productName,
      description: request.quality,
      quantity: request.volume,
      unit: request.unit,
      status: "ACTIVE",
      acceptsPartialOffers: request.acceptsPartial,
      acceptsMultipleSuppliers: request.acceptsMultipleProducers,
      createdAt: now,
      updatedAt: now,
    });
  }

  return store;
}

function getStore(): ListingStore {
  return globalListingState.conectaListingStore ?? (globalListingState.conectaListingStore = seedStore());
}

// Demo-only adapter: persists in process memory over the mock catalog/requests
// so the CRUD contract is real today. Production must supply an adapter backed
// by `market_listings` / `product_offers` / `purchase_requests`.
const demoAdapter: ListingAdapter = {
  async create(input) {
    const now = new Date().toISOString();
    const record: ListingRecord = {
      id: randomUUID(),
      listingType: input.listingType,
      actorId: input.actorId,
      category: input.category,
      title: input.title,
      description: input.description ?? "",
      quantity: input.quantity,
      unit: input.unit,
      status: input.quantity > 0 ? "ACTIVE" : "SOLD_OUT",
      minimumOrderQuantity: input.minimumOrderQuantity,
      acceptsPartialOffers: input.acceptsPartialOffers,
      acceptsMultipleSuppliers: input.acceptsMultipleSuppliers,
      createdAt: now,
      updatedAt: now,
    };
    getStore().set(record.id, record);
    return record;
  },

  async getById(id) {
    return getStore().get(id) ?? null;
  },

  async update(id, patch) {
    const store = getStore();
    const current = store.get(id);
    if (!current) {
      throw new ListingNotFoundError(`Listing ${id} not found`);
    }
    if (current.status === "CLOSED") {
      throw new ListingTransitionError(`Listing ${id} is closed and cannot be edited`);
    }

    const patchedFields = Object.keys(patch);
    const isReplenishOnly =
      current.status === "SOLD_OUT" &&
      patchedFields.every((key) => key === "quantity") &&
      (patch.quantity ?? 0) > 0;

    if (current.status === "SOLD_OUT" && !isReplenishOnly) {
      throw new ListingTransitionError(
        `Listing ${id} is sold out; only replenishing quantity is allowed`,
      );
    }

    const quantity = patch.quantity ?? current.quantity;
    const status: ListingStatus =
      quantity <= 0 ? "SOLD_OUT" : current.status === "SOLD_OUT" ? "ACTIVE" : current.status;

    const updated: ListingRecord = {
      ...current,
      ...patch,
      quantity,
      status,
      updatedAt: new Date().toISOString(),
    };
    store.set(id, updated);
    return updated;
  },

  async transitionStatus(id, action) {
    const store = getStore();
    const current = store.get(id);
    if (!current) {
      throw new ListingNotFoundError(`Listing ${id} not found`);
    }
    const status = nextStatus(current.status, action);
    const updated: ListingRecord = { ...current, status, updatedAt: new Date().toISOString() };
    store.set(id, updated);
    return updated;
  },
};

function resolveAdapter(adapter?: ListingAdapter): ListingAdapter {
  if (adapter) return adapter;
  if (process.env.NODE_ENV === "production") {
    throw new ListingServerConfigurationError(
      "Listing CRUD requires a real adapter (market_listings) in production",
    );
  }
  return demoAdapter;
}

export async function createListing(
  input: CreateListingInput,
  adapter?: ListingAdapter,
): Promise<ListingRecord> {
  return resolveAdapter(adapter).create(input);
}

export async function getListing(
  id: string,
  adapter?: ListingAdapter,
): Promise<ListingRecord | null> {
  return resolveAdapter(adapter).getById(id);
}

export async function updateListing(
  id: string,
  patch: UpdateListingInput,
  adapter?: ListingAdapter,
): Promise<ListingRecord> {
  return resolveAdapter(adapter).update(id, patch);
}

export async function transitionListingStatus(
  id: string,
  action: ListingTransitionAction,
  adapter?: ListingAdapter,
): Promise<ListingRecord> {
  return resolveAdapter(adapter).transitionStatus(id, action);
}

export function resetDemoListingStore(): void {
  globalListingState.conectaListingStore = seedStore();
}
