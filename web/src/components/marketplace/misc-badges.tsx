import { BadgeCheck, MapPin, Layers } from "lucide-react";
import { cn } from "@/lib/utils";
import type { VerificationLevel } from "@/types/domain";

const VERIFICATION_LABEL: Record<VerificationLevel, string> = {
  sin_verificar: "Sin verificar",
  basico: "Verificación básica",
  verificado: "Verificado",
  confiable: "Confiable",
};

export function VerificationBadge({ level, className }: { level: VerificationLevel; className?: string }) {
  if (level === "sin_verificar") return null;
  return (
    <span className={cn("inline-flex items-center gap-1 text-xs font-medium text-primary", className)}>
      <BadgeCheck className="size-3.5" />
      {VERIFICATION_LABEL[level]}
    </span>
  );
}

export function LocationBadge({ label, className }: { label: string; className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-1 text-xs text-muted-foreground", className)}>
      <MapPin className="size-3.5" />
      {label}
    </span>
  );
}

export function QuantityBadge({ label, className }: { label: string; className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-1 text-xs text-muted-foreground", className)}>
      <Layers className="size-3.5" />
      {label}
    </span>
  );
}
