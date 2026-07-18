// Local photography catalog. Keeping product, route and profile photography in
// /public makes the interface deterministic even with intermittent connectivity.

export const IMAGES = {
  heroAndes: "/images/hero-andes.jpg",
  highlandRoute: "/images/hero-andes.jpg",
  roadTrip: "/images/truck-highway.jpg",
  mountains: "/images/field-sunset.jpg",
  fieldSunset: "/images/field-sunset.jpg",
  farmGreen: "/images/farm-green.jpg",
  papaCanchan: "/images/papa-canchan.jpg",
  papaImilla: "/images/papa-imilla.jpg",
  papaDetail: "/images/papa-detail.jpg",
  alpaca: "/images/alpaca-field.jpg",
  alpacaField: "/images/alpaca-field.jpg",
  alpacaCloseup: "/images/alpaca-closeup.jpg",
  quinuaSacks: "/images/quinua-sacks.jpg",
  quinuaGrain: "/images/quinua-grain.jpg",
  cebolla: "/images/cebolla.jpg",
  cebollaDetail: "/images/cebolla-detail.jpg",
  trucha: "/images/trucha.jpg",
  truchaDetail: "/images/trucha-detail.jpg",
  market: "/images/market.jpg",
  marketStand: "/images/market.jpg",
  handsProduce: "/images/hands-produce.jpg",
  vegetables: "/images/market.jpg",
  farmerPeru: "/images/farmer-peru.jpg",
  truckRoad: "/images/truck-highway.jpg",
  truckHighway: "/images/truck-highway.jpg",
  truckCargo: "/images/truck-cargo.jpg",
  truck8t: "/images/truck-8t.jpg",
  pickup: "/images/pickup.jpg",
  ruralCar: "/images/rural-car.jpg",
  warehouse: "/images/truck-cargo.jpg",
  warehouseBoxes: "/images/truck-cargo.jpg",
  boxes: "/images/truck-cargo.jpg",
  portraitMan1: "/images/portrait-man-1.jpg",
  portraitWoman1: "/images/portrait-woman-1.jpg",
  portraitMan2: "/images/portrait-man-2.jpg",
  portraitWoman2: "/images/portrait-woman-2.jpg",
  portraitMan3: "/images/portrait-man-3.jpg",
  portraitPerson: "/images/portrait-person.jpg",
} as const;

export type ImageKey = keyof typeof IMAGES;

export function img(key: ImageKey, width = 800, quality = 75): string {
  void width;
  void quality;
  return IMAGES[key];
}
