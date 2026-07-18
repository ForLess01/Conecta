"use client";

import { Check, ChevronsUpDown } from "lucide-react";
import { useRole } from "./role-context";
import { ROLE_LABELS } from "@/lib/mock/session";
import type { UserRole } from "@/types/domain";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

const ALL_ROLES: UserRole[] = ["productor", "comprador", "transportista", "admin"];

export function RoleSwitcher({ compact = false }: { compact?: boolean }) {
  const { activeRole, setActiveRole, currentActor } = useRole();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          className="w-full justify-between gap-2 border-border bg-card"
        >
          <span className="flex items-center gap-2 truncate">
            <Avatar className="size-6">
              <AvatarFallback className="bg-secondary text-secondary-foreground text-xs">
                {currentActor.name.slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            {!compact && (
              <span className="flex flex-col items-start leading-tight">
                <span className="text-xs font-medium">{ROLE_LABELS[activeRole]}</span>
                <span className="text-[11px] text-muted-foreground truncate max-w-32">
                  {currentActor.name}
                </span>
              </span>
            )}
          </span>
          <ChevronsUpDown className="size-4 text-muted-foreground" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-56">
        <DropdownMenuLabel>Cambiar rol activo (demo)</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {ALL_ROLES.map((role) => (
          <DropdownMenuItem key={role} onClick={() => setActiveRole(role)} className="justify-between">
            {ROLE_LABELS[role]}
            {role === activeRole && <Check className="size-4 text-primary" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
