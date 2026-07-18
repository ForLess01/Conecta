"use client";

import { useDeferredValue, useState } from "react";
import Link from "next/link";
import { MessagesSquare, Search } from "lucide-react";
import { DesktopTopBar } from "@/components/layout/top-bar";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { EmptyState } from "@/components/shared/empty-state";
import { cn } from "@/lib/utils";
import { formatDateTime } from "@/lib/format";
import type { NegotiationSummary } from "@/lib/server/commerce/types";

const FILTERS = [
  { value: "all", label: "Todas" },
  { value: "active", label: "Activas" },
  { value: "proposal", label: "Con propuesta" },
  { value: "closed", label: "Cerradas" },
] as const;

const ACTIVE_STATUSES = new Set(["OPEN", "OFFER_SUBMITTED", "COUNTERED"]);

export function NegotiationsInbox({ negotiations }: { negotiations: NegotiationSummary[] }) {
  const [filter, setFilter] = useState<(typeof FILTERS)[number]["value"]>("all");
  const [query, setQuery] = useState("");
  const deferredQuery = useDeferredValue(query.trim().toLocaleLowerCase("es"));
  const filtered = negotiations.filter((negotiation) => {
    const active = ACTIVE_STATUSES.has(negotiation.status);
    const matchesFilter = filter === "all"
      || (filter === "active" && active)
      || (filter === "proposal" && negotiation.hasActiveProposal)
      || (filter === "closed" && !active);
    return matchesFilter && (!deferredQuery || `${negotiation.productName} ${negotiation.counterpartName}`.toLocaleLowerCase("es").includes(deferredQuery));
  });

  return (
    <div className="space-y-5">
      <DesktopTopBar title="Negociaciones" description="Conversaciones y propuestas comerciales vigentes." />
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar por producto o contraparte" className="pl-9" />
        </div>
        <div className="flex flex-wrap gap-2">
          {FILTERS.map((item) => (
            <button key={item.value} type="button" onClick={() => setFilter(item.value)} className={cn(
              "rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
              filter === item.value ? "border-primary bg-secondary" : "border-border bg-card text-muted-foreground hover:bg-muted",
            )}>{item.label}</button>
          ))}
        </div>
      </div>
      {filtered.length === 0 ? (
        <EmptyState icon={MessagesSquare} title="Sin conversaciones" description="Tus negociaciones aparecerán aquí." />
      ) : (
        <div className="space-y-2">
          {filtered.map((negotiation) => (
            <Link key={negotiation.id} href={`/negotiations/${negotiation.id}`} className="flex items-center gap-3 rounded-2xl border border-border bg-card p-4 transition-colors hover:bg-muted">
              <div className="flex size-11 shrink-0 items-center justify-center rounded-full bg-secondary text-sm font-semibold text-secondary-foreground">
                {negotiation.counterpartName.slice(0, 2).toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <p className="truncate text-sm font-medium">{negotiation.productName} · {negotiation.counterpartName}</p>
                  {negotiation.hasActiveProposal && <Badge variant="secondary">Propuesta activa</Badge>}
                </div>
                <p className="truncate text-xs text-muted-foreground">{negotiation.lastMessage ?? "Conversación iniciada"}</p>
              </div>
              <span className="shrink-0 text-xs text-muted-foreground">{negotiation.expiresAt ? formatDateTime(negotiation.expiresAt) : negotiation.status}</span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
