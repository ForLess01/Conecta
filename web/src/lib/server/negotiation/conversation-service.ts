import "server-only";

import { randomUUID } from "node:crypto";
import { publishMessage } from "./realtime";
import { createOrderFromAcceptedProposal } from "../orders/order-service";

export type NegotiationStatus = "OPEN" | "COUNTERED" | "ACCEPTED" | "REJECTED" | "EXPIRED" | "CANCELLED";
export type MessageType = "TEXT" | "IMAGE" | "FILE" | "SYSTEM" | "PROPOSAL_REFERENCE";
export type ProposalStatus = "ACTIVE" | "ACCEPTED" | "REJECTED" | "SUPERSEDED" | "EXPIRED";
export type LogisticsMode = "BUYER_PICKUP" | "PRODUCER_DELIVERY" | "MARKETPLACE_FREIGHT";
export type ProposalResponseAction = "accept" | "reject";

export interface NegotiationRecord {
  id: string;
  offerListingId?: string;
  requestListingId?: string;
  buyerActorId: string;
  producerActorId: string;
  status: NegotiationStatus;
  windowHours: number;
  expiresAt: string | null;
  orderId?: string;
  // Total volume of the buyer's requirement, when this negotiation is over a
  // REQUEST listing (S2-08: multiple producers can each cover part of it).
  requiredQuantity?: number;
  createdAt: string;
  updatedAt: string;
}

export interface MessageRecord {
  id: string;
  negotiationId: string;
  senderActorId: string;
  messageType: MessageType;
  body: string | null;
  createdAt: string;
}

export interface ProposalRecord {
  id: string;
  negotiationId: string;
  createdByActorId: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  deliveryDate?: string;
  logisticsMode?: LogisticsMode;
  status: ProposalStatus;
  createdAt: string;
}

export interface StartConversationInput {
  offerListingId?: string;
  requestListingId?: string;
  buyerActorId: string;
  producerActorId: string;
  windowHours?: 12 | 24 | 48 | 72;
  requiredQuantity?: number;
}

export interface SendMessageInput {
  negotiationId: string;
  senderActorId: string;
  body: string;
  messageType?: MessageType;
}

export interface CreateProposalInput {
  negotiationId: string;
  createdByActorId: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  deliveryDate?: string;
  logisticsMode?: LogisticsMode;
}

export interface ConversationAdapter {
  startConversation(input: StartConversationInput): Promise<NegotiationRecord>;
  getNegotiation(id: string, requesterActorId: string): Promise<NegotiationRecord | null>;
  listMessages(negotiationId: string, requesterActorId: string): Promise<MessageRecord[]>;
  sendMessage(input: SendMessageInput): Promise<MessageRecord>;
  createProposal(input: CreateProposalInput): Promise<ProposalRecord>;
  respondToProposal(
    negotiationId: string,
    proposalId: string,
    actorId: string,
    action: ProposalResponseAction,
  ): Promise<NegotiationRecord>;
  cancelConversation(negotiationId: string, actorId: string): Promise<NegotiationRecord>;
}

export class ConversationServerConfigurationError extends Error {}
export class ConversationNotFoundError extends Error {}
export class ConversationPermissionError extends Error {}
export class ConversationTransitionError extends Error {}

const TERMINAL_STATUSES: ReadonlySet<NegotiationStatus> = new Set([
  "ACCEPTED",
  "REJECTED",
  "EXPIRED",
  "CANCELLED",
]);

interface ConversationState {
  negotiations: Map<string, NegotiationRecord>;
  messages: Map<string, MessageRecord[]>;
  proposals: Map<string, ProposalRecord[]>;
}

const globalConversationState = globalThis as typeof globalThis & {
  conectaConversationStore?: ConversationState;
};

function getState(): ConversationState {
  return (
    globalConversationState.conectaConversationStore ??
    (globalConversationState.conectaConversationStore = {
      negotiations: new Map(),
      messages: new Map(),
      proposals: new Map(),
    })
  );
}

function assertParticipant(negotiation: NegotiationRecord, actorId: string): void {
  if (negotiation.buyerActorId !== actorId && negotiation.producerActorId !== actorId) {
    throw new ConversationPermissionError(
      `Actor ${actorId} is not a participant of negotiation ${negotiation.id}`,
    );
  }
}

// Lazily expires a COUNTERED negotiation whose window has elapsed (S0-07 rule:
// no response before expiresAt -> EXPIRED, read-only from then on).
function applyExpiry(negotiation: NegotiationRecord): NegotiationRecord {
  if (
    negotiation.status === "COUNTERED" &&
    negotiation.expiresAt &&
    new Date(negotiation.expiresAt).getTime() <= Date.now()
  ) {
    const expired: NegotiationRecord = {
      ...negotiation,
      status: "EXPIRED",
      updatedAt: new Date().toISOString(),
    };
    getState().negotiations.set(negotiation.id, expired);
    return expired;
  }
  return negotiation;
}

function requireNegotiation(id: string): NegotiationRecord {
  const negotiation = getState().negotiations.get(id);
  if (!negotiation) {
    throw new ConversationNotFoundError(`Negotiation ${id} not found`);
  }
  return applyExpiry(negotiation);
}

const demoAdapter: ConversationAdapter = {
  async startConversation(input) {
    if (!input.offerListingId && !input.requestListingId) {
      throw new ConversationTransitionError(
        "A conversation needs an offer or a request listing as context",
      );
    }
    const now = new Date().toISOString();
    const negotiation: NegotiationRecord = {
      id: randomUUID(),
      offerListingId: input.offerListingId,
      requestListingId: input.requestListingId,
      buyerActorId: input.buyerActorId,
      producerActorId: input.producerActorId,
      status: "OPEN",
      windowHours: input.windowHours ?? 24,
      requiredQuantity: input.requiredQuantity,
      expiresAt: null,
      createdAt: now,
      updatedAt: now,
    };
    getState().negotiations.set(negotiation.id, negotiation);
    return negotiation;
  },

  async getNegotiation(id, requesterActorId) {
    const negotiation = getState().negotiations.get(id);
    if (!negotiation) return null;
    const current = applyExpiry(negotiation);
    assertParticipant(current, requesterActorId);
    return current;
  },

  async listMessages(negotiationId, requesterActorId) {
    const negotiation = requireNegotiation(negotiationId);
    assertParticipant(negotiation, requesterActorId);
    return getState().messages.get(negotiationId) ?? [];
  },

  async sendMessage(input) {
    const negotiation = requireNegotiation(input.negotiationId);
    assertParticipant(negotiation, input.senderActorId);
    if (TERMINAL_STATUSES.has(negotiation.status)) {
      throw new ConversationTransitionError(
        `Negotiation ${negotiation.id} is ${negotiation.status} and is read-only`,
      );
    }

    const message: MessageRecord = {
      id: randomUUID(),
      negotiationId: input.negotiationId,
      senderActorId: input.senderActorId,
      messageType: input.messageType ?? "TEXT",
      body: input.body,
      createdAt: new Date().toISOString(),
    };

    const state = getState();
    const existing = state.messages.get(input.negotiationId) ?? [];
    state.messages.set(input.negotiationId, [...existing, message]);
    publishMessage(input.negotiationId, message);
    return message;
  },

  async createProposal(input) {
    const negotiation = requireNegotiation(input.negotiationId);
    assertParticipant(negotiation, input.createdByActorId);
    if (TERMINAL_STATUSES.has(negotiation.status)) {
      throw new ConversationTransitionError(
        `Negotiation ${negotiation.id} is ${negotiation.status} and cannot receive new proposals`,
      );
    }

    const state = getState();
    const existingProposals = state.proposals.get(input.negotiationId) ?? [];
    // Only one active proposal at a time: a new one supersedes it (S0-07 rule).
    const withSuperseded = existingProposals.map((proposal) =>
      proposal.status === "ACTIVE" ? { ...proposal, status: "SUPERSEDED" as const } : proposal,
    );

    const proposal: ProposalRecord = {
      id: randomUUID(),
      negotiationId: input.negotiationId,
      createdByActorId: input.createdByActorId,
      quantity: input.quantity,
      unit: input.unit,
      unitPrice: input.unitPrice,
      deliveryDate: input.deliveryDate,
      logisticsMode: input.logisticsMode,
      status: "ACTIVE",
      createdAt: new Date().toISOString(),
    };
    state.proposals.set(input.negotiationId, [...withSuperseded, proposal]);

    const windowMs = negotiation.windowHours * 60 * 60_000;
    state.negotiations.set(input.negotiationId, {
      ...negotiation,
      status: "COUNTERED",
      expiresAt: new Date(Date.now() + windowMs).toISOString(),
      updatedAt: new Date().toISOString(),
    });

    return proposal;
  },

  async respondToProposal(negotiationId, proposalId, actorId, action) {
    const negotiation = requireNegotiation(negotiationId);
    assertParticipant(negotiation, actorId);
    if (negotiation.status !== "COUNTERED") {
      throw new ConversationTransitionError(
        `Negotiation ${negotiationId} has no active proposal to respond to`,
      );
    }

    const state = getState();
    const proposals = state.proposals.get(negotiationId) ?? [];
    const proposal = proposals.find((p) => p.id === proposalId && p.status === "ACTIVE");
    if (!proposal) {
      throw new ConversationNotFoundError(`Active proposal ${proposalId} not found`);
    }
    if (proposal.createdByActorId === actorId) {
      throw new ConversationPermissionError("A proposal cannot be answered by its own author");
    }

    const nextProposalStatus: ProposalStatus = action === "accept" ? "ACCEPTED" : "REJECTED";
    const nextNegotiationStatus: NegotiationStatus = action === "accept" ? "ACCEPTED" : "REJECTED";

    state.proposals.set(
      negotiationId,
      proposals.map((p) => (p.id === proposalId ? { ...p, status: nextProposalStatus } : p)),
    );

    let orderId: string | undefined;
    if (action === "accept") {
      // S2-07: accepting a proposal creates the same order structure a quick
      // offer accept does — only the `source` differs. S2-08: when the
      // negotiation is over a REQUEST listing, this joins the buyer's
      // existing order for that request instead of starting a new one.
      const order = await createOrderFromAcceptedProposal({
        buyerActorId: negotiation.buyerActorId,
        producerActorId: negotiation.producerActorId,
        offerListingId: negotiation.offerListingId,
        quantity: proposal.quantity,
        unit: proposal.unit,
        unitPrice: proposal.unitPrice,
        negotiationId,
        requestListingId: negotiation.requestListingId,
        requiredQuantity: negotiation.requiredQuantity,
      });
      orderId = order.id;
    }

    const updated: NegotiationRecord = {
      ...negotiation,
      status: nextNegotiationStatus,
      orderId,
      updatedAt: new Date().toISOString(),
    };
    state.negotiations.set(negotiationId, updated);
    return updated;
  },

  async cancelConversation(negotiationId, actorId) {
    const negotiation = requireNegotiation(negotiationId);
    assertParticipant(negotiation, actorId);
    if (negotiation.status !== "OPEN") {
      throw new ConversationTransitionError(
        `Negotiation ${negotiationId} can only be cancelled before a proposal is sent`,
      );
    }
    const updated: NegotiationRecord = {
      ...negotiation,
      status: "CANCELLED",
      updatedAt: new Date().toISOString(),
    };
    getState().negotiations.set(negotiationId, updated);
    return updated;
  },
};

function resolveAdapter(adapter?: ConversationAdapter): ConversationAdapter {
  if (adapter) return adapter;
  if (process.env.NODE_ENV === "production") {
    throw new ConversationServerConfigurationError(
      "Conversation CRUD requires a real adapter (negotiations/messages/commercial_proposals) in production",
    );
  }
  return demoAdapter;
}

export async function startConversation(
  input: StartConversationInput,
  adapter?: ConversationAdapter,
): Promise<NegotiationRecord> {
  return resolveAdapter(adapter).startConversation(input);
}

export async function getNegotiation(
  id: string,
  requesterActorId: string,
  adapter?: ConversationAdapter,
): Promise<NegotiationRecord | null> {
  return resolveAdapter(adapter).getNegotiation(id, requesterActorId);
}

export async function listMessages(
  negotiationId: string,
  requesterActorId: string,
  adapter?: ConversationAdapter,
): Promise<MessageRecord[]> {
  return resolveAdapter(adapter).listMessages(negotiationId, requesterActorId);
}

export async function sendMessage(
  input: SendMessageInput,
  adapter?: ConversationAdapter,
): Promise<MessageRecord> {
  return resolveAdapter(adapter).sendMessage(input);
}

export async function createProposal(
  input: CreateProposalInput,
  adapter?: ConversationAdapter,
): Promise<ProposalRecord> {
  return resolveAdapter(adapter).createProposal(input);
}

export async function respondToProposal(
  negotiationId: string,
  proposalId: string,
  actorId: string,
  action: ProposalResponseAction,
  adapter?: ConversationAdapter,
): Promise<NegotiationRecord> {
  return resolveAdapter(adapter).respondToProposal(negotiationId, proposalId, actorId, action);
}

export async function cancelConversation(
  negotiationId: string,
  actorId: string,
  adapter?: ConversationAdapter,
): Promise<NegotiationRecord> {
  return resolveAdapter(adapter).cancelConversation(negotiationId, actorId);
}

export function resetDemoConversationStore(): void {
  globalConversationState.conectaConversationStore = {
    negotiations: new Map(),
    messages: new Map(),
    proposals: new Map(),
  };
}
