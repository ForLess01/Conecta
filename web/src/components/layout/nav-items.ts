import type { UserRole } from "@/types/domain";
import {
  Home,
  ShoppingBasket,
  ClipboardList,
  MessagesSquare,
  PackageSearch,
  Truck,
  Route as RouteIcon,
  Bell,
  User,
  Settings,
  Bookmark,
  ShieldCheck,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  roles: UserRole[];
  mobilePrimary?: boolean;
}

export const NAV_ITEMS: NavItem[] = [
  { href: "/home", label: "Inicio", icon: Home, roles: ["productor", "comprador", "transportista", "admin"], mobilePrimary: true },
  { href: "/marketplace", label: "Marketplace", icon: ShoppingBasket, roles: ["productor", "comprador", "transportista", "admin"], mobilePrimary: true },
  { href: "/negotiations", label: "Negociaciones", icon: MessagesSquare, roles: ["productor", "comprador"], mobilePrimary: true },
  { href: "/orders", label: "Órdenes", icon: ClipboardList, roles: ["productor", "comprador", "admin"] },
  { href: "/transport", label: "Transporte", icon: Truck, roles: ["transportista"], mobilePrimary: true },
  { href: "/trips", label: "Viajes", icon: RouteIcon, roles: ["transportista", "admin"] },
  { href: "/saved", label: "Guardados", icon: Bookmark, roles: ["productor", "comprador", "transportista"] },
  { href: "/notifications", label: "Notificaciones", icon: Bell, roles: ["productor", "comprador", "transportista", "admin"] },
  { href: "/admin", label: "Administración", icon: ShieldCheck, roles: ["admin"], mobilePrimary: true },
  { href: "/settings", label: "Perfil", icon: User, roles: ["productor", "comprador", "transportista", "admin"], mobilePrimary: true },
];

export const SECONDARY_ITEMS: NavItem[] = [
  { href: "/settings", label: "Configuración", icon: Settings, roles: ["productor", "comprador", "transportista", "admin"] },
];

export function navForRole(role: UserRole): NavItem[] {
  return NAV_ITEMS.filter((item) => item.roles.includes(role));
}

export function mobileNavForRole(role: UserRole): NavItem[] {
  return navForRole(role)
    .filter((item) => item.mobilePrimary)
    .slice(0, 5);
}

export { PackageSearch };
