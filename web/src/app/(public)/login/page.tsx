"use client";

import { useRef, useState, type FormEvent } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AlertCircle, ArrowRight, CheckCircle2, ShoppingBasket, Sprout, Truck } from "lucide-react";
import { BrandLogo } from "@/components/brand/brand-logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { img } from "@/lib/images";
import { isSelfServiceRole, sanitizeSelfServiceRoles, type SelfServiceRole } from "@/lib/roles";

const QUICK_ACCESS_ROLES: { role: SelfServiceRole; label: string; icon: typeof Sprout }[] = [
  { role: "productor", label: "Ingresar como productor", icon: Sprout },
  { role: "comprador", label: "Ingresar como comprador", icon: ShoppingBasket },
  { role: "transportista", label: "Ingresar como transportista", icon: Truck },
];

type LoginErrors = { identifier?: string; password?: string };

export default function LoginPage() {
  const router = useRouter();
  const identifierRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<LoginErrors>({});

  function enterAsRole(role: SelfServiceRole) {
    window.localStorage.setItem("conecta.activeRole", role);
    let roles: SelfServiceRole[] = [];
    try {
      roles = sanitizeSelfServiceRoles(JSON.parse(window.localStorage.getItem("conecta.enabledRoles") ?? "[]"));
    } catch {
      roles = [];
    }
    if (!roles.includes(role)) roles.push(role);
    window.localStorage.setItem("conecta.enabledRoles", JSON.stringify(roles));
    router.push("/home");
  }

  function submitLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const cleanIdentifier = identifier.trim();
    const compactPhone = cleanIdentifier.replace(/[\s()+-]/g, "");
    const looksLikeEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanIdentifier);
    const looksLikePhone = /^(?:51)?9\d{8}$/.test(compactPhone);
    const nextErrors: LoginErrors = {};

    if (!cleanIdentifier) nextErrors.identifier = "Ingresa tu correo o teléfono.";
    else if (!looksLikeEmail && !looksLikePhone) nextErrors.identifier = "Usa un correo válido o un celular peruano de 9 dígitos.";
    if (!password) nextErrors.password = "Ingresa tu contraseña.";
    else if (password.length < 6) nextErrors.password = "La contraseña debe tener al menos 6 caracteres.";

    setErrors(nextErrors);
    if (nextErrors.identifier) {
      identifierRef.current?.focus();
      return;
    }
    if (nextErrors.password) {
      passwordRef.current?.focus();
      return;
    }

    const storedRole = window.localStorage.getItem("conecta.activeRole");
    enterAsRole(isSelfServiceRole(storedRole) ? storedRole : "comprador");
  }

  return (
    <div className="mx-auto grid min-h-[calc(100vh-65px)] max-w-6xl lg:grid-cols-[1.05fr_0.95fr]">
      <section className="relative hidden overflow-hidden lg:block" aria-label="Conecta productores, compradores y transportistas">
        <Image
          src={img("heroAndes")}
          alt="Cultivos del altiplano peruano"
          fill
          sizes="55vw"
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-forest/80" />
        <div className="relative flex h-full flex-col justify-between p-12 text-white">
          <div className="flex items-center gap-3">
            <BrandLogo size={44} tile />
            <span className="font-heading text-2xl font-semibold">Conecta</span>
          </div>
          <div className="max-w-md space-y-5">
            <h1 className="text-balance font-heading text-4xl font-semibold leading-tight">Comercio rural con acuerdos claros y logística visible.</h1>
            <p className="text-pretty text-white/85">Vuelve a tus negociaciones, órdenes y viajes desde una experiencia creada para el campo peruano.</p>
            <ul className="space-y-3 text-sm text-white/90">
              {["Precios orientativos antes de negociar", "Roles operativos separados y controlados", "Seguimiento de entrega según tu participación"].map((benefit) => (
                <li key={benefit} className="flex items-center gap-2">
                  <CheckCircle2 className="size-4 text-mint" aria-hidden="true" /> {benefit}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <main className="flex items-center justify-center px-4 py-10 sm:px-8 lg:px-12">
        <div className="w-full max-w-md space-y-7">
          <div className="space-y-2">
            <div className="flex items-center gap-3 lg:hidden">
              <BrandLogo size={40} />
              <span className="font-heading text-xl font-semibold">Conecta</span>
            </div>
            <h2 className="text-balance font-heading text-3xl font-semibold tracking-tight">Inicia sesión</h2>
            <p className="text-sm text-muted-foreground">Ingresa con el correo o teléfono asociado a tu cuenta.</p>
          </div>

          <form className="space-y-4" onSubmit={submitLogin} noValidate>
            <div className="space-y-1.5">
              <Label htmlFor="identifier">Correo o teléfono</Label>
              <Input
                ref={identifierRef}
                id="identifier"
                name="identifier"
                autoComplete="username"
                spellCheck={false}
                value={identifier}
                onChange={(event) => setIdentifier(event.target.value)}
                aria-invalid={Boolean(errors.identifier)}
                aria-describedby={errors.identifier ? "identifier-error" : undefined}
                placeholder="correo@ejemplo.com o 999 999 999…"
              />
              {errors.identifier && <p id="identifier-error" role="alert" className="flex items-center gap-1.5 text-xs text-destructive"><AlertCircle className="size-3.5" aria-hidden="true" />{errors.identifier}</p>}
            </div>
            <div className="space-y-1.5">
              <div className="flex items-center justify-between gap-3">
                <Label htmlFor="password">Contraseña</Label>
                <Link href="/forgot-password" className="text-xs font-medium text-primary hover:underline">Recuperar contraseña</Link>
              </div>
              <Input
                ref={passwordRef}
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                aria-invalid={Boolean(errors.password)}
                aria-describedby={errors.password ? "password-error" : undefined}
                placeholder="Ingresa tu contraseña…"
              />
              {errors.password && <p id="password-error" role="alert" className="flex items-center gap-1.5 text-xs text-destructive"><AlertCircle className="size-3.5" aria-hidden="true" />{errors.password}</p>}
            </div>
            <Button type="submit" size="lg" className="w-full gap-2">Ingresar <ArrowRight className="size-4" aria-hidden="true" /></Button>
          </form>

          <div className="flex items-center gap-3">
            <Separator className="flex-1" />
            <span className="text-xs text-muted-foreground">Acceso rápido por rol</span>
            <Separator className="flex-1" />
          </div>

          <div className="grid gap-2 sm:grid-cols-3 lg:grid-cols-1">
            {QUICK_ACCESS_ROLES.map(({ role, label, icon: Icon }) => (
              <Button key={role} type="button" variant="outline" className="justify-start gap-2" onClick={() => enterAsRole(role)}>
                <Icon className="size-4" aria-hidden="true" /> {label}
              </Button>
            ))}
          </div>

          <p className="text-center text-sm text-muted-foreground">¿No tienes cuenta? <Link href="/register" className="font-medium text-primary hover:underline">Crear cuenta</Link></p>
        </div>
      </main>
    </div>
  );
}
