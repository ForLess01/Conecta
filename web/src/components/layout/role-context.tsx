"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { UserRole } from "@/types/domain";
import { isSelfServiceRole, sanitizeSelfServiceRoles, type SelfServiceRole } from "@/lib/roles";
import type { ActorContext } from "@/lib/supabase/session";

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

export function RoleProvider({ children, initialActor }: { children: React.ReactNode; initialActor: ActorContext }) {
  const authorizedRoles = useMemo(
    () => initialActor.roles.length ? initialActor.roles : [DEFAULT_ROLE],
    [initialActor.roles],
  );
  const [activeRole, setActiveRoleState] = useState<UserRole>(authorizedRoles[0]);
  const enabledRoles: UserRole[] = authorizedRoles;

  useEffect(() => {
    // One-time hydration of persisted role state from localStorage.
    // This intentionally runs once on mount to sync React state with an
    // external store (the browser's localStorage), which is the documented
    // exception to "don't setState in an effect".
    const storedRole = window.localStorage.getItem(STORAGE_KEY);
    const storedRoles = window.localStorage.getItem(ROLES_KEY);
    let safeRoles: UserRole[] = authorizedRoles;
    if (storedRoles) {
      try {
        const parsed = sanitizeSelfServiceRoles(JSON.parse(storedRoles));
        const persistedAuthorizedRoles = parsed.filter((role) => authorizedRoles.includes(role));
        if (persistedAuthorizedRoles.length) safeRoles = persistedAuthorizedRoles;
      } catch {
        // ignore malformed value
      }
    }
    const safeActiveRole = isSelfServiceRole(storedRole) && safeRoles.includes(storedRole)
      ? storedRole
      : safeRoles[0] ?? DEFAULT_ROLE;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time hydration from localStorage on mount
    setActiveRoleState(safeActiveRole);
    window.localStorage.setItem(STORAGE_KEY, safeActiveRole);
    window.localStorage.setItem(ROLES_KEY, JSON.stringify(authorizedRoles));
  }, [authorizedRoles]);

  const setActiveRole = useCallback((role: UserRole) => {
    if (!isSelfServiceRole(role) || !enabledRoles.includes(role)) return;
    setActiveRoleState(role);
    window.localStorage.setItem(STORAGE_KEY, role);
  }, [enabledRoles]);

  const toggleRole = useCallback((role: UserRole) => {
    if (!isSelfServiceRole(role) || !authorizedRoles.includes(role)) return;
  }, [authorizedRoles]);

  const currentActor = useMemo(() => ({
    id: initialActor.id,
    name: initialActor.name,
    avatarSeed: initialActor.id,
  }), [initialActor.id, initialActor.name]);

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
