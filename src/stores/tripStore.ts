import { create } from 'zustand';

export interface TripPoint {
  lat: number;
  lon: number;
  timestamp: number;
  sogKn: number;
  cogDeg: number;
  fuelPercent?: number;
}

export interface Trip {
  id: string;
  title: string;
  startTime: number;
  endTime?: number;
  startLat: number;
  startLon: number;
  endLat?: number;
  endLon?: number;
  points: TripPoint[];
  distanceNm: number;
  durationMinutes: number;
  avgSpeedKn: number;
  maxSpeedKn: number;
  fuelUsedLiters?: number;
  notes?: string;
}

interface TripState {
  activeTrip: Trip | null;
  trips: Trip[];
  isRecording: boolean;
  
  startTrip: (lat: number, lon: number) => void;
  addPoint: (point: TripPoint) => void;
  endTrip: (endLat: number, endLon: number) => Promise<void>;
  
  getTrips: () => Trip[];
  getTripById: (id: string) => Trip | undefined;
  loadTrips: () => Promise<void>;
}

export const useTripStore = create<TripState>((set, get) => ({
  activeTrip: null,
  trips: [],
  isRecording: false,

  startTrip: (lat, lon) => {
    const trip: Trip = {
      id: Date.now().toString(),
      title: `Resa ${new Date().toLocaleDateString('sv-SE')}`,
      startTime: Date.now(),
      startLat: lat,
      startLon: lon,
      points: [],
      distanceNm: 0,
      durationMinutes: 0,
      avgSpeedKn: 0,
      maxSpeedKn: 0,
    };
    set({ activeTrip: trip, isRecording: true });
  },

  addPoint: (point) => {
    set((state) => {
      if (!state.activeTrip) return state;
      const updated = {
        ...state.activeTrip,
        points: [...state.activeTrip.points, point],
      };
      return { activeTrip: updated };
    });
  },

  endTrip: async (endLat, endLon) => {
    const state = get();
    if (!state.activeTrip) return;

    const trip = state.activeTrip;
    const durationMin = (Date.now() - trip.startTime) / 60000;
    const points = trip.points;
    
    let distanceNm = 0;
    for (let i = 1; i < points.length; i++) {
      const prev = points[i - 1];
      const curr = points[i];
      distanceNm += haversine(prev.lat, prev.lon, curr.lat, curr.lon);
    }

    const avgSpeed = durationMin > 0 ? distanceNm / (durationMin / 60) : 0;
    const maxSpeed = points.length > 0 ? Math.max(...points.map(p => p.sogKn)) : 0;

    const completed: Trip = {
      ...trip,
      endTime: Date.now(),
      endLat,
      endLon,
      durationMinutes: Math.round(durationMin),
      distanceNm: Math.round(distanceNm * 10) / 10,
      avgSpeedKn: Math.round(avgSpeed * 10) / 10,
      maxSpeedKn: Math.round(maxSpeed * 10) / 10,
    };

    // Save to localStorage
    const allTrips = [completed, ...state.trips];
    localStorage.setItem('marivio_trips', JSON.stringify(allTrips));

    // TODO: Save to Supabase
    try {
      const response = await fetch('/api/trips', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(completed),
      });
      if (!response.ok) console.error('Failed to save trip to Supabase');
    } catch (error) {
      console.error('Error saving trip:', error);
    }

    set({
      activeTrip: null,
      trips: allTrips,
      isRecording: false,
    });
  },

  getTrips: () => get().trips,
  getTripById: (id) => get().trips.find(t => t.id === id),
  
  loadTrips: async () => {
    const saved = localStorage.getItem('marivio_trips');
    if (saved) {
      set({ trips: JSON.parse(saved) });
    }
  },
}));

function haversine(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 3440.065; // Nautical miles
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}
