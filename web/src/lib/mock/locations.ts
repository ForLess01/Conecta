import type { Location } from "@/types/domain";

export const LOCATIONS: Record<string, Location> = {
  acora: { district: "Acora", province: "Puno", region: "Puno", lat: -16.229, lng: -69.766 },
  ilave: { district: "Ilave", province: "El Collao", region: "Puno", lat: -16.087, lng: -69.652 },
  mazocruz: { district: "Santa Rosa (Mazocruz)", province: "El Collao", region: "Puno", lat: -16.727, lng: -69.716 },
  juli: { district: "Juli", province: "Chucuito", region: "Puno", lat: -16.207, lng: -69.454 },
  juliaca: { district: "Juliaca", province: "San Román", region: "Puno", lat: -15.5, lng: -70.133 },
  puno: { district: "Puno", province: "Puno", region: "Puno", lat: -15.84, lng: -70.021 },
  arequipa: { district: "Arequipa", province: "Arequipa", region: "Arequipa", lat: -16.409, lng: -71.537 },
};
