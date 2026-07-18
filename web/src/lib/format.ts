import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";

export function formatSoles(value: number): string {
  return `S/ ${value.toLocaleString("es-PE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function formatQuantity(value: number, unit: string): string {
  return `${value.toLocaleString("es-PE")} ${unit}`;
}

export function formatRelativeUpdate(iso: string): string {
  try {
    return `actualizado hace ${formatDistanceToNow(new Date(iso), { locale: es })}`;
  } catch {
    return "actualización no disponible";
  }
}

export function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString("es-PE", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  } catch {
    return iso;
  }
}

export function formatDateTime(iso: string): string {
  try {
    return new Date(iso).toLocaleString("es-PE", {
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}
