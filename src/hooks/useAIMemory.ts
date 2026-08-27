import { useMemo } from 'react';
import { useBoatStore } from '@/stores/boatStore';
import { useTripStore } from '@/stores/tripStore';

export function useAIMemory() {
  const boat = useBoatStore((s) => s.primaryBoat());
  const trips = useTripStore((s) => s.trips);
  const activeTrip = useTripStore((s) => s.activeTrip);

  const context = useMemo(() => {
    const recentTrips = trips.slice(0, 5);
    
    const stats = {
      totalTrips: trips.length,
      totalDistance: trips.reduce((sum, t) => sum + t.distanceNm, 0),
      totalHours: trips.reduce((sum, t) => sum + t.durationMinutes, 0) / 60,
      avgSpeed: trips.length > 0 
        ? trips.reduce((sum, t) => sum + t.avgSpeedKn, 0) / trips.length
        : 0,
      favoriteAreas: trips.length > 0 
        ? getFavoriteAreas(trips)
        : [],
    };

    const boatInfo = boat ? {
      name: boat.name,
      type: boat.type,
      length_m: boat.length_m,
      beam_m: boat.beam_m,
      draft_m: boat.draft_m,
      fuel_capacity_liters: boat.fuel_capacity_liters,
      fuel_consumption_liter_per_hour: boat.fuel_consumption_liter_per_hour,
      engine_hp: boat.engine_hp,
    } : null;

    const currentStatus = activeTrip ? {
      isRecording: true,
      startedAt: new Date(activeTrip.startTime).toISOString(),
      distanceSoFar: activeTrip.distanceNm,
      durationSoFar: activeTrip.durationMinutes,
      pointsRecorded: activeTrip.points.length,
    } : {
      isRecording: false,
    };

    return {
      boatInfo,
      stats,
      recentTrips: recentTrips.map(t => ({
        title: t.title,
        date: new Date(t.startTime).toLocaleDateString('sv-SE'),
        distance: t.distanceNm,
        duration: `${t.durationMinutes}m`,
        avgSpeed: `${t.avgSpeedKn} kn`,
        maxSpeed: `${t.maxSpeedKn} kn`,
      })),
      currentStatus,
    };
  }, [boat, trips, activeTrip]);

  return context;
}

function getFavoriteAreas(trips: any[]) {
  const areas: { [key: string]: number } = {};
  
  trips.forEach(trip => {
    const key = `${Math.round(trip.startLat * 10) / 10},${Math.round(trip.startLon * 10) / 10}`;
    areas[key] = (areas[key] || 0) + 1;
  });

  return Object.entries(areas)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([coords, count]) => ({ coords, visits: count }));
}
