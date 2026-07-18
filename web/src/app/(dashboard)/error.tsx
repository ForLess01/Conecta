"use client";

import { useEffect } from "react";
import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function DashboardError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="mx-auto flex max-w-md flex-col items-center gap-4 py-16 text-center">
      <AlertCircle className="size-10 text-destructive" aria-hidden="true" />
      <div>
        <h1 className="font-heading text-xl font-semibold">No pudimos cargar esta pantalla</h1>
        <p className="mt-2 text-sm text-muted-foreground">Revisá tu conexión e intentá nuevamente. Tu sesión y tus datos siguen protegidos.</p>
      </div>
      <Button type="button" onClick={reset}>Intentar nuevamente</Button>
    </div>
  );
}
