import type { RouteEstimate, WeatherSnapshot } from "@/types";

interface RouteParams {
  fromLat: number;
  fromLon: number;
  toLat: number;
  toLon: number;
  cruiseSpeedKnots: number;
  consumptionLiterPerHour: number;
  fuelPriceSek: number;
  weather?: WeatherSnapshot | null;
}

function haversineNm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 3440.065; // nautical miles
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function estimateRoute({
  fromLat, fromLon, toLat, toLon,
  cruiseSpeedKnots,
  consumptionLiterPerHour,
  fuelPriceSek,
  weather,
}: RouteParams): RouteEstimate {
  const distanceNm = haversineNm(fromLat, fromLon, toLat, toLon);
  const etaMinutes = Math.round((distanceNm / cruiseSpeedKnots) * 60);
  const fuelLiters = Math.round(((distanceNm / cruiseSpeedKnots) * consumptionLiterPerHour) * 10) / 10;
  const fuelCostSek = Math.round(fuelLiters * fuelPriceSek);

  const risk = weather?.risk ?? "green";

  return { distance_nm: Math.round(distanceNm * 10) / 10, eta_minutes: etaMinutes, fuel_liters: fuelLiters, fuel_cost_sek: fuelCostSek, risk };
}
