"use client";

import { useState, useTransition } from "react";
import { Bookmark } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { toggleSavedActor } from "@/lib/server/saved/actions";

export function SaveActorButton({ actorId, initialSaved }: { actorId: string; initialSaved: boolean }) {
  const [saved, setSaved] = useState(initialSaved);
  const [pending, startTransition] = useTransition();
  return <Button type="button" variant="outline" disabled={pending} onClick={() => startTransition(async () => {
    try {
      const result = await toggleSavedActor(actorId);
      setSaved(result.saved);
      toast.success(result.saved ? "Perfil guardado." : "Perfil eliminado de guardados.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo guardar el perfil.");
    }
  })}><Bookmark className={`size-4 ${saved ? "fill-current text-primary" : ""}`} /> {saved ? "Guardado" : "Guardar perfil"}</Button>;
}
