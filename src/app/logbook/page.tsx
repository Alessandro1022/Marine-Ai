"use client";

import { useEffect, useRef, useState } from "react";
import { Play, Square, MapPin, Zap, Clock, Droplet } from "lucide-react";
import { useGeolocation } from "@/hooks/useGeolocation";
import { useBoatStore } from "@/stores/boatStore";
import { useSettingsStore } from "@/stores/settingsStore";
import { createClient } from "@/lib/supabase/client";
import { haversineNm } from "@/lib/services/routeEngine";
import { litersPerNm } from "@/lib/services/fuelCalculator";
import { PageHeader } from "@/components/ui/PageHeader";
import type { Trip } from "@/types";

interface LiveTrip {
  startTime: Date;
  positions: { lat: number; lng: number; time: Date }[];
  currentDist: number;
}

export default function LogbookPage() {
  const { lat, lon } = useGeolocation();
  const boat = useBoatStore((s) => s.primaryBoat());
  const fuelPrice = useSettingsStore((s) => s.fuelPriceSek);

  const [trips, setTrips] = useState<Trip[]>([]);
  const [liveTrip, setLiveTrip] = useState<LiveTrip | null>(null);
  const [recording, setRecording] = useState(false);
  const locWatchRef = useRef<number | null>(null);

  useEffect(() => {
    const loadTrips = async () => {
      const supabase = createClient();
      const { data } = await supabase
        .from("trips")
        .select("*")
        .order("trip_date", { ascending: false })
        .limit(10);
      setTrips((data as Trip[]) || []);
    };
    loadTrips();
  }, []);

  const startRecording = () => {
    setRecording(true);
    setLiveTrip({
      startTime: new Date(),
      positions: [{ lat, lng: lon, time: new Date() }],
      currentDist: 0,
    });

    locWatchRef.current = navigator.geolocation.watchPosition((pos) => {
      setLiveTrip((prev) => {
        if (!prev) return null;
        const lastPos = prev.positions[prev.positions.length - 1];
        const dist = haversineNm(lastPos.lat, lastPos.lng, pos.coords.latitude, pos.coords.longitude);
        const totalDist = prev.positions.reduce((sum, p, i) => {
          if (i === 0) return 0;
          return sum + haversineNm(prev.positions[i - 1].lat, prev.positions[i - 1].lng, p.lat, p.lng);
        }, dist);

        return {
          ...prev,
          positions: [...prev.positions, { lat: pos.coords.latitude, lng: pos.coords.longitude, time: new Date() }],
          currentDist: totalDist,
        };
      });
    });
  };

  const stopRecording = async () => {
    if (!liveTrip || !boat) return;
    setRecording(false);

    if (locWatchRef.current) {
      navigator.geolocation.clearWatch(locWatchRef.current);
    }

    const durationMin = Math.round((Date.now() - liveTrip.startTime.getTime()) / 60000);
    const avgSpeed = liveTrip.currentDist / (durationMin / 60);
    const fuel = litersPerNm(boat.boat_type, boat.cruise_speed_knots || 10) * liveTrip.currentDist;
    const cost = fuel * fuelPrice;

    const trip: Trip = {
      id: "",
      user_id: "",
      boat_id: boat.id,
      trip_date: new Date().toISOString().split("T")[0],
      start_time: liveTrip.startTime.toISOString(),
      end_time: new Date().toISOString(),
      start_location: "Segling",
      destination: "Slut",
      start_lat: liveTrip.positions[0]?.lat || 0,
      start_lon: liveTrip.positions[0]?.lng || 0,
      end_lat: liveTrip.positions[liveTrip.positions.length - 1]?.lat || 0,
      end_lon: liveTrip.positions[liveTrip.positions.length - 1]?.lng || 0,
      distance_nm: liveTrip.currentDist,
      duration_minutes: durationMin,
      avg_speed_knots: avgSpeed,
      fuel_used_liters: fuel,
      fuel_cost_sek: cost,
      notes: "",
      track_geojson: {
        type: "LineString",
        coordinates: liveTrip.positions.map((p) => [p.lng, p.lat]),
      },
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    } as Trip;

    const supabase = createClient();
    await supabase.from("trips").insert([trip]);

    setTrips((prev) => [trip, ...prev]);
    setLiveTrip(null);
  };

  return (
    <div className="flex flex-col gap-4 pb-24">
      <PageHeader title="Loggbok" subtitle="Dina seglingar" />

      {recording && liveTrip ? (
        <section className="holo-panel p-4">
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div>
              <p className="instrument-label">Distans</p>
              <p className="instrument text-2xl glow-text">{liveTrip.currentDist.toFixed(1)} nm</p>
            </div>
            <div>
              <p className="instrument-label">Tid</p>
              <p className="instrument text-lg">
                {Math.floor((Date.now() - liveTrip.startTime.getTime()) / 60000)} min
              </p>
            </div>
            <div>
              <p className="instrument-label">Fart</p>
              <p className="instrument text-lg">
                {(liveTrip.currentDist / ((Date.now() - liveTrip.startTime.getTime()) / 3600000)).toFixed(1)} kn
              </p>
            </div>
            <div>
              <p className="instrument-label">Bränsle</p>
              <p className="instrument text-lg">
                ~{(litersPerNm(boat?.boat_type || "motorboat", boat?.cruise_speed_knots || 10) * liveTrip.currentDist).toFixed(1)} L
              </p>
            </div>
          </div>
          <button onClick={stopRecording} className="btn-primary w-full !py-3">
            <Square size={18} /> Stoppa
          </button>
        </section>
      ) : (
        <button onClick={startRecording} className="btn-primary w-full !py-3">
          <Play size={18} /> Starta loggning
        </button>
      )}

      <div>
        <h2 className="instrument-label mb-2">Tidigare seglingar</h2>
        <div className="flex flex-col gap-2">
          {trips.map((trip) => (
            <div key={trip.id} className="glass-card p-4">
              <p className="font-semibold">{trip.start_location}</p>
              <div className="grid grid-cols-2 gap-2 mt-2 text-sm">
                <p className="flex items-center gap-1 text-mist">
                  <MapPin size={14} /> {trip.distance_nm?.toFixed(1)} nm
                </p>
                <p className="flex items-center gap-1 text-mist">
                  <Clock size={14} /> {trip.duration_minutes} min
                </p>
                <p className="flex items-center gap-1 text-mist">
                  <Zap size={14} /> {trip.avg_speed_knots?.toFixed(1)} kn
                </p>
                <p className="flex items-center gap-1 text-mist">
                  <Droplet size={14} /> {trip.fuel_used_liters?.toFixed(1)} L
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
