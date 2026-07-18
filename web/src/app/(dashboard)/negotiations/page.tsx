"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { DesktopTopBar } from "@/components/layout/top-bar";
import { NEGOTIATIONS } from "@/lib/mock/negotiations";
import { getProductById } from "@/lib/mock/products";
import { PRODUCERS, BUYERS } from "@/lib/mock/actors";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { EmptyState } from "@/components/shared/empty-state";
import { cn } from "@/lib/utils";
import { MessagesSquare, Search } from "lucide-react";
import { formatDateTime } from "@/lib/format";
import { avatarUrl } from "@/lib/avatars";

const FILTERS = [
  { value: "todas", label: "Todas" },
  { value: "activa", label: "Activas" },
  { value: "con_propuesta", label: "Con propuesta" },
  { value: "vencida", label: "Vencidas" },
] as const;

export default function NegotiationsInboxPage() {
  const [filter, setFilter] = useState<(typeof FILTERS)[number]["value"]>("todas");
  const [query, setQuery] = useState("");

  const filtered = NEGOTIATIONS.filter((n) => {
    const product = getProductById(n.productId);
    const matchesFilter = filter === "todas" || n.status === filter;
    const matchesQuery = query.trim() === "" || product?.name.toLowerCase().includes(query.toLowerCase());
    return matchesFilter && matchesQuery;
  });

  return (
    <div className="space-y-5">
      <DesktopTopBar title="Negociaciones" description="Conversaciones activas, con propuesta o vencidas." />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Buscar por producto…" className="pl-9" />
        </div>
        <div className="flex flex-wrap gap-2">
          {FILTERS.map((f) => (
            <button
              key={f.value}
              onClick={() => setFilter(f.value)}
              className={cn(
                "rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
                filter === f.value ? "border-primary bg-secondary" : "border-border bg-card text-muted-foreground hover:bg-muted"
              )}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon={MessagesSquare} title="Sin conversaciones" description="Cuando inicies una negociación conversacional aparecerá aquí." />
      ) : (
        <div className="space-y-2">
          {filtered.map((negotiation) => {
            const product = getProductById(negotiation.productId);
            const counterpart = PRODUCERS.find((p) => p.id === negotiation.producerId) ?? BUYERS.find((b) => b.id === negotiation.buyerId);
            const hasActiveProposal = negotiation.proposals.some((p) => p.status === "activa");
            return (
              <Link
                key={negotiation.id}
                href={`/negotiations/${negotiation.id}`}
                className="flex items-center gap-3 rounded-2xl border border-border bg-card p-4 transition-colors hover:bg-muted"
              >
                {counterpart && avatarUrl(counterpart.id) ? (
                  <Image
                    src={avatarUrl(counterpart.id)!}
                    alt={`Fotografía de ${counterpart.name}`}
                    width={44}
                    height={44}
                    className="size-11 shrink-0 rounded-full object-cover"
                  />
                ) : (
                  <div className="flex size-11 shrink-0 items-center justify-center rounded-full bg-secondary text-sm font-semibold text-secondary-foreground">
                    {counterpart?.name.slice(0, 2).toUpperCase()}
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className="truncate text-sm font-medium">{product?.name} · {counterpart?.name}</p>
                    {hasActiveProposal && <Badge variant="secondary" className="shrink-0">Propuesta activa</Badge>}
                  </div>
                  <p className="truncate text-xs text-muted-foreground">{negotiation.lastMessagePreview}</p>
                </div>
                <span className="shrink-0 text-xs text-muted-foreground">
                  {negotiation.status === "vencida" ? "Vencida" : formatDateTime(negotiation.windowExpiresAt)}
                </span>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
