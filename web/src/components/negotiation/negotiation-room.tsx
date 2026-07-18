"use client";

import { startTransition, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Clock, Send } from "lucide-react";
import { toast } from "sonner";
import { DesktopTopBar } from "@/components/layout/top-bar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CreateProposalDialog } from "@/components/negotiation/create-proposal-dialog";
import { ProposalCard } from "@/components/negotiation/proposal-card";
import { formatDateTime } from "@/lib/format";
import { subscribeToNegotiationStream } from "@/lib/negotiation/realtime-client";
import { cn } from "@/lib/utils";
import type { CommerceMessage, NegotiationDetail } from "@/lib/server/commerce/types";

async function post(url: string, body: unknown) {
  const response = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  const result = await response.json();
  if (!response.ok) throw new Error(result.error ?? "The operation could not be completed.");
  return result;
}

export function NegotiationRoom({ negotiation }: { negotiation: NegotiationDetail }) {
  const router = useRouter();
  const [draft, setDraft] = useState("");
  const [proposalOpen, setProposalOpen] = useState(false);
  const [counterProposalId, setCounterProposalId] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [liveMessages, setLiveMessages] = useState<CommerceMessage[]>([]);
  const activeProposal = negotiation.proposals.find((proposal) => proposal.status === "ACTIVE");
  const closed = !["OPEN", "OFFER_SUBMITTED", "COUNTERED"].includes(negotiation.status);
  const messages = [...negotiation.messages, ...liveMessages.filter(
    (liveMessage) => !negotiation.messages.some((message) => message.id === liveMessage.id),
  )].sort((left, right) => left.createdAt.localeCompare(right.createdAt));

  useEffect(() => subscribeToNegotiationStream(negotiation.id, (event) => {
    if (event.type === "refresh") {
      startTransition(() => router.refresh());
      return;
    }
    setLiveMessages((current) => current.some((message) => message.id === event.message.id)
      ? current
      : [...current, event.message]);
  }), [negotiation.id, router]);

  function refresh() {
    startTransition(() => router.refresh());
  }

  async function send() {
    if (!draft.trim() || pending) return;
    setPending(true);
    try {
      const message = await post(`/api/negotiations/${negotiation.id}/messages`, { body: draft }) as CommerceMessage;
      setLiveMessages((current) => current.some((item) => item.id === message.id) ? current : [...current, message]);
      setDraft("");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo enviar el mensaje.");
    } finally {
      setPending(false);
    }
  }

  async function decide(proposalId: string, decision: "accept" | "reject") {
    setPending(true);
    try {
      const result = await post(`/api/negotiations/${negotiation.id}/proposals/${proposalId}`, { decision });
      if (result.order_id) router.push(`/negotiations/${negotiation.id}/match`);
      else {
        toast.info("Propuesta rechazada.");
        refresh();
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo responder la propuesta.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="space-y-4">
      <DesktopTopBar title={negotiation.counterpartName} description={`${negotiation.productName}${negotiation.varietyName ? ` · ${negotiation.varietyName}` : ""}`} />
      <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
        <div className="flex h-[65vh] flex-col rounded-2xl border border-border bg-card">
          <div className="flex-1 space-y-3 overflow-y-auto p-4">
            {messages.map((message) => {
              const mine = message.senderActorId === negotiation.actorId;
              const system = message.type !== "TEXT";
              if (system) return <p key={message.id} className="text-center text-xs text-muted-foreground">{message.body}</p>;
              return <div key={message.id} className={cn("flex", mine ? "justify-end" : "justify-start")}>
                <div className={cn("max-w-[75%] rounded-2xl px-3.5 py-2 text-sm", mine ? "bg-primary text-primary-foreground" : "bg-muted")}>
                  {message.body}
                  <p className={cn("mt-1 text-[10px]", mine ? "text-primary-foreground/70" : "text-muted-foreground")}>{formatDateTime(message.createdAt)}</p>
                </div>
              </div>;
            })}
          </div>
          <div className="flex items-center gap-2 border-t border-border p-3">
            <Input value={draft} onChange={(event) => setDraft(event.target.value)} onKeyDown={(event) => event.key === "Enter" && void send()} placeholder="Escribe un mensaje" disabled={closed || pending} />
            <Button size="icon" onClick={() => void send()} aria-label="Enviar mensaje" disabled={closed || pending || !draft.trim()}><Send className="size-4" /></Button>
          </div>
          <div className="flex flex-wrap gap-2 border-t border-border p-3">
            <Button size="sm" onClick={() => { setCounterProposalId(null); setProposalOpen(true); }} disabled={closed || pending}>Crear propuesta</Button>
          </div>
        </div>
        <aside className="space-y-4">
          <div className="rounded-2xl border border-border bg-card p-4">
            <p className="text-xs text-muted-foreground">Producto</p>
            <p className="font-semibold">{negotiation.productName}</p>
            {negotiation.expiresAt && <p className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground"><Clock className="size-3.5" />Vence {formatDateTime(negotiation.expiresAt)}</p>}
          </div>
          {activeProposal ? <ProposalCard
            proposal={activeProposal}
            canRespond={activeProposal.createdByActorId !== negotiation.actorId}
            pending={pending}
            onAccept={() => void decide(activeProposal.id, "accept")}
            onReject={() => void decide(activeProposal.id, "reject")}
            onCounter={() => { setCounterProposalId(activeProposal.id); setProposalOpen(true); }}
          /> : <p className="text-sm text-muted-foreground">No hay una propuesta activa.</p>}
        </aside>
      </div>
      <CreateProposalDialog
        open={proposalOpen}
        onOpenChange={setProposalOpen}
        defaults={{ quantity: activeProposal?.quantity ?? 1, unit: negotiation.unit, unitPrice: activeProposal?.unitPrice ?? 1, deliveryDate: activeProposal?.deliveryDate ?? "", logisticsMode: activeProposal?.logisticsMode ?? "MARKETPLACE_FREIGHT" }}
        pending={pending}
        onSubmit={async (proposal) => {
          setPending(true);
          try {
            await post(`/api/negotiations/${negotiation.id}/proposals`, { ...proposal, currencyCode: "PEN", supersedesProposalId: counterProposalId });
            setProposalOpen(false);
            toast.success(counterProposalId ? "Contraoferta enviada." : "Propuesta enviada.");
            refresh();
          } catch (error) {
            toast.error(error instanceof Error ? error.message : "No se pudo enviar la propuesta.");
          } finally {
            setPending(false);
          }
        }}
      />
    </div>
  );
}
