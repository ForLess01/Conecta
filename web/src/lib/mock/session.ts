import type { UserRole } from "@/types/domain";

// Local role profiles used while the account API is integrated.
export const SESSION_BY_ROLE: Record<UserRole, { id: string; name: string; avatarSeed: string }> = {
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
