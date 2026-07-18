"use client";

import { use, useState } from "react";
import { useRouter } from "next/navigation";
import { notFound } from "next/navigation";
import { toast } from "sonner";
import { Paperclip, FileText, Send, Clock, PanelRightOpen } from "lucide-react";
import { getNegotiationById } from "@/lib/mock/negotiations";
import { getProductById } from "@/lib/mock/products";
import { PRODUCERS, BUYERS } from "@/lib/mock/actors";
import { DesktopTopBar } from "@/components/layout/top-bar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { ProposalCard } from "@/components/negotiation/proposal-card";
import { CreateProposalDialog } from "@/components/negotiation/create-proposal-dialog";
import { PriceSuggestionBadge } from "@/components/marketplace/price-suggestion-badge";
import type { Message, Proposal } from "@/types/domain";
import { formatDateTime } from "@/lib/format";
import { cn } from "@/lib/utils";

export default function NegotiationRoomPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const negotiationLookup = getNegotiationById(id);
  const router = useRouter();

  const [messages, setMessages] = useState<Message[]>(negotiationLookup?.messages ?? []);
  const [proposals, setProposals] = useState<Proposal[]>(negotiationLookup?.proposals ?? []);
  const [draft, setDraft] = useState("");
  const [proposalOpen, setProposalOpen] = useState(false);

  if (!negotiationLookup) notFound();
  const negotiation = negotiationLookup;

  const product = getProductById(negotiation.productId);
  const counterpart = PRODUCERS.find((p) => p.id === negotiation.producerId) ?? BUYERS.find((b) => b.id === negotiation.buyerId);
  const activeProposal = proposals.find((p) => p.status === "activa");
  // Fixed reference date (consistent with the local dataset) instead of
  // a Date.now()-derived value, which would be an impure render computation.
  const defaultDeliveryDate = "2026-07-24";

  function sendMessage() {
    if (!draft.trim()) return;
    setMessages((prev) => [
      ...prev,
      {
        id: `msg-local-${prev.length}`,
        senderId: "me",
        senderRole: "comprador",
        type: "texto",
        content: draft,
        createdAt: new Date().toISOString(),
        read: false,
      },
    ]);
    setDraft("");
  }

  function acceptProposal() {
    setProposals((prev) => prev.map((p) => (p.status === "activa" ? { ...p, status: "aceptada" } : p)));
    toast.success("Propuesta aceptada. Se generó una orden.");
    router.push(`/negotiations/${negotiation.id}/match`);
  }

  function rejectProposal() {
    setProposals((prev) => prev.map((p) => (p.status === "activa" ? { ...p, status: "rechazada" } : p)));
    toast.info("Propuesta rechazada.");
  }

  function goCompare() {
    router.push(`/negotiations/${negotiation.id}/compare`);
  }

  const summary = product && (
    <div className="space-y-4">
      <div>
        <p className="text-xs font-medium text-muted-foreground">Producto</p>
        <p className="text-sm font-semibold">{product.name}</p>
        <p className="text-xs text-muted-foreground">{product.variety}</p>
      </div>
      <PriceSuggestionBadge range={product.priceRange} compact />
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <Clock className="size-3.5" />
        Ventana vence {formatDateTime(negotiation.windowExpiresAt)}
      </div>
      <div>
        <p className="mb-2 text-xs font-medium text-muted-foreground">Propuesta activa</p>
        {activeProposal ? (
          <ProposalCard proposal={activeProposal} onAccept={acceptProposal} onCounter={goCompare} onReject={rejectProposal} />
        ) : (
          <p className="text-xs text-muted-foreground">Sin propuesta activa todavía.</p>
        )}
      </div>
    </div>
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <DesktopTopBar title={counterpart?.name ?? "Negociación"} description={product?.name} />
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="outline" size="sm" className="lg:hidden gap-1.5">
              <PanelRightOpen className="size-4" /> Resumen
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-full max-w-sm px-4">
            <SheetHeader>
              <SheetTitle>Resumen comercial</SheetTitle>
            </SheetHeader>
            <div className="mt-4">{summary}</div>
          </SheetContent>
        </Sheet>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
        <div className="flex h-[65vh] flex-col rounded-2xl border border-border bg-card">
          <div className="flex-1 space-y-3 overflow-y-auto p-4">
            {messages.map((message) => {
              const isSystem = message.type === "sistema";
              const isMe = message.senderId === "me" || message.senderId === negotiation.buyerId;
              if (isSystem) {
                return (
                  <p key={message.id} className="text-center text-xs text-muted-foreground">
                    {message.content}
                  </p>
                );
              }
              return (
                <div key={message.id} className={cn("flex", isMe ? "justify-end" : "justify-start")}>
                  <div
                    className={cn(
                      "max-w-[75%] rounded-2xl px-3.5 py-2 text-sm",
                      isMe ? "bg-primary text-primary-foreground" : "bg-muted"
                    )}
                  >
                    {message.content}
                    <p className={cn("mt-1 text-[10px]", isMe ? "text-primary-foreground/70" : "text-muted-foreground")}>
                      {formatDateTime(message.createdAt)}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex items-center gap-2 border-t border-border p-3">
            <Button variant="ghost" size="icon" aria-label="Adjuntar imagen">
              <Paperclip className="size-4" />
            </Button>
            <Button variant="ghost" size="icon" aria-label="Adjuntar documento">
              <FileText className="size-4" />
            </Button>
            <Input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && sendMessage()}
              placeholder="Escribe un mensaje…"
            />
            <Button size="icon" onClick={sendMessage} aria-label="Enviar mensaje">
              <Send className="size-4" />
            </Button>
          </div>

          <div className="flex flex-wrap gap-2 border-t border-border p-3">
            <Button size="sm" onClick={() => setProposalOpen(true)}>Crear propuesta</Button>
            <Button size="sm" variant="outline">Solicitar muestra</Button>
          </div>
        </div>

        <div className="hidden lg:block">{summary}</div>
      </div>

      {product && (
        <CreateProposalDialog
          open={proposalOpen}
          onOpenChange={setProposalOpen}
          defaults={{
            quantity: product.minOrder,
            unit: product.unit,
            pricePerUnit: product.priceRange.central,
            deliveryDate: defaultDeliveryDate,
            qualityTerms: product.quality,
            logisticsMode: "Buscar transporte en marketplace",
          }}
          onSubmit={(proposal) => {
            setProposals((prev) => [
              ...prev.map((p) => ({ ...p, status: p.status === "activa" ? ("vencida" as const) : p.status })),
              {
                id: `prop-local-${prev.length}`,
                negotiationId: negotiation.id,
                authorId: "me",
                status: "activa",
                ...proposal,
              },
            ]);
            setMessages((prev) => [
              ...prev,
              {
                id: `msg-local-${prev.length}`,
                senderId: "me",
                senderRole: "comprador",
                type: "sistema",
                content: "Se creó una nueva propuesta estructurada.",
                createdAt: new Date().toISOString(),
                read: false,
              },
            ]);
            toast.success("Propuesta enviada.");
          }}
        />
      )}
    </div>
  );
}
