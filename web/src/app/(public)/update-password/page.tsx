"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/client";

export default function UpdatePasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function updatePassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (password.length < 8) {
      toast.error("La contraseña debe tener al menos 8 caracteres.");
      return;
    }

    setIsSubmitting(true);
    const { error } = await createClient().auth.updateUser({ password });
    setIsSubmitting(false);

    if (error) {
      toast.error("No pudimos actualizar la contraseña. Solicita un nuevo enlace.");
      return;
    }

    toast.success("Contraseña actualizada.");
    router.replace("/home");
  }

  return (
    <main className="mx-auto flex min-h-[calc(100vh-65px)] max-w-md items-center px-4 py-12">
      <form onSubmit={updatePassword} className="w-full space-y-5">
        <div className="space-y-2">
          <h1 className="font-heading text-3xl font-semibold">Crea una nueva contraseña</h1>
          <p className="text-sm text-muted-foreground">Usa al menos 8 caracteres.</p>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="password">Nueva contraseña</Label>
          <Input id="password" type="password" autoComplete="new-password" value={password} onChange={(event) => setPassword(event.target.value)} required />
        </div>
        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? "Actualizando..." : "Actualizar contraseña"}
        </Button>
      </form>
    </main>
  );
}
