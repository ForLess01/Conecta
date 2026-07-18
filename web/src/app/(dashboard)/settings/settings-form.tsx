"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { DesktopTopBar } from "@/components/layout/top-bar";
import { useRole } from "@/components/layout/role-context";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { ACTIVE_ROLE_COOKIE, SELF_SERVICE_ROLE_LABELS as ROLE_LABELS } from "@/lib/roles";
import { SELF_SERVICE_ROLES, type SelfServiceRole } from "@/lib/roles";
import type { AccountSettings } from "@/lib/server/account/account";
import { saveRolesAction, saveSettingsAction, signOutAction } from "./actions";

const NOTIFICATION_LABELS = {
  negotiation: "Negociación",
  order: "Orden",
  transport: "Transporte",
  risk: "Riesgo",
  system: "Sistema",
} as const;

export function SettingsForm({ initialSettings }: { initialSettings: AccountSettings }) {
  const { activeRole, setActiveRole, enabledRoles } = useRole();
  const [settings, setSettings] = useState(initialSettings);
  const [roles, setRoles] = useState<SelfServiceRole[]>(enabledRoles.filter((role): role is SelfServiceRole => role !== "admin"));
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function toggleRole(role: SelfServiceRole) {
    const next = roles.includes(role) ? roles.filter((item) => item !== role) : [...roles, role];
    if (next.length === 0) {
      toast.error("Tu cuenta debe conservar al menos un rol operativo.");
      return;
    }
    startTransition(async () => {
      try {
        const saved = await saveRolesAction(next);
        setRoles(saved);
        window.localStorage.setItem("conecta.enabledRoles", JSON.stringify(saved));
        toast.success("Roles actualizados.");
        router.refresh();
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "No se pudieron actualizar los roles.");
      }
    });
  }

  function save() {
    startTransition(async () => {
      try {
        await saveSettingsAction(settings);
        toast.success("Cambios guardados.");
        router.refresh();
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "No se pudieron guardar los cambios.");
      }
    });
  }

  return (
    <div className="space-y-6">
      <DesktopTopBar title="Configuración" description="Cuenta, roles, privacidad, notificaciones e idioma." />
      <Card><CardHeader><CardTitle className="font-heading text-base">Cuenta</CardTitle></CardHeader><CardContent className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5"><Label htmlFor="name">Nombre</Label><Input id="name" value={settings.name} onChange={(event) => setSettings({ ...settings, name: event.target.value })} /></div>
        <div className="space-y-1.5"><Label htmlFor="phone">Teléfono</Label><Input id="phone" value={settings.phone} onChange={(event) => setSettings({ ...settings, phone: event.target.value })} /></div>
      </CardContent></Card>

      <Card><CardHeader><CardTitle className="font-heading text-base">Roles</CardTitle></CardHeader><CardContent className="space-y-3">
        {SELF_SERVICE_ROLES.map((role) => <div key={role} className="flex items-center justify-between rounded-xl border border-border px-3 py-2.5"><div><p className="text-sm font-medium">{ROLE_LABELS[role]}</p>{activeRole === role && <p className="text-xs text-primary">Rol activo</p>}</div><div className="flex items-center gap-2">
          {roles.includes(role) && activeRole !== role && <Button variant="ghost" size="sm" onClick={() => setActiveRole(role)}>Activar</Button>}
          <Switch checked={roles.includes(role)} disabled={isPending || activeRole === role} aria-label={`${roles.includes(role) ? "Desactivar" : "Activar"} rol ${ROLE_LABELS[role]}`} onCheckedChange={() => toggleRole(role)} />
        </div></div>)}
      </CardContent></Card>

      <Card><CardHeader><CardTitle className="font-heading text-base">Privacidad</CardTitle></CardHeader><CardContent className="flex items-center justify-between"><div><p className="text-sm font-medium">Visibilidad de ubicación</p><p className="text-xs text-muted-foreground">Mostrar solo ubicación aproximada antes del match.</p></div><Switch checked={settings.approximateLocationOnly} onCheckedChange={(checked) => setSettings({ ...settings, approximateLocationOnly: checked })} /></CardContent></Card>

      <Card><CardHeader><CardTitle className="font-heading text-base">Notificaciones</CardTitle></CardHeader><CardContent className="space-y-2">
        {(Object.keys(NOTIFICATION_LABELS) as Array<keyof typeof NOTIFICATION_LABELS>).map((key) => <div key={key} className="flex items-center justify-between"><span className="text-sm">{NOTIFICATION_LABELS[key]}</span><Switch checked={settings.notifications[key]} onCheckedChange={(checked) => setSettings({ ...settings, notifications: { ...settings.notifications, [key]: checked } })} /></div>)}
      </CardContent></Card>

      <Card><CardHeader><CardTitle className="font-heading text-base">Idioma</CardTitle></CardHeader><CardContent><Select value={settings.language} onValueChange={(language) => language && setSettings({ ...settings, language })}><SelectTrigger className="w-full sm:w-64"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="es">Español</SelectItem><SelectItem value="qu">Quechua</SelectItem><SelectItem value="ay">Aimara</SelectItem></SelectContent></Select></CardContent></Card>

      <div className="flex flex-wrap justify-between gap-2">
        <Button variant="destructive" disabled={isPending} onClick={() => startTransition(async () => { window.localStorage.removeItem("conecta.activeRole"); window.localStorage.removeItem("conecta.enabledRoles"); document.cookie = `${ACTIVE_ROLE_COOKIE}=; Path=/; Max-Age=0; SameSite=Lax`; await signOutAction(); })}>Cerrar sesión</Button>
        <Button disabled={isPending} onClick={save}>{isPending ? "Guardando…" : "Guardar cambios"}</Button>
      </div>
    </div>
  );
}
