"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { ReservationTimer } from "@/components/negotiation/reservation-timer";

export function OrderReservationTimer({ expiresAt }: { expiresAt: string }) {
  const router = useRouter();
  const [, startTransition] = useTransition();

  return (
    <ReservationTimer
      expiresAt={expiresAt}
      onExpire={() => startTransition(() => router.refresh())}
    />
  );
}
