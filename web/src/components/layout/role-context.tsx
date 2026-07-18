"use client";

import { createContext, useCallback, useContext, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { UserRole } from "@/types/domain";
import { ACTIVE_ROLE_COOKIE, isSelfServiceRole, type SelfServiceRole } from "@/lib/roles";
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
  const router = useRouter();
  const authorizedRoles = useMemo(
    () => initialActor.roles.length ? initialActor.roles : [DEFAULT_ROLE],
    [initialActor.roles],
  );
  const [activeRole, setActiveRoleState] = useState<UserRole>(initialActor.activeRole);
  const enabledRoles: UserRole[] = authorizedRoles;

  const setActiveRole = useCallback((role: UserRole) => {
    if (!enabledRoles.includes(role)) return;
    setActiveRoleState(role);
    window.localStorage.setItem(STORAGE_KEY, role);
    window.localStorage.setItem(ROLES_KEY, JSON.stringify(authorizedRoles));
    document.cookie = `${ACTIVE_ROLE_COOKIE}=${role}; Path=/; Max-Age=31536000; SameSite=Lax`;
    router.refresh();
  }, [authorizedRoles, enabledRoles, router]);

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
