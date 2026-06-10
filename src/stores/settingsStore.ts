import { create } from "zustand";
import { persist } from "zustand/middleware";

interface SettingsState {
  fuelPriceSek: number;
  consumptionLiterPerHour: number;
  reservePercent: number;
  setFuelPrice: (price: number) => void;
  setConsumption: (liters: number) => void;
  setReservePercent: (pct: number) => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      fuelPriceSek: 22,
      consumptionLiterPerHour: 20,
      reservePercent: 20,
      setFuelPrice: (fuelPriceSek) => set({ fuelPriceSek }),
      setConsumption: (consumptionLiterPerHour) => set({ consumptionLiterPerHour }),
      setReservePercent: (reservePercent) => set({ reservePercent }),
    }),
    { name: "marine-settings" }
  )
);
