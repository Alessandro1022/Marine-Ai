import type { BoatType, FuelEstimate } from "@/types";

const CONSUMPTION_MAP: Record<BoatType, number> = {
  motorboat: 20,
  sailboat: 3,
  fishing_boat: 15,
  pwc: 25,
};

interface FuelCalcParams {
  distanceNm: number;
  boatType: BoatType;
  cruiseSpeedKnots: number;
  fuelPriceSek: number;
  reservePercent?: number;
}

export function estimateFuel({
  distanceNm,
  boatType,
  cruiseSpeedKnots,
  fuelPriceSek,
  reservePercent = 20,
}: FuelCalcParams): FuelEstimate {
  const lph = CONSUMPTION_MAP[boatType] ?? 20;
  const hours = distanceNm / cruiseSpeedKnots;
  const consumption_liters = Math.round(hours * lph * 10) / 10;
  const reserve_liters = Math.round(consumption_liters * (reservePercent / 100) * 10) / 10;
  const total_recommended_liters = Math.round((consumption_liters + reserve_liters) * 10) / 10;
  const cost_sek = Math.round(consumption_liters * fuelPriceSek);
  return { consumption_liters, cost_sek, reserve_liters, total_recommended_liters };
}
