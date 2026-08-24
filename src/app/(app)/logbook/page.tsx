"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

interface Trip {
  id: string;
  trip_date: string;
  distance_nm: number;
  duration_minutes: number;
}

export default function LogbookPage() {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTrips();
  }, []);

  async function loadTrips() {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from("trips")
      .select("id, trip_date, distance_nm, duration_minutes")
      .eq("user_id", user.id)
      .order("trip_date", { ascending: false })
      .limit(10);

    setTrips(data ?? []);
    setLoading(false);
  }

  if (loading) return <div className="text-center py-8 text-mist/60">Laddar...</div>;

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-mist mb-6">LOGGBOK</h1>

      {trips.length === 0 ? (
        <div className="text-center py-12 text-mist/60">Inga turer ännu</div>
      ) : (
        <div className="space-y-3">
          {trips.map((trip) => (
            <div key={trip.id} className="bg-white/5 border border-sonar/20 rounded-2xl p-4">
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-semibold text-mist">
                    {new Date(trip.trip_date).toLocaleDateString("sv-SE")}
                  </p>
                  <p className="text-sm text-mist/70">
                    {trip.distance_nm} nm · {trip.duration_minutes} min
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
