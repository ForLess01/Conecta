import type { FreightBid, FreightRequest, Trip } from "@/types/domain";
import { LOCATIONS } from "./locations";
import { makeRisk } from "./risk";

export const FREIGHT_REQUESTS: FreightRequest[] = [
  {
    id: "flete-1",
    orderId: "order-1",
    origin: LOCATIONS.acora,
    destination: LOCATIONS.juliaca,
    distanceKm: 118,
    cargoDescription: "Papa Canchán en sacos de 50 kg",
    weightKg: 4200,
    volumeM3: 14,
    packages: 84,
    requiredDate: "2026-07-21",
    suggestedVehicle: "camion_8t",
    suggestedRate: 850,
    needsHelper: true,
    loadingResponsible: "productor",
    risk: makeRisk(
      38,
      "Protesta anunciada en el corredor Ilave - Juliaca con posible bloqueo parcial.",
      [
        { label: "Eventos activos", detail: "1 protesta confirmada cerca de la ruta" },
        { label: "Acceso", detail: "Ruta alterna disponible vía Acora" },
      ]
    ),
    status: "con_ofertas",
    returnLoadAvailable: true,
  },
  {
    id: "flete-2",
    origin: LOCATIONS.ilave,
    destination: LOCATIONS.arequipa,
    distanceKm: 265,
    cargoDescription: "Quinua blanca ensacada, 150 sacos de 50 kg",
    weightKg: 3100,
    volumeM3: 10,
    packages: 62,
    requiredDate: "2026-07-25",
    suggestedVehicle: "camion_8t",
    suggestedRate: 1450,
    needsHelper: false,
    loadingResponsible: "transportista",
    risk: makeRisk(
      58,
      "Protesta anunciada en Ilave con posible cierre parcial de la vía principal hacia Juliaca.",
      [{ label: "Eventos activos", detail: "Protesta confirmada por gremio de transportistas" }]
    ),
    status: "publicado",
    returnLoadAvailable: false,
  },
  {
    id: "flete-3",
    origin: LOCATIONS.juli,
    destination: LOCATIONS.puno,
    distanceKm: 82,
    cargoDescription: "Trucha fresca en cajas isotérmicas",
    weightKg: 800,
    volumeM3: 5,
    packages: 40,
    requiredDate: "2026-07-19",
    suggestedVehicle: "furgon_cubierto",
    suggestedRate: 480,
    needsHelper: false,
    loadingResponsible: "productor",
    risk: makeRisk(
      44,
      "Restricción vial cerca de Juli que exige coordinar horario de recojo para producto perecible.",
      [{ label: "Acceso", detail: "Paso habilitado en horario nocturno" }]
    ),
    status: "asignado",
    returnLoadAvailable: true,
  },
];

export const FREIGHT_BIDS: FreightBid[] = [
  {
    id: "bid-1",
    freightRequestId: "flete-1",
    transporterId: "trans-1",
    rate: 820,
    vehicleId: "veh-2",
    departureAt: "2026-07-21T05:00:00-05:00",
    estimatedDurationHours: 4,
    helperIncluded: true,
    insuranceIncluded: true,
    conditions: "Pago 50% al recojo, saldo contra entrega.",
    status: "pendiente",
  },
  {
    id: "bid-2",
    freightRequestId: "flete-1",
    transporterId: "trans-2",
    rate: 900,
    vehicleId: "veh-3",
    departureAt: "2026-07-21T04:30:00-05:00",
    estimatedDurationHours: 3.5,
    helperIncluded: true,
    insuranceIncluded: true,
    conditions: "Incluye seguro de carga declarado.",
    status: "pendiente",
  },
  {
    id: "bid-3",
    freightRequestId: "flete-1",
    transporterId: "trans-3",
    rate: 780,
    vehicleId: "veh-5",
    departureAt: "2026-07-21T06:00:00-05:00",
    estimatedDurationHours: 4.5,
    helperIncluded: false,
    insuranceIncluded: false,
    status: "pendiente",
  },
];

export const TRIPS: Trip[] = [
  {
    id: "trip-1",
    freightRequestId: "flete-3",
    bidId: "bid-3",
    status: "en_transito",
    driverName: "Wilfredo Chura",
    vehicleId: "veh-5",
    cargoDescription: "Trucha fresca en cajas isotérmicas",
    stops: [
      { label: "Recojo en Juli", done: true, at: "2026-07-18T06:00:00-05:00" },
      { label: "Control de ruta - Juli km 12", done: true, at: "2026-07-18T06:40:00-05:00" },
      { label: "Entrega en Puno", done: false },
    ],
    timeline: [
      { status: "programado", label: "Viaje programado", at: "2026-07-17T18:00:00-05:00" },
      { status: "recojo", label: "Recojo confirmado", at: "2026-07-18T06:00:00-05:00" },
      { status: "en_transito", label: "En tránsito hacia Puno", at: "2026-07-18T06:45:00-05:00" },
    ],
    evidencePhotos: [],
  },
];

export function getFreightById(id: string): FreightRequest | undefined {
  return FREIGHT_REQUESTS.find((f) => f.id === id);
}

export function getBidsForFreight(freightId: string): FreightBid[] {
  return FREIGHT_BIDS.filter((b) => b.freightRequestId === freightId);
}

export function getTripById(id: string): Trip | undefined {
  return TRIPS.find((t) => t.id === id);
}
