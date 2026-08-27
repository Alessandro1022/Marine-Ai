import { create } from 'zustand';

export interface Boat {
  id: string;
  name: string;
  type: string;
  length_m: number;
  beam_m: number;
  draft_m: number;
  weight_ton?: number;
  fuel_capacity_liters: number;
  fuel_consumption_liter_per_hour: number;
  engine_hp: number;
  motor_type: string;
  year_built?: number;
  manufacturer?: string;
}

interface BoatState {
  boats: Boat[];
  primaryBoatId: string | null;
  
  addBoat: (boat: Boat) => void;
  updateBoat: (id: string, updates: Partial<Boat>) => void;
  primaryBoat: () => Boat | undefined;
  setPrimaryBoat: (id: string) => void;
}

export const useBoatStore = create<BoatState>((set, get) => ({
  boats: [],
  primaryBoatId: null,

  addBoat: (boat) => {
    set((state) => ({
      boats: [...state.boats, boat],
      primaryBoatId: state.primaryBoatId || boat.id,
    }));
  },

  updateBoat: (id, updates) => {
    set((state) => ({
      boats: state.boats.map((b) =>
        b.id === id ? { ...b, ...updates } : b
      ),
    }));
  },

  primaryBoat: () => {
    const state = get();
    if (!state.primaryBoatId) return undefined;
    return state.boats.find((b) => b.id === state.primaryBoatId);
  },

  setPrimaryBoat: (id) => {
    set({ primaryBoatId: id });
  },
}));

// Mock data
export function initializeBoatStore() {
  const mockBoat: Boat = {
    id: "boat-1",
    name: "MARIVIO Test",
    type: "Motorsegelyacht",
    length_m: 9.5,
    beam_m: 3.2,
    draft_m: 1.2,
    fuel_capacity_liters: 200,
    fuel_consumption_liter_per_hour: 5,
    engine_hp: 27,
    motor_type: "Diesel",
    year_built: 2010,
    manufacturer: "Hallberg-Rassy",
  };

  useBoatStore.setState({
    boats: [mockBoat],
    primaryBoatId: mockBoat.id,
  });
}
