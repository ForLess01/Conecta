import "server-only";

import { createClient } from "@/lib/supabase/server";
import { getMyActorContext } from "@/lib/supabase/session";
import type { Database } from "@/lib/supabase/types.gen";
import type { CommerceOrder, NegotiationDetail, NegotiationSummary } from "./types";

type RpcClient = Awaited<ReturnType<typeof createClient>>;
type CommerceFunctionName = Extract<keyof Database["public"]["Functions"], `commerce_${string}`>;
type FunctionArgs<Name extends CommerceFunctionName> = Database["public"]["Functions"][Name]["Args"];

async function context() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();
  if (error || !data?.claims?.sub) throw new CommerceAccessError("Authentication required.");
  const actor = await getMyActorContext();
  if (!actor) throw new CommerceAccessError("An actor profile is required.");
  return { supabase, actor };
}

async function rpc<Name extends CommerceFunctionName, T>(
  supabase: RpcClient,
  name: Name,
  args: FunctionArgs<Name>,
): Promise<T> {
  const { data, error } = await supabase.rpc(name, args);
  if (error) throw new CommerceOperationError(error.message);
  return data as T;
}

export class CommerceAccessError extends Error {}
export class CommerceOperationError extends Error {}

export async function createConversation(listingId: string) {
  const { supabase, actor } = await context();
  const rows = await rpc<"commerce_create_conversation", Array<{ negotiation_id: string; expires_at: string; reused: boolean }>>(
    supabase,
    "commerce_create_conversation",
    { p_listing_id: listingId, p_actor_id: actor.id },
  );
  return rows[0];
}

export async function sendMessage(negotiationId: string, body: string) {
  const { supabase, actor } = await context();
  return rpc<"commerce_send_message", { id: string; sender_actor_id: string; body: string; created_at: string }>(
    supabase,
    "commerce_send_message",
    { p_negotiation_id: negotiationId, p_actor_id: actor.id, p_body: body },
  );
}

export interface CreateProposalInput {
  quantity: number;
  unitPrice: number;
  currencyCode: string;
  deliveryDate?: string | null;
  logisticsMode?: Database["public"]["Enums"]["logistics_mode"] | null;
  expiresAt?: string | null;
  supersedesProposalId?: string | null;
}

export async function createProposal(negotiationId: string, input: CreateProposalInput) {
  const { supabase, actor } = await context();
  return rpc<"commerce_create_proposal", { id: string; status: string; expires_at: string | null }>(
    supabase,
    "commerce_create_proposal",
    {
      p_negotiation_id: negotiationId,
      p_actor_id: actor.id,
      p_quantity: input.quantity,
      p_unit_price: input.unitPrice,
      p_currency_code: input.currencyCode,
      ...(input.deliveryDate && { p_delivery_date: input.deliveryDate }),
      ...(input.logisticsMode && { p_logistics_mode: input.logisticsMode }),
      ...(input.expiresAt && { p_expires_at: input.expiresAt }),
      ...(input.supersedesProposalId && { p_supersedes_proposal_id: input.supersedesProposalId }),
    },
  );
}

export async function decideProposal(negotiationId: string, proposalId: string, accept: boolean) {
  const { supabase, actor } = await context();
  const rows = await rpc<"commerce_respond_to_proposal", Array<{ proposal_status: string; order_id: string | null; reservation_expires_at: string | null }>>(
    supabase,
    "commerce_respond_to_proposal",
    { p_negotiation_id: negotiationId, p_proposal_id: proposalId, p_actor_id: actor.id, p_accept: accept },
  );
  return rows[0];
}

export async function listNegotiations(): Promise<NegotiationSummary[]> {
  const { supabase, actor } = await context();
  return rpc<"commerce_list_negotiations", NegotiationSummary[]>(supabase, "commerce_list_negotiations", { p_actor_id: actor.id });
}

export async function getNegotiation(negotiationId: string): Promise<NegotiationDetail | null> {
  const { supabase, actor } = await context();
  return rpc<"commerce_get_negotiation", NegotiationDetail | null>(supabase, "commerce_get_negotiation", {
    p_negotiation_id: negotiationId,
    p_actor_id: actor.id,
  });
}

export async function listOrders(): Promise<CommerceOrder[]> {
  const { supabase, actor } = await context();
  return rpc<"commerce_list_orders", CommerceOrder[]>(supabase, "commerce_list_orders", { p_actor_id: actor.id });
}

export async function getOrder(orderId: string): Promise<CommerceOrder | null> {
  const { supabase, actor } = await context();
  return rpc<"commerce_get_order", CommerceOrder | null>(supabase, "commerce_get_order", {
    p_order_id: orderId,
    p_actor_id: actor.id,
  });
}
