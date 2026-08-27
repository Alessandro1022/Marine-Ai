"use client";

import { useEffect } from "react";
import { useTripStore } from "@/stores/tripStore";
import { TripCard } from "@/components/TripCard";
import { Anchor } from "lucide-react";

export default function TripsPage() {
  const trips = useTripStore((s) => s.trips);
  const loadTrips = useTripStore((s) => s.loadTrips);

  useEffect(() => {
    loadTrips();
  }, []);

  const totalDistance = trips.reduce((sum, t) => sum + t.distanceNm, 0);
  const totalHours = trips.reduce((sum, t) => sum + t.durationMinutes, 0) / 60;

  return (
    <div className="space-y-6 p-4 pb-28">
      <div>
        <h1 className="text-3xl font-bold text-mist mb-2">Dina Resor</h1>
        <p className="text-mist/60 text-sm">Strava för vatten</p>
      </div>

      {trips.length > 0 && (
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-sonar/10 border border-sonar/20 rounded-lg p-3">
            <p className="text-xs text-mist/50 mb-1">Total Distans</p>
            <p className="text-xl font-bold text-sonar">{Math.round(totalDistance)} NM</p>
          </div>
          <div className="bg-sonar/10 border border-sonar/20 rounded-lg p-3">
            <p className="text-xs text-mist/50 mb-1">Total Tid</p>
            <p className="text-xl font-bold text-sonar">{Math.round(totalHours)}h</p>
          </div>
        </div>
      )}

      {trips.length === 0 ? (
        <div className="text-center py-12">
          <Anchor size={48} className="mx-auto text-sonar/20 mb-3" />
          <p className="text-mist/60">Inga resor än. Starta din första!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {trips.map((trip) => (
            <TripCard key={trip.id} trip={trip} />
          ))}
        </div>
      )}
    </div>
  );
}
