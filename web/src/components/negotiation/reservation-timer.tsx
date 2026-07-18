"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

export function ReservationTimer({ minutes, className }: { minutes: number; className?: string }) {
  const [secondsLeft, setSecondsLeft] = useState(minutes * 60);

  useEffect(() => {
    const interval = setInterval(() => {
      setSecondsLeft((s) => Math.max(0, s - 1));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

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
