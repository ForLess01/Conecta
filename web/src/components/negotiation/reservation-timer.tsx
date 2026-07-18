"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

function secondsUntil(expiresAt?: string, minutes?: number) {
  return expiresAt
    ? Math.max(0, Math.ceil((new Date(expiresAt).getTime() - Date.now()) / 1000))
    : (minutes ?? 0) * 60;
}

export function ReservationTimer({ minutes, expiresAt, className }: { minutes?: number; expiresAt?: string; className?: string }) {
  const [secondsLeft, setSecondsLeft] = useState(() => secondsUntil(expiresAt, minutes));

  useEffect(() => {
    const interval = setInterval(() => {
      setSecondsLeft(secondsUntil(expiresAt, minutes));
    }, 1000);
    return () => clearInterval(interval);
  }, [expiresAt, minutes]);

  const mm = String(Math.floor(secondsLeft / 60)).padStart(2, "0");
  const ss = String(secondsLeft % 60).padStart(2, "0");

  return (
    <div className={cn("flex flex-col items-center gap-1", className)}>
      <span className="text-xs text-muted-foreground">Reserva de inventario</span>
      <span className="font-heading text-3xl font-semibold tabular-nums">
        {mm}:{ss}
      </span>
      <span className="text-xs text-muted-foreground">
        {secondsLeft > 0 ? "Tiempo restante para continuar a logística" : "La reserva ha vencido"}
      </span>
    </div>
  );
}
