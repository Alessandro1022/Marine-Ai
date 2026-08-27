"use client";

import { useState } from "react";
import { Play, Square } from "lucide-react";
import { useTripStore } from "@/stores/tripStore";
import { useGeolocation } from "@/hooks/useGeolocation";
import { useTrip } from "@/hooks/useTrip";

export function TripStartButton() {
  const { lat, lon } = useGeolocation();
  const { activeTrip, startTrip, endTrip, isRecording } = useTripStore();
  const [isLoading, setIsLoading] = useState(false);

  useTrip();

  async function handleStart() {
    if (!lat || !lon) {
      alert("GPS inte tillgänglig");
      return;
    }
    startTrip(lat, lon);
  }

  async function handleStop() {
    if (!activeTrip || !lat || !lon) return;
    setIsLoading(true);
    try {
      await endTrip(lat, lon);
      alert("Resa sparad i loggbok! ⚓");
    } catch (error) {
      console.error("Error ending trip:", error);
      alert("Kunde inte spara resa");
    } finally {
      setIsLoading(false);
    }
  }

  if (isRecording && activeTrip) {
    return (
      <button
        onClick={handleStop}
        disabled={isLoading}
        className="absolute bottom-20 right-3 z-40 px-4 py-3 bg-red-500/30 hover:bg-red-500/40 text-red-400 rounded-full font-semibold flex items-center gap-2 transition disabled:opacity-50"
      >
        <Square size={16} />
        {isLoading ? "Sparar..." : "AVSLUTA RESA"}
      </button>
    );
  }

  return (
    <button
      onClick={handleStart}
      className="absolute bottom-20 right-3 z-40 px-4 py-3 bg-green-500/30 hover:bg-green-500/40 text-green-400 rounded-full font-semibold flex items-center gap-2 transition"
    >
      <Play size={16} />
      STARTA RESA
    </button>
  );
}
