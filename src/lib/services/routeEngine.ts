import type { Boat, RiskLevel, RouteEstimate } from "@/types";

interface RouteParams {
  fromLat: number;
  fromLon: number;
  toLat: number;
  toLon: number;
  boat: Boat | null;
  fuelPriceSek: number;
  weatherRisk: RiskLevel;
}

function haversineNm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 3440.065;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function estimateRoute({ fromLat, fromLon, toLat, toLon, boat, fuelPriceSek, weatherRisk }: RouteParams): RouteEstimate {
  const distance_nm = Math.round(haversineNm(fromLat, fromLon, toLat, toLon) * 10) / 10;
  const speed = boat?.cruise_speed_knots ?? 15;
  const lph = 20;
  const hours = distance_nm / speed;
  const eta_minutes = Math.round(hours * 60);
  const fuel_liters = Math.round(hours * lph * 10) / 10;
  const fuel_cost_sek = Math.round(fuel_liters * fuelPriceSek);
  return { distance_nm, eta_minutes, fuel_liters, fuel_cost_sek, risk: weatherRisk };
}

export function formatEta(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}
