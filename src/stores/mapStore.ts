import { create } from "zustand";

export type MapMode = "explore" | "route" | "measure" | "anchor";
export type BaseLayer = "chart" | "eniro" | "dark";

export interface LatLng {
  lat: number;
  lng: number;
}

interface MapState {
  mode: MapMode;
  setMode: (m: MapMode) => void;

  base: BaseLayer;
  setBase: (b: BaseLayer) => void;

  showSeamarks: boolean;
  showMarinas: boolean;
  showProtected: boolean;
  showDepth: boolean;
  toggle: (
    k: "showSeamarks" | "showMarinas" | "showProtected" | "showDepth"
  ) => void;

  routeStart: LatLng | null;
  routeEnd: LatLng | null;
  setRoutePoint: (p: LatLng) => void;
  clearRoute: () => void;

  measurePoints: LatLng[];
  addMeasurePoint: (p: LatLng) => void;
  clearMeasure: () => void;

  anchor: (LatLng & { radiusM: number }) | null;
  setAnchor: (a: (LatLng & { radiusM: number }) | null) => void;
}

export const useMapStore = create<MapState>((set, get) => ({
  mode: "explore",
  setMode: (mode) => set({ mode }),

  base: "chart",
  setBase: (base) => set({ base }),

  showSeamarks: true,
  showMarinas: true,
  showProtected: true,
  showDepth: true,
  toggle: (k) => set({ [k]: !get()[k] } as Partial<MapState>),

  routeStart: null,
  routeEnd: null,
  setRoutePoint: (p) => {
    const { routeStart, routeEnd } = get();
    if (!routeStart || (routeStart && routeEnd)) {
      set({ routeStart: p, routeEnd: null });
    } else {
      set({ routeEnd: p });
    }
  },
  clearRoute: () => set({ routeStart: null, routeEnd: null }),

  measurePoints: [],
  addMeasurePoint: (p) =>
    set({ measurePoints: [...get().measurePoints, p].slice(-12) }),
  clearMeasure: () => set({ measurePoints: [] }),

  anchor: null,
  setAnchor: (anchor) => set({ anchor }),
}));
