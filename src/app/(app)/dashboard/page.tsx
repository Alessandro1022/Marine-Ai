"use client";

import { useEffect } from "react";
import { useT } from "@/lib/i18n";
import { useAuthStore } from "@/stores/authStore";
import { useBoatStore } from "@/stores/boatStore";
import { useGeolocation } from "@/hooks/useGeolocation";
import { useWeather } from "@/hooks/useWeather";
import { useForecast } from "@/hooks/useForecast";
import { Cloud, Anchor, MapPin, Wind } from "lucide-react";

export default function DashboardPage() {
  const t = useT();
  const profile = useAuthStore((s) => s.profile);
  const primaryBoat = useBoatStore((s) => s.primaryBoat());
  const { lat, lon } = useGeolocation();
const { data: weather } = useWeather(lat || 57.7089, lon || 11.9746);
const { data: forecast } = useForecast(lat || 57.7089, lon || 11.9746);

  useEffect(() => {
    useBoatStore.getState().load();
  }, []);

  return (
    <div className="space-y-6 p-4 pb-28">
      {/* HEADER */}
      <div>
        <h1 className="text-3xl font-bold text-mist">
          Välkommen, {profile?.name || "Kapten"}!
        </h1>
        <p className="text-mist/60 text-sm">MARIVIO Dashboard</p>
      </div>

      {/* QUICK STATS */}
      <div className="grid grid-cols-2 gap-3">
        {lat && lon && (
          <div className="bg-sonar/10 border border-sonar/20 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <MapPin size={16} className="text-sonar" />
              <p className="text-xs text-mist/50">Position</p>
            </div>
            <p className="text-sm text-mist">
              {lat.toFixed(3)}°<br />
              {lon.toFixed(3)}°
            </p>
          </div>
        )}

        {weather && (
          <div className="bg-sonar/10 border border-sonar/20 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Cloud size={16} className="text-sonar" />
              <p className="text-xs text-mist/50">Väder</p>
            </div>
            <p className="text-sm text-mist">{Math.round(weather.temp)}°C</p>
            <p className="text-xs text-mist/70">{weather.description}</p>
          </div>
        )}

        {weather && (
          <div className="bg-sonar/10 border border-sonar/20 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Wind size={16} className="text-sonar" />
              <p className="text-xs text-mist/50">Vind</p>
            </div>
            <p className="text-sm text-mist">{Math.round(weather.wind_speed)} m/s</p>
            <p className="text-xs text-mist/70">{weather.wind_direction}°</p>
          </div>
        )}

        {primaryBoat && (
          <div className="bg-sonar/10 border border-sonar/20 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Anchor size={16} className="text-sonar" />
              <p className="text-xs text-mist/50">Båt</p>
            </div>
            <p className="text-sm text-mist">{primaryBoat.name}</p>
            <p className="text-xs text-mist/70">{primaryBoat.type}</p>
          </div>
        )}
      </div>

      {/* FORECAST */}
      {forecast && forecast.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-mist mb-3">Väderprognos</h2>
          <div className="space-y-2">
            {forecast.slice(0, 3).map((f, i) => (
              <div key={i} className="bg-sonar/5 border border-sonar/20 rounded-lg p-3">
                <div className="flex justify-between items-center">
                  <p className="text-sm text-mist">
                    {new Date(f.time).toLocaleTimeString("sv-SE", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                  <p className="text-sm text-sonar font-semibold">{Math.round(f.temp)}°C</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* CTA */}
      <div className="space-y-2">
        <a
          href="/map"
          className="block w-full px-4 py-3 bg-sonar/25 hover:bg-sonar/35 text-sonar rounded-lg font-semibold text-center transition"
        >
          Gå till Karta
        </a>
        <a
          href="/ai"
          className="block w-full px-4 py-3 bg-white/5 hover:bg-white/10 text-mist rounded-lg font-semibold text-center transition"
        >
          Fråga AI
        </a>
      </div>
    </div>
  );
}
