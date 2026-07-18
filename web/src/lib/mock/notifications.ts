import type { Notification } from "@/types/domain";

export const NOTIFICATIONS: Notification[] = [
  {
    id: "notif-1",
    category: "negociacion",
    title: "Nueva propuesta recibida",
    detail: "Juan Pablo Rojas envió una propuesta por 3000 kg de quinua blanca.",
    createdAt: "2026-07-17T09:45:00-05:00",
    read: false,
    href: "/negotiations/neg-1",
  },
  {
    id: "notif-2",
    category: "orden",
    title: "Orden en tránsito",
    detail: "El pedido de papa Canchán está en tránsito hacia Juliaca.",
    createdAt: "2026-07-18T06:45:00-05:00",
    read: false,
    href: "/orders/order-1",
  },
  {
    id: "notif-3",
    category: "riesgo",
    title: "Alerta de ruta actualizada",
    detail: "Se confirmó una protesta en el corredor Ilave - Juliaca.",
    createdAt: "2026-07-17T08:15:00-05:00",
    read: true,
    href: "/risk/prod-papa-canchan",
  },
  {
    id: "notif-4",
    category: "transporte",
    title: "Nueva oferta de flete",
    detail: "Transportes Altiplano E.I.R.L. ofertó S/ 900 por el flete a Juliaca.",
    createdAt: "2026-07-17T15:00:00-05:00",
    read: true,
    href: "/transport/flete-1/compare",
  },
  {
    id: "notif-5",
    category: "sistema",
    title: "Bienvenido a Conecta",
    detail: "Completa tu perfil para aumentar tu nivel de verificación.",
    createdAt: "2026-07-10T09:00:00-05:00",
    read: true,
    href: "/settings",
  },
];
