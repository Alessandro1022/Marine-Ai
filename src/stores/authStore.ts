import { create } from "zustand";
import { createClient } from "@/lib/supabase/client";
import type { Profile } from "@/types";

interface AuthState {
  profile: Profile | null;
  loading: boolean;
  init: () => Promise<void>;
  fetchProfile: () => Promise<void>;
  setProfile: (profile: Profile | null) => void;
  signOut: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  profile: null,
  loading: false,

  setProfile: (profile) => set({ profile }),

  init: async () => {
    set({ loading: true });
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { set({ profile: null, loading: false }); return; }
    const { data } = await supabase.from("profiles").select("*").eq("id", user.id).single();
    set({ profile: (data as Profile) ?? null, loading: false });
  },

  fetchProfile: async () => {
    set({ loading: true });
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { set({ profile: null, loading: false }); return; }
    const { data } = await supabase.from("profiles").select("*").eq("id", user.id).single();
    set({ profile: (data as Profile) ?? null, loading: false });
  },

  signOut: async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    set({ profile: null });
  },
}));
