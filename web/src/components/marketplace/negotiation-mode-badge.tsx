import { Zap, MessagesSquare } from "lucide-react";
import { cn } from "@/lib/utils";
import type { NegotiationMode } from "@/types/domain";

const CONFIG: Record<NegotiationMode, { icon: typeof Zap; label: string }> = {
  rapida: { icon: Zap, label: "Negociación rápida" },
  conversacional: { icon: MessagesSquare, label: "Conversacional" },
  ambas: { icon: Zap, label: "Rápida y conversacional" },
};

export function NegotiationModeBadge({ mode, className }: { mode: NegotiationMode; className?: string }) {
  const { icon: Icon, label } = CONFIG[mode];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full bg-secondary px-2.5 py-1 text-xs font-medium text-secondary-foreground",
        className
      )}
    >
      <Icon className="size-3.5" />
      {label}
    </span>
  );
}
