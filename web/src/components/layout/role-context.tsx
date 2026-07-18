"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { UserRole } from "@/types/domain";
import { SESSION_BY_ROLE } from "@/lib/mock/session";
import { isSelfServiceRole, sanitizeSelfServiceRoles, type SelfServiceRole } from "@/lib/roles";

const STORAGE_KEY = "conecta.activeRole";
const ROLES_KEY = "conecta.enabledRoles";
const DEFAULT_ROLE: SelfServiceRole = "productor";

interface RoleContextValue {
  activeRole: UserRole;
  setActiveRole: (role: UserRole) => void;
  enabledRoles: UserRole[];
  toggleRole: (role: UserRole) => void;
  currentActor: { id: string; name: string; avatarSeed: string };
}

const RoleContext = createContext<RoleContextValue | null>(null);

export function RoleProvider({ children }: { children: React.ReactNode }) {
  const [activeRole, setActiveRoleState] = useState<UserRole>(DEFAULT_ROLE);
  const [enabledRoles, setEnabledRoles] = useState<UserRole[]>(["productor", "comprador"]);

  useEffect(() => {
    // One-time hydration of persisted role state from localStorage.
    // This intentionally runs once on mount to sync React state with an
    // external store (the browser's localStorage), which is the documented
    // exception to "don't setState in an effect".
    const storedRole = window.localStorage.getItem(STORAGE_KEY);
    const storedRoles = window.localStorage.getItem(ROLES_KEY);
    let safeRoles: SelfServiceRole[] = ["productor", "comprador"];
    if (storedRoles) {
      try {
        const parsed = sanitizeSelfServiceRoles(JSON.parse(storedRoles));
        if (parsed.length) safeRoles = parsed;
      } catch {
        // ignore malformed value
      }
    }
    const safeActiveRole = isSelfServiceRole(storedRole) && safeRoles.includes(storedRole)
      ? storedRole
      : safeRoles[0] ?? DEFAULT_ROLE;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time hydration from localStorage on mount
    setActiveRoleState(safeActiveRole);
    setEnabledRoles(safeRoles);
    window.localStorage.setItem(STORAGE_KEY, safeActiveRole);
    window.localStorage.setItem(ROLES_KEY, JSON.stringify(safeRoles));
  }, []);

  const setActiveRole = useCallback((role: UserRole) => {
    if (!isSelfServiceRole(role) || !enabledRoles.includes(role)) return;
    setActiveRoleState(role);
    window.localStorage.setItem(STORAGE_KEY, role);
  }, [enabledRoles]);

  const toggleRole = useCallback((role: UserRole) => {
    if (!isSelfServiceRole(role)) return;
    setEnabledRoles((prev) => {
      if (prev.includes(role) && (role === activeRole || prev.length === 1)) return prev;
      const next = prev.includes(role) ? prev.filter((r) => r !== role) : [...prev, role];
      window.localStorage.setItem(ROLES_KEY, JSON.stringify(next));
      return next;
    });
  }, [activeRole]);

  const currentActor = useMemo(() => SESSION_BY_ROLE[activeRole], [activeRole]);

  const value = useMemo(
    () => ({ activeRole, setActiveRole, enabledRoles, toggleRole, currentActor }),
    [activeRole, setActiveRole, enabledRoles, toggleRole, currentActor]
  );

  return <RoleContext.Provider value={value}>{children}</RoleContext.Provider>;
}

export function useRole() {
  const ctx = useContext(RoleContext);
  if (!ctx) {
    throw new Error("useRole must be used within a RoleProvider");
  }
  return ctx;
}
