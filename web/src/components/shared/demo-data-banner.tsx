import { Info } from "lucide-react";

export function DemoDataBanner() {
  return (
    <div className="flex items-center gap-2 rounded-xl border border-[color:var(--amber)]/30 bg-[color:var(--amber)]/10 px-4 py-2.5 text-xs text-[#7a5210]">
      <Info className="size-4 shrink-0" />
      Todos los datos de esta plataforma son de demostración: productos, precios, riesgos y usuarios son simulados.
    </div>
  );
}
