"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { ArrowLeft, MailCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [requested, setRequested] = useState(false);

  function submitRequest(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const cleanEmail = email.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      setError("Ingresa un correo válido para continuar.");
      setRequested(false);
      return;
    }
    setError("");
    setRequested(true);
  }

  return (
    <main className="mx-auto flex min-h-[calc(100vh-65px)] max-w-md items-center px-4 py-12">
      <div className="w-full space-y-6">
        <div className="space-y-2">
          <h1 className="text-balance font-heading text-3xl font-semibold tracking-tight">Recupera tu contraseña</h1>
          <p className="text-sm text-muted-foreground">Ingresa tu correo y te indicaremos cómo restablecer el acceso.</p>
        </div>

        {requested ? (
          <Alert aria-live="polite">
            <MailCheck aria-hidden="true" />
            <AlertTitle>Solicitud registrada</AlertTitle>
            <AlertDescription>Cuando el servicio de autenticación esté conectado, recibirás aquí el enlace seguro de recuperación.</AlertDescription>
          </Alert>
        ) : (
          <form onSubmit={submitRequest} className="space-y-4" noValidate>
            <div className="space-y-1.5">
              <Label htmlFor="recovery-email">Correo</Label>
              <Input
                id="recovery-email"
                name="email"
                type="email"
                autoComplete="email"
                spellCheck={false}
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                aria-invalid={Boolean(error)}
                aria-describedby={error ? "recovery-error" : undefined}
                placeholder="correo@ejemplo.com…"
              />
              {error && <p id="recovery-error" role="alert" className="text-xs text-destructive">{error}</p>}
            </div>
            <Button type="submit" className="w-full">Solicitar recuperación</Button>
          </form>
        )}

        <Button variant="ghost" asChild className="w-full gap-2">
          <Link href="/login"><ArrowLeft className="size-4" aria-hidden="true" /> Volver a iniciar sesión</Link>
        </Button>
      </div>
    </main>
  );
}
