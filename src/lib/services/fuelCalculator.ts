import type { FuelEstimate } from "@/types";

interface FuelCalcParams {
  distanceNm: number;
  cruiseSpeedKnots: number;
  consumptionLiterPerHour: number;
  fuelPriceSek: number;
  reservePercent?: number;
}

export function calculateFuel({
  distanceNm,
  cruiseSpeedKnots,
  consumptionLiterPerHour,
  fuelPriceSek,
  reservePercent = 20,
}: FuelCalcParams): FuelEstimate {
  const hoursUnderway = distanceNm / cruiseSpeedKnots;
  const consumptionLiters = hoursUnderway * consumptionLiterPerHour;
  const reserveLiters = consumptionLiters * (reservePercent / 100);
  const totalRecommendedLiters = consumptionLiters + reserveLiters;
  const costSek = consumptionLiters * fuelPriceSek;

  return {
    consumption_liters: Math.round(consumptionLiters * 10) / 10,
    cost_sek: Math.round(costSek),
    reserve_liters: Math.round(reserveLiters * 10) / 10,
    total_recommended_liters: Math.round(totalRecommendedLiters * 10) / 10,
  };
}
