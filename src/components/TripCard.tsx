"use client";

import Link from "next/link";
import { type Trip } from "@/stores/tripStore";
import { MapPin, Clock, Wind, Anchor } from "lucide-react";

interface TripCardProps {
  trip: Trip;
}

export function TripCard({ trip }: TripCardProps) {
  const date = new Date(trip.startTime).toLocaleDateString("sv-SE", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });

  return (
    <Link href={`/trips/${trip.id}`}>
      <div className="bg-sonar/10 border border-sonar/20 rounded-xl p-4 hover:border-sonar/40 transition cursor-pointer">
        <div className="flex justify-between items-start mb-3">
          <div>
            <h3 className="font-semibold text-mist">{trip.title}</h3>
            <p className="text-xs text-mist/50">{date}</p>
          </div>
          <span className="text-lg font-bold text-sonar">{trip.distanceNm} NM</span>
        </div>

        <div className="grid grid-cols-3 gap-3 text-xs">
          <div className="flex items-center gap-2">
            <Clock size={14} className="text-sonar/60" />
            <div>
              <p className="text-mist/50">Tid</p>
              <p className="text-mist">{trip.durationMinutes}m</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Wind size={14} className="text-sonar/60" />
            <div>
              <p className="text-mist/50">Snitt</p>
              <p className="text-mist">{trip.avgSpeedKn} kn</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Anchor size={14} className="text-sonar/60" />
            <div>
              <p className="text-mist/50">Max</p>
              <p className="text-mist">{trip.maxSpeedKn} kn</p>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
