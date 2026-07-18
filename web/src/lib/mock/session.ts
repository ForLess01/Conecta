import type { UserRole } from "@/types/domain";

// Demo session: maps each role to the mock actor "logged in" as that role.
export const DEMO_SESSION_BY_ROLE: Record<UserRole, { id: string; name: string; avatarSeed: string }> = {
  productor: { id: "prod-1", name: "Efraín Quispe Mamani", avatarSeed: "efrain-quispe" },
  comprador: { id: "buyer-2", name: "Juan Pablo Rojas", avatarSeed: "juanpablo-rojas" },
  transportista: { id: "trans-1", name: "Wilfredo Chura", avatarSeed: "wilfredo-chura" },
  admin: { id: "admin-1", name: "Administración Conecta", avatarSeed: "admin-conecta" },
};

export const ROLE_LABELS: Record<UserRole, string> = {
  productor: "Productor",
  comprador: "Comprador",
  transportista: "Transportista",
  admin: "Administrador",
};
