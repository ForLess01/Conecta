"use client";

import { DesktopTopBar } from "@/components/layout/top-bar";
import { EmptyState } from "@/components/shared/empty-state";
import { ShieldCheck } from "lucide-react";

export default function AdminModerationPage() {
  return (
    <div className="space-y-6">
      <DesktopTopBar title="Moderación" description="Publicaciones reportadas por la comunidad." />
      <EmptyState icon={ShieldCheck} title="Sin reportes pendientes" description="No hay publicaciones reportadas en este momento (demo)." />
    </div>
  );
}
