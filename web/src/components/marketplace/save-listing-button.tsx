"use client";

import { useState, useTransition } from "react";
import { Bookmark } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { toggleSavedListing } from "@/lib/server/saved/actions";
import { cn } from "@/lib/utils";

export function SaveListingButton({ listingId, initialSaved, inline = false }: { listingId: string; initialSaved: boolean; inline?: boolean }) {
  const [saved, setSaved] = useState(initialSaved);
  const [pending, startTransition] = useTransition();

  function toggle() {
    startTransition(async () => {
      try {
        const result = await toggleSavedListing(listingId);
        setSaved(result.saved);
        toast.success(result.saved ? "Publicación guardada." : "Publicación eliminada de guardados.");
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "No se pudo actualizar el guardado.");
      }
    });
  }

  return (
    <Button
      type="button"
      variant={inline ? "ghost" : "secondary"}
      size={inline ? "default" : "icon"}
      disabled={pending}
      onClick={toggle}
      className={cn(!inline && "absolute right-3 top-3 size-8", saved && "text-primary")}
      aria-label={saved ? "Quitar de guardados" : "Guardar publicación"}
    >
      <Bookmark className={cn("size-4", saved && "fill-current")} />
      {inline && <span>{saved ? "Guardado" : "Guardar"}</span>}
    </Button>
  );
}
