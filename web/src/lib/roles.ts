import type { UserRole } from "@/types/domain";

export type SelfServiceRole = Exclude<UserRole, "admin">;

export const ROLE_LABELS: Record<UserRole, string> = {
  productor: "Productor",
  comprador: "Comprador",
  transportista: "Transportista",
  admin: "Administrador",
};

export const SELF_SERVICE_ROLES: SelfServiceRole[] = ["productor", "comprador", "transportista"];
export const SELF_SERVICE_ROLE_LABELS: Record<SelfServiceRole, string> = {
  productor: "Productor",
  comprador: "Comprador",
  transportista: "Transportista",
};
export function isSelfServiceRole(role: unknown): role is SelfServiceRole {
  return typeof role === "string" && SELF_SERVICE_ROLES.includes(role as SelfServiceRole);
}

export function sanitizeSelfServiceRoles(value: unknown): SelfServiceRole[] {
  if (!Array.isArray(value)) return [];
  return [...new Set(value.filter(isSelfServiceRole))];
}
