"use client";

import { useEffect } from "react";
import { Cloud, Anchor, MapPin, Wind, Waves } from "lucide-react";
import { useGeolocation } from "@/hooks/useGeolocation";
import { useWeather } from "@/hooks/useWeather";
import { useForecast } from "@/hooks/useForecast";
import { useBoatStore } from "@/stores/boatStore";

const GÖTEBORG = { lat: 57.7089, lon: 11.9746 };

export default function DashboardPage() {
  const primaryBoat = useBoatStore((s) => s.primaryBoat());
  const { lat, lon } = useGeolocation();
  
  const finalLat = lat || GÖTEBORG.lat;
  const finalLon = lon || GÖTEBORG.lon;
  
  const { data: weather } = useWeather(finalLat, finalLon);
  const { data: forecast } = useForecast(finalLat, finalLon);

  useEffect(() => {
    useBoatStore.getState().load();
  }, []);

  return (
    <div className="space-y-6 p-4 pb-28">
      {/* HEADER */}
      <div>
        <h1 className="text-3xl font-bold text-mist">MARIVIO</h1>
        <p className="text-mist/60 text-sm">Din AI Sjöfartsassistent</p>
      </div>

      {/* STATS GRID */}
      <div className="grid grid-cols-2 gap-3">
        {/* POSITION */}
        <div className="bg-sonar/10 border border-sonar/20 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <MapPin size={16} className="text-sonar" />
            <p className="text-xs text-mist/50">Position</p>
          </div>
          <p className="text-sm text-mist font-mono">
            {finalLat.toFixed(3)}°<br />
            {finalLon.toFixed(3)}°
          </p>
        </div>

        {/* TEMPERATURE */}
        {weather && (
          <div className="bg-sonar/10 border border-sonar/20 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Cloud size={16} className="text-sonar" />
              <p className="text-xs text-mist/50">Temperatur</p>
            </div>
            <p className="text-sm text-mist font-semibold">
              {Math.round(weather.temperature_c)}°C
            </p>
          </div>
        )}

        {/* WIND */}
        {weather && (
          <div className="bg-sonar/10 border border-sonar/20 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Wind size={16} className="text-sonar" />
              <p className="text-xs text-mist/50">Vind</p>
            </div>
            <p className="text-sm text-mist font-semibold">
              {Math.round(weather.wind_speed_ms)} m/s
            </p>
            <p className="text-xs text-mist/70">
              {Math.round(weather.wind_direction_deg)}°
            </p>
          </div>
        )}

        {/* BOAT */}
        {primaryBoat && (
          <div className="bg-sonar/10 border border-sonar/20 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Anchor size={16} className="text-sonar" />
              <p className="text-xs text-mist/50">Båt</p>
            </div>
            <p className="text-sm text-mist font-semibold">{primaryBoat.name}</p>
            <p className="text-xs text-mist/70">{primaryBoat.type}</p>
          </div>
        )}
      </div>

      {/* FORECAST */}
      {forecast && forecast.hourly && forecast.hourly.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-mist mb-3">Väderprognos (24h)</h2>
          <div className="space-y-2">
            {forecast.hourly.slice(0, 4).map((hour, idx) => (
              <div key={idx} className="bg-sonar/5 border border-sonar/20 rounded-lg p-3">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-mist/60">
                    {new Date(hour.time).toLocaleTimeString("sv-SE", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                  <span className="text-sm text-sonar font-semibold">
                    {Math.round(hour.temperature)}°C
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ACTIONS */}
      <div className="space-y-2">
        <a
          href="/map"
          className="block w-full px-4 py-3 bg-sonar/25 hover:bg-sonar/35 text-sonar rounded-lg font-semibold text-center transition"
        >
          🗺️ Gå till Karta
        </a>
        <a
          href="/ai"
          className="block w-full px-4 py-3 bg-white/5 hover:bg-white/10 text-mist rounded-lg font-semibold text-center transition"
        >
          🤖 Fråga AI
        </a>
        <a
          href="/trips"
          className="block w-full px-4 py-3 bg-white/5 hover:bg-white/10 text-mist rounded-lg font-semibold text-center transition"
        >
          ⚓ Dina Resor
        </a>
      </div>
    </div>
  );
}
