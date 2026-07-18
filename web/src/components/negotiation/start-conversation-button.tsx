"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { MessagesSquare } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

export function StartConversationButton({
  listingId,
  label = "Conversar y negociar",
  variant = "outline",
  size = "default",
}: {
  listingId: string;
  label?: string;
  variant?: "default" | "outline";
  size?: "default" | "lg";
}) {
  const router = useRouter();
  const [isStarting, setIsStarting] = useState(false);

  async function startConversation() {
    setIsStarting(true);
    try {
      const response = await fetch("/api/negotiations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ listingId }),
      });
      const payload = (await response.json().catch(() => null)) as {
        negotiationId?: string;
        error?: string;
      } | null;

      if (!response.ok || !payload?.negotiationId) {
        toast.error(payload?.error ?? "No pudimos iniciar la negociación.");
        return;
      }

      router.push(`/negotiations/${payload.negotiationId}`);
      router.refresh();
    } catch {
      toast.error("No pudimos conectarnos. Revisá tu conexión e intentá nuevamente.");
    } finally {
      setIsStarting(false);
    }
  }

  return (
    <Button type="button" variant={variant} size={size} className="w-full gap-2" onClick={startConversation} disabled={isStarting}>
      <MessagesSquare className="size-4" aria-hidden="true" />
      {isStarting ? "Abriendo…" : label}
    </Button>
  );
}
