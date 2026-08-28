"use client";

import { useEffect } from "react";
import { Cloud, Anchor, MapPin, Wind, Waves, TrendingUp } from "lucide-react";
import { useGeolocation } from "@/hooks/useGeolocation";
import { useWeather } from "@/hooks/useWeather";
import { useForecast } from "@/hooks/useForecast";
import { useBoatStore } from "@/stores/boatStore";
import { useTripStore } from "@/stores/tripStore";

const GÖTEBORG = { lat: 57.7089, lon: 11.9746 };

export default function DashboardPage() {
  const primaryBoat = useBoatStore((s) => s.primaryBoat());
  const trips = useTripStore((s) => s.trips);
  const { lat, lon } = useGeolocation();
  
  const finalLat = lat || GÖTEBORG.lat;
  const finalLon = lon || GÖTEBORG.lon;
  
  const { data: weather } = useWeather(finalLat, finalLon);
  const { data: forecast } = useForecast(finalLat, finalLon);

  useEffect(() => {
    useBoatStore.getState().load();
    useTripStore.getState().loadTrips();
  }, []);

  const totalDistance = trips.reduce((sum, t) => sum + t.distanceNm, 0);

  return (
    <div className="space-y-6 p-4 pb-28">
      <div className="bg-gradient-to-br from-sonar/20 to-sonar/5 border border-sonar/30 rounded-2xl p-6">
        <h1 className="text-4xl font-bold text-mist mb-1">MARIVIO</h1>
        <p className="text-sonar text-sm">Din intelligenta sjöfartsassistent</p>
        <div className="mt-4 flex items-center gap-2 text-xs text-mist/70">
          <MapPin size={14} />
          <span>{finalLat.toFixed(3)}°N, {finalLon.toFixed(3)}°E</span>
        </div>
      </div>

      {weather && (
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-sonar/10 border border-sonar/20 rounded-xl p-4 space-y-2">
            <div className="flex items-center gap-2 text-sonar">
              <Cloud size={18} />
              <span className="text-xs text-mist/60">TEMPERATUR</span>
            </div>
            <p className="text-3xl font-bold text-mist">{Math.round(weather.temperature_c)}°</p>
          </div>

          <div className="bg-sonar/10 border border-sonar/20 rounded-xl p-4 space-y-2">
            <div className="flex items-center gap-2 text-sonar">
              <Wind size={18} />
              <span className="text-xs text-mist/60">VIND</span>
            </div>
            <p className="text-3xl font-bold text-mist">{Math.round(weather.wind_speed_ms)}</p>
            <p className="text-xs text-mist/50">m/s • {Math.round(weather.wind_direction_deg)}°</p>
          </div>

          {weather.wave_height_m && (
            <div className="bg-sonar/10 border border-sonar/20 rounded-xl p-4 space-y-2">
              <div className="flex items-center gap-2 text-sonar">
                <Waves size={18} />
                <span className="text-xs text-mist/60">VÅGOR</span>
              </div>
              <p className="text-3xl font-bold text-mist">{Math.round(weather.wave_height_m * 10) / 10}</p>
              <p className="text-xs text-mist/50">meter</p>
            </div>
          )}

          {weather.risk && (
            <div className={`rounded-xl p-4 space-y-2 border ${weather.risk === "red" ? "bg-red-500/10 border-red-500/20" : weather.risk === "yellow" ? "bg-yellow-500/10 border-yellow-500/20" : "bg-green-500/10 border-green-500/20"}`}>
              <span className="text-xs text-mist/60">VÄDERRISK</span>
              <p className={`text-2xl font-bold ${weather.risk === "red" ? "text-red-500" : weather.risk === "yellow" ? "text-yellow-500" : "text-green-500"}`}>
                {weather.risk === "red" ? "🔴 Högt" : weather.risk === "yellow" ? "🟡 Måttligt" : "🟢 Lågt"}
              </p>
            </div>
          )}
        </div>
      )}

      <div className="grid grid-cols-2 gap-3">
        {primaryBoat && (
          <div className="bg-sonar/10 border border-sonar/20 rounded-xl p-4">
            <div className="flex items-center gap-2 text-sonar mb-2">
              <Anchor size={16} />
              <span className="text-xs text-mist/60">DIN BÅT</span>
            </div>
            <p className="font-semibold text-mist text-sm mb-1">{primaryBoat.name}</p>
            <p className="text-xs text-mist/60">{primaryBoat.type}</p>
            <p className="text-xs text-mist/50 mt-2">Tank: {primaryBoat.fuel_capacity_liters}L</p>
          </div>
        )}

        {trips.length > 0 && (
          <div className="bg-sonar/10 border border-sonar/20 rounded-xl p-4">
            <div className="flex items-center gap-2 text-sonar mb-2">
              <TrendingUp size={16} />
              <span className="text-xs text-mist/60">STATISTIK</span>
            </div>
            <p className="font-semibold text-mist text-sm mb-1">{trips.length} resor</p>
            <p className="text-xs text-mist/60">{Math.round(totalDistance)} NM totalt</p>
          </div>
        )}
      </div>

      {forecast && forecast.hourly && forecast.hourly.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-mist/80 mb-3 uppercase tracking-wider">Väderprognos nästa 12 timmar</h2>
          <div className="grid grid-cols-3 gap-2">
            {forecast.hourly.slice(0, 6).map((hour: any, idx: number) => (
              <div key={idx} className="bg-sonar/10 border border-sonar/20 rounded-lg p-3 text-center text-xs">
                <p className="text-mist/60 mb-1">{new Date(hour.time).toLocaleTimeString("sv-SE", { hour: "2-digit", minute: "2-digit" })}</p>
                <p className="text-lg font-bold text-sonar">{Math.round(hour.temperature_c)}°</p>
                {hour.wind_speed_ms && <p className="text-mist/60 mt-1">💨 {Math.round(hour.wind_speed_ms)} m/s</p>}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3 pt-2">
        <a href="/map" className="block p-4 bg-sonar/20 hover:bg-sonar/30 text-sonar border border-sonar/30 rounded-xl font-semibold text-center transition">🗺️<br /><span className="text-sm">Karta</span></a>
        <a href="/ai" className="block p-4 bg-sonar/20 hover:bg-sonar/30 text-sonar border border-sonar/30 rounded-xl font-semibold text-center transition">🤖<br /><span className="text-sm">AI Chat</span></a>
        <a href="/trips" className="block p-4 bg-sonar/20 hover:bg-sonar/30 text-sonar border border-sonar/30 rounded-xl font-semibold text-center transition">⚓<br /><span className="text-sm">Resor</span></a>
        <a href="/boats" className="block p-4 bg-sonar/20 hover:bg-sonar/30 text-sonar border border-sonar/30 rounded-xl font-semibold text-center transition">⛵<br /><span className="text-sm">Båtar</span></a>
      </div>
    </div>
  );
}
