"use client";

import { useTripStore } from "@/stores/tripStore";
import { notFound } from "next/navigation";
import { MapPin, Clock, Wind, Anchor, Share2 } from "lucide-react";

export default function TripDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const trip = useTripStore((s) => s.getTripById(params.id));

  if (!trip) notFound();

  const startDate = new Date(trip.startTime).toLocaleString("sv-SE");
  const endDate = trip.endTime ? new Date(trip.endTime).toLocaleString("sv-SE") : "-";

  return (
    <div className="space-y-6 p-4 pb-28">
      <div>
        <h1 className="text-3xl font-bold text-mist mb-2">{trip.title}</h1>
        <p className="text-mist/60 text-sm">{startDate}</p>
      </div>

      {/* Main Stats */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-sonar/10 border border-sonar/20 rounded-lg p-4">
          <p className="text-xs text-mist/50 mb-2">Distans</p>
          <p className="text-2xl font-bold text-sonar">{trip.distanceNm}</p>
          <p className="text-xs text-mist/50 mt-1">NM</p>
        </div>

        <div className="bg-sonar/10 border border-sonar/20 rounded-lg p-4">
          <p className="text-xs text-mist/50 mb-2">Tid</p>
          <p className="text-2xl font-bold text-sonar">{trip.durationMinutes}</p>
          <p className="text-xs text-mist/50 mt-1">minuter</p>
        </div>

        <div className="bg-sonar/10 border border-sonar/20 rounded-lg p-4">
          <p className="text-xs text-mist/50 mb-2">Genomsnitt</p>
          <p className="text-2xl font-bold text-sonar">{trip.avgSpeedKn}</p>
          <p className="text-xs text-mist/50 mt-1">kn</p>
        </div>

        <div className="bg-sonar/10 border border-sonar/20 rounded-lg p-4">
          <p className="text-xs text-mist/50 mb-2">Max Fart</p>
          <p className="text-2xl font-bold text-sonar">{trip.maxSpeedKn}</p>
          <p className="text-xs text-mist/50 mt-1">kn</p>
        </div>
      </div>

      {/* Details */}
      <div className="space-y-3">
        <div className="bg-sonar/5 border border-sonar/20 rounded-lg p-4">
          <p className="text-xs text-mist/50 mb-2">Start</p>
          <p className="text-sm text-mist">
            {trip.startLat.toFixed(4)}°, {trip.startLon.toFixed(4)}°
          </p>
        </div>

        {trip.endLat && trip.endLon && (
          <div className="bg-sonar/5 border border-sonar/20 rounded-lg p-4">
            <p className="text-xs text-mist/50 mb-2">Slut</p>
            <p className="text-sm text-mist">
              {trip.endLat.toFixed(4)}°, {trip.endLon.toFixed(4)}°
            </p>
          </div>
        )}

        {trip.notes && (
          <div className="bg-sonar/5 border border-sonar/20 rounded-lg p-4">
            <p className="text-xs text-mist/50 mb-2">Anteckningar</p>
            <p className="text-sm text-mist">{trip.notes}</p>
          </div>
        )}
      </div>

      {/* Actions */}
      <button className="w-full px-4 py-3 bg-sonar/25 hover:bg-sonar/35 text-sonar rounded-lg font-semibold flex items-center justify-center gap-2 transition">
        <Share2 size={18} />
        Dela Resa
      </button>
    </div>
  );
}
