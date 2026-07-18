"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { UserRole } from "@/types/domain";
import { DEMO_SESSION_BY_ROLE } from "@/lib/mock/session";

const STORAGE_KEY = "conecta.activeRole";
const ROLES_KEY = "conecta.enabledRoles";
const DEFAULT_ROLE: UserRole = "productor";
const ALL_ROLES: UserRole[] = ["productor", "comprador", "transportista", "admin"];

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
    // One-time hydration of persisted demo session state from localStorage.
    // This intentionally runs once on mount to sync React state with an
    // external store (the browser's localStorage), which is the documented
    // exception to "don't setState in an effect".
    const storedRole = window.localStorage.getItem(STORAGE_KEY) as UserRole | null;
    const storedRoles = window.localStorage.getItem(ROLES_KEY);
    if (storedRole && ALL_ROLES.includes(storedRole)) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time hydration from localStorage on mount
      setActiveRoleState(storedRole);
    }
    if (storedRoles) {
      try {
        const parsed = JSON.parse(storedRoles) as UserRole[];
        if (Array.isArray(parsed) && parsed.length) setEnabledRoles(parsed);
      } catch {
        // ignore malformed value
      }
    }
  }, []);

  const setActiveRole = useCallback((role: UserRole) => {
    setActiveRoleState(role);
    setEnabledRoles((prev) => {
      const next = prev.includes(role) ? prev : [...prev, role];
      window.localStorage.setItem(ROLES_KEY, JSON.stringify(next));
      return next;
    });
    window.localStorage.setItem(STORAGE_KEY, role);
  }, []);

  const toggleRole = useCallback((role: UserRole) => {
    setEnabledRoles((prev) => {
      const next = prev.includes(role) ? prev.filter((r) => r !== role) : [...prev, role];
      window.localStorage.setItem(ROLES_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const currentActor = useMemo(() => DEMO_SESSION_BY_ROLE[activeRole], [activeRole]);

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
