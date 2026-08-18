"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useGeolocation } from "@/hooks/useGeolocation";
import { Pause, Play } from "lucide-react";

export default function LogbookPage() {
  const router = useRouter();
  const geo = useGeolocation();
  const [trips, setTrips] = useState([]);
  const [recording, setRecording] = useState(false);
  const [duration, setDuration] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTrips();
  }, []);

  useEffect(() => {
    if (!recording) return;
    const timer = setInterval(() => setDuration((d) => d + 1), 1000);
    return () => clearInterval(timer);
  }, [recording]);

  async function loadTrips() {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      router.push("/login");
      return;
    }
    const { data } = await supabase
      .from("trips")
      .select("*")
      .eq("user_id", user.id)
      .order("trip_date", { ascending: false })
      .limit(10);
    setTrips(data ?? []);
    setLoading(false);
  }

  async function startRecording() {
    setRecording(true);
    setDuration(0);
  }

  async function stopRecording() {
    setRecording(false);
  }

  const formatDuration = (seconds) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs.toString().padStart(2, "0")}:${mins
      .toString()
      .padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className="min-h-screen bg-deep p-4 pb-24">
      <div className="mx-auto max-w-2xl">
        <h1 className="text-3xl font-bold text-foam mb-2">Loggbok</h1>
        <p className="text-mist mb-6">Dina seglingar</p>

        {recording ? (
          <div className="mb-6 rounded-xl border border-sonar/30 bg-deep/50 p-4 backdrop-blur">
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm text-mist">Loggning pågår...</p>
              <p className="font-mono text-lg text-sonar glow-text">
                {formatDuration(duration)}
              </p>
            </div>
            <button
              onClick={stopRecording}
              className="flex-1 btn-primary !py-3 flex items-center justify-center gap-2"
            >
              <Pause size={16} /> Avsluta
            </button>
          </div>
        ) : (
          <button
            onClick={startRecording}
            className="w-full mb-6 btn-primary !py-4 flex items-center justify-center gap-2 text-lg"
          >
            <Play size={20} /> Starta loggning
          </button>
        )}

        <div>
          <h2 className="text-lg font-semibold text-foam mb-4">
            Tidigare seglingar
          </h2>

          {loading ? (
            <div className="text-center py-8 text-mist">Laddar...</div>
          ) : trips.length === 0 ? (
            <div className="text-center py-8 text-mist">
              Ingen data än. Starta din första loggning!
            </div>
          ) : (
            <div className="space-y-3">
              {trips.map((trip) => (
                <div
                  key={trip.id}
                  className="rounded-xl border border-white/10 bg-deep/30 p-4 backdrop-blur hover:border-sonar/50 transition-colors"
                >
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <p className="font-semibold text-foam">{trip.start_location}</p>
                      <p className="text-sm text-mist">
                        → {trip.destination}
                      </p>
                    </div>
                    <p className="text-xs text-mist/70">{trip.trip_date}</p>
                  </div>

                  <div className="flex gap-4 text-sm">
                    <div>
                      <p className="text-mist">Tid</p>
                      <p className="text-sonar font-mono">
                        {trip.duration_minutes} min
                      </p>
                    </div>
                    <div>
                      <p className="text-mist">Avstånd</p>
                      <p className="text-sonar font-mono">
                        {trip.distance_nm.toFixed(1)} nm
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
