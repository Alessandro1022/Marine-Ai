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
  load: () => Promise<void>;
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

  load: async () => {
    const saved = localStorage.getItem('marivio_boats');
    if (saved) {
      try {
        const boats = JSON.parse(saved);
        set({ boats, primaryBoatId: boats[0]?.id || null });
      } catch (error) {
        console.error('Error loading boats:', error);
        // Initialize with mock data if load fails
        initializeBoatStore();
      }
    } else {
      // Initialize with mock data
      initializeBoatStore();
    }
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

  localStorage.setItem('marivio_boats', JSON.stringify([mockBoat]));
}
