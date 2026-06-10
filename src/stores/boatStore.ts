import { create } from "zustand";
import { createClient } from "@/lib/supabase/client";
import type { Boat } from "@/types";

interface BoatState {
  boats: Boat[];
  loading: boolean;
  fetchBoats: () => Promise<void>;
  load: () => Promise<void>;
  primaryBoat: () => Boat | null;
  setBoats: (boats: Boat[]) => void;
}

export const useBoatStore = create<BoatState>((set, get) => ({
  boats: [],
  loading: false,

  primaryBoat: () => {
    const { boats } = get();
    return boats.find((b) => b.is_primary) ?? boats[0] ?? null;
  },

  setBoats: (boats) => set({ boats }),

  fetchBoats: async () => {
    set({ loading: true });
    const supabase = createClient();
    const { data } = await supabase
      .from("boats")
      .select("*")
      .order("is_primary", { ascending: false });
    set({ boats: (data as Boat[]) ?? [], loading: false });
  },

  load: async () => {
    set({ loading: true });
    const supabase = createClient();
    const { data } = await supabase
      .from("boats")
      .select("*")
      .order("is_primary", { ascending: false });
    set({ boats: (data as Boat[]) ?? [], loading: false });
  },
}));
