import "server-only";

import { getMyActorContext } from "@/lib/supabase/session";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/types.gen";
import {
  ListingNotFoundError,
  ListingTransitionError,
  type CreateListingInput,
  type ListingAdapter,
  type ListingRecord,
  type ListingStatus,
  type ListingTransitionAction,
  type UpdateListingInput,
} from "@/lib/server/marketplace/listing-service";
import type { ProductCategory } from "@/types/domain";

const PRODUCT_CODE: Record<ProductCategory, string> = {
  papa: "POTATO",
  fibra_alpaca: "ALPACA_FIBER",
  quinua: "QUINOA",
  cebolla: "ONION",
  trucha: "TROUT",
};
const CATEGORY_BY_CODE = Object.fromEntries(
  Object.entries(PRODUCT_CODE).map(([category, code]) => [code, category]),
) as Record<string, ProductCategory>;

async function readListing(id: string): Promise<ListingRecord | null> {
  const supabase = await createClient();
  const { data: listing, error } = await supabase
    .from("market_listings")
    .select("id,listing_type,actor_id,title,description,quantity,status,created_at,updated_at,products(code),units_of_measure(symbol)")
    .eq("id", id)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!listing) return null;
  const [offer, request] = await Promise.all([
    listing.listing_type === "OFFER"
      ? supabase.from("product_offers").select("minimum_order_quantity").eq("listing_id", id).maybeSingle()
      : Promise.resolve({ data: null, error: null }),
    listing.listing_type === "REQUEST"
      ? supabase.from("purchase_requests").select("accepts_partial_offers,accepts_multiple_suppliers").eq("listing_id", id).maybeSingle()
      : Promise.resolve({ data: null, error: null }),
  ]);
  if (offer.error) throw new Error(offer.error.message);
  if (request.error) throw new Error(request.error.message);
  const product = Array.isArray(listing.products) ? listing.products[0] : listing.products;
  const unit = Array.isArray(listing.units_of_measure) ? listing.units_of_measure[0] : listing.units_of_measure;
  return {
    id: listing.id,
    listingType: listing.listing_type,
    actorId: listing.actor_id,
    category: CATEGORY_BY_CODE[String(product?.code).toUpperCase()] ?? "papa",
    title: listing.title,
    description: listing.description ?? "",
    quantity: Number(listing.quantity),
    unit: unit?.symbol ?? "unidad",
    status: listing.status as ListingStatus,
    minimumOrderQuantity: offer.data?.minimum_order_quantity ? Number(offer.data.minimum_order_quantity) : undefined,
    acceptsPartialOffers: request.data?.accepts_partial_offers,
    acceptsMultipleSuppliers: request.data?.accepts_multiple_suppliers,
    createdAt: listing.created_at,
    updatedAt: listing.updated_at,
  };
}

async function requireOwnedActor(actorId: string) {
  const actor = await getMyActorContext();
  if (!actor || actor.id !== actorId) throw new ListingTransitionError("Listing actor is not accessible");
  return actor;
}

export const listingSupabaseAdapter: ListingAdapter = {
  async create(input: CreateListingInput) {
    await requireOwnedActor(input.actorId);
    const supabase = await createClient();
    const [{ data: product }, { data: unit }, { data: actorLocation }] = await Promise.all([
      supabase.from("products").select("id").ilike("code", PRODUCT_CODE[input.category]).maybeSingle(),
      supabase.from("units_of_measure").select("id").ilike("code", input.unit).maybeSingle(),
      supabase.from("actor_locations").select("location_point_id,location_points(label,latitude,longitude)").eq("actor_id", input.actorId).eq("is_primary", true).limit(1).maybeSingle(),
    ]);
    if (!product || !unit || !actorLocation) throw new ListingTransitionError("Complete product, unit and primary location before publishing");
    const location = Array.isArray(actorLocation.location_points) ? actorLocation.location_points[0] : actorLocation.location_points;
    if (!location) throw new ListingTransitionError("Primary location is incomplete");

    let id: string | null = null;
    if (input.listingType === "OFFER") {
      type OfferArgs = Database["public"]["Functions"]["create_market_offer"]["Args"];
      const { data, error } = await supabase.rpc("create_market_offer", {
        p_actor_id: input.actorId,
        p_product_id: product.id,
        p_variety_id: null,
        p_title: input.title,
        p_description: input.description ?? "",
        p_quantity: input.quantity,
        p_unit_id: unit.id,
        p_minimum_order_quantity: input.minimumOrderQuantity ?? input.quantity,
        p_allow_partial_quantity: input.acceptsPartialOffers ?? true,
        p_location_label: location.label,
        p_latitude: Number(location.latitude),
        p_longitude: Number(location.longitude),
        p_available_from: null,
        p_quick_negotiation_enabled: false,
        p_conversational_window_hours: 24,
        p_hidden_floor_price: null,
        p_publish: true,
      } as unknown as OfferArgs);
      if (error) throw new ListingTransitionError(error.message);
      id = data;
    } else {
      type RequestArgs = Database["public"]["Functions"]["create_purchase_request"]["Args"];
      const { data, error } = await supabase.rpc("create_purchase_request", {
        p_actor_id: input.actorId,
        p_product_id: product.id,
        p_variety_id: null,
        p_title: input.title,
        p_description: input.description ?? "",
        p_quantity: input.quantity,
        p_unit_id: unit.id,
        p_location_label: location.label,
        p_latitude: Number(location.latitude),
        p_longitude: Number(location.longitude),
        p_deadline_at: new Date(Date.now() + 7 * 86_400_000).toISOString(),
        p_delivery_deadline: null,
        p_accepts_partial_offers: input.acceptsPartialOffers ?? true,
        p_accepts_multiple_suppliers: input.acceptsMultipleSuppliers ?? true,
        p_publish: true,
      } as unknown as RequestArgs);
      if (error) throw new ListingTransitionError(error.message);
      id = data;
    }
    const created = id ? await readListing(id) : null;
    if (!created) throw new ListingNotFoundError("Created listing could not be loaded");
    return created;
  },

  getById: readListing,

  async update(id: string, patch: UpdateListingInput) {
    const current = await readListing(id);
    if (!current) throw new ListingNotFoundError(`Listing ${id} not found`);
    await requireOwnedActor(current.actorId);
    if (current.status === "CLOSED") throw new ListingTransitionError("Closed listings cannot be edited");
    const supabase = await createClient();
    const quantity = patch.quantity ?? current.quantity;
    const { error } = await supabase.from("market_listings").update({
      ...(patch.title !== undefined && { title: patch.title }),
      ...(patch.description !== undefined && { description: patch.description }),
      ...(patch.quantity !== undefined && { quantity: patch.quantity }),
      status: quantity <= 0 ? "SOLD_OUT" : current.status === "SOLD_OUT" ? "ACTIVE" : current.status,
    }).eq("id", id);
    if (error) throw new ListingTransitionError(error.message);
    if (patch.minimumOrderQuantity !== undefined && current.listingType === "OFFER") {
      const { error: offerError } = await supabase.from("product_offers").update({ minimum_order_quantity: patch.minimumOrderQuantity }).eq("listing_id", id);
      if (offerError) throw new ListingTransitionError(offerError.message);
    }
    return (await readListing(id))!;
  },

  async transitionStatus(id: string, action: ListingTransitionAction) {
    const current = await readListing(id);
    if (!current) throw new ListingNotFoundError(`Listing ${id} not found`);
    await requireOwnedActor(current.actorId);
    const transitions: Record<ListingTransitionAction, Partial<Record<ListingStatus, ListingStatus>>> = {
      pause: { ACTIVE: "PAUSED" },
      reactivate: { PAUSED: "ACTIVE" },
      close: { ACTIVE: "CLOSED", PAUSED: "CLOSED", SOLD_OUT: "CLOSED" },
    };
    const status = transitions[action][current.status];
    if (!status) throw new ListingTransitionError(`Cannot ${action} a listing in status ${current.status}`);
    const supabase = await createClient();
    const { error } = await supabase.from("market_listings").update({ status }).eq("id", id);
    if (error) throw new ListingTransitionError(error.message);
    return (await readListing(id))!;
  },
};
