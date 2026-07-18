"use client";

import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { DesktopTopBar } from "@/components/layout/top-bar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useRole } from "@/components/layout/role-context";
import { ROLE_LABELS } from "@/lib/mock/session";
import { SELF_SERVICE_ROLES } from "@/lib/roles";

export default function SettingsPage() {
  const { activeRole, setActiveRole, enabledRoles, toggleRole, currentActor } = useRole();
  const router = useRouter();

  return (
    <div className="space-y-6">
      <DesktopTopBar title="Configuración" description="Cuenta, roles, privacidad, notificaciones e idioma." />

      <Card>
        <CardHeader>
          <CardTitle className="font-heading text-base">Cuenta</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="name">Nombre</Label>
            <Input id="name" defaultValue={currentActor.name} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="phone">Teléfono</Label>
            <Input id="phone" defaultValue="+51 9XX XXX XXX" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="font-heading text-base">Roles</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {SELF_SERVICE_ROLES.map((role) => (
            <div key={role} className="flex items-center justify-between rounded-xl border border-border px-3 py-2.5">
              <div>
                <p className="text-sm font-medium">{ROLE_LABELS[role]}</p>
                {activeRole === role && <p className="text-xs text-primary">Rol activo</p>}
              </div>
              <div className="flex items-center gap-2">
                {enabledRoles.includes(role) && activeRole !== role && (
                  <Button variant="ghost" size="sm" onClick={() => setActiveRole(role)}>
                    Activar
                  </Button>
                )}
                <Switch
                  checked={enabledRoles.includes(role)}
                  disabled={activeRole === role}
                  aria-label={`${enabledRoles.includes(role) ? "Desactivar" : "Activar"} rol ${ROLE_LABELS[role]}`}
                  onCheckedChange={() => toggleRole(role)}
                />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="font-heading text-base">Privacidad</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium">Visibilidad de ubicación</p>
            <p className="text-xs text-muted-foreground">Mostrar solo ubicación aproximada antes del match.</p>
          </div>
          <Switch defaultChecked />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="font-heading text-base">Notificaciones</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {["Negociación", "Orden", "Transporte", "Riesgo", "Sistema"].map((cat) => (
            <div key={cat} className="flex items-center justify-between">
              <span className="text-sm">{cat}</span>
              <Switch defaultChecked />
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="font-heading text-base">Idioma</CardTitle>
        </CardHeader>
        <CardContent>
          <Select defaultValue="es">
            <SelectTrigger className="w-full sm:w-64">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="es">Español</SelectItem>
              <SelectItem value="qu" disabled>Quechua (próximamente)</SelectItem>
              <SelectItem value="ay" disabled>Aimara (próximamente)</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      <div className="flex flex-wrap justify-between gap-2">
        <Button
          variant="destructive"
          onClick={() => {
            window.localStorage.removeItem("conecta.activeRole");
            window.localStorage.removeItem("conecta.enabledRoles");
            toast.success("Sesión cerrada.");
            router.push("/login");
          }}
        >
          Cerrar sesión
        </Button>
        <Button onClick={() => toast.success("Cambios guardados.")}>Guardar cambios</Button>
      </div>
    </div>
  );
}
