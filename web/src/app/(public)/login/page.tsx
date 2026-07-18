"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Sprout, ShoppingBasket, Truck, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import type { UserRole } from "@/types/domain";

const DEMO_ROLES: { role: UserRole; label: string; icon: typeof Sprout }[] = [
  { role: "productor", label: "Demo Productor", icon: Sprout },
  { role: "comprador", label: "Demo Comprador", icon: ShoppingBasket },
  { role: "transportista", label: "Demo Transportista", icon: Truck },
  { role: "admin", label: "Demo Admin", icon: ShieldCheck },
];

export default function LoginPage() {
  const router = useRouter();

  function enterAsRole(role: UserRole) {
    window.localStorage.setItem("conecta.activeRole", role);
    const stored = window.localStorage.getItem("conecta.enabledRoles");
    const roles = stored ? (JSON.parse(stored) as UserRole[]) : [];
    if (!roles.includes(role)) roles.push(role);
    window.localStorage.setItem("conecta.enabledRoles", JSON.stringify(roles));
    router.push(role === "admin" ? "/admin" : "/home");
  }

  return (
    <div className="mx-auto flex max-w-md flex-col gap-6 px-4 py-12 md:py-20">
      <Card>
        <CardHeader>
          <CardTitle className="font-heading text-2xl">Iniciar sesión</CardTitle>
          <CardDescription>Ingresa con tu correo o teléfono para continuar.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <form
            className="space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              enterAsRole("comprador");
            }}
          >
            <div className="space-y-1.5">
              <Label htmlFor="identifier">Correo o teléfono</Label>
              <Input id="identifier" placeholder="tucorreo@ejemplo.com" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="password">Contraseña</Label>
              <Input id="password" type="password" placeholder="••••••••" />
            </div>
            <div className="flex items-center justify-end">
              <Link href="#" className="text-xs text-primary hover:underline">
                Recuperar contraseña
              </Link>
            </div>
            <Button type="submit" className="w-full">
              Ingresar
            </Button>
          </form>

          <div className="flex items-center gap-3">
            <Separator className="flex-1" />
            <span className="text-xs text-muted-foreground">Acceso demo por rol</span>
            <Separator className="flex-1" />
          </div>

          <div className="grid grid-cols-2 gap-2">
            {DEMO_ROLES.map(({ role, label, icon: Icon }) => (
              <Button key={role} variant="outline" className="justify-start gap-2" onClick={() => enterAsRole(role)}>
                <Icon className="size-4" />
                {label}
              </Button>
            ))}
          </div>

          <p className="text-center text-sm text-muted-foreground">
            ¿No tienes cuenta?{" "}
            <Link href="/register" className="text-primary hover:underline">
              Ir a registro
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
