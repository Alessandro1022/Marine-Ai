import { createClient } from "@/lib/supabase/client";
import { haversineNm } from "@/lib/services/routeEngine";
import type { Boat, WeatherSnapshot } from "@/types";

export interface AIContext {
  location: string;
  weather: string;
  boat: string;
  marinas: string;
  timeOfDay: string;
}

export async function buildAIContext(
  lat: number,
  lon: number,
  weather: WeatherSnapshot | null | undefined,  
  Accepterar `undefined`
  boat: Boat | null | undefined
)

  const { data: marinas } = await supabase
    .from("marinas")
    .select("name, latitude, longitude, has_fuel, has_water")
    .limit(5);

  const nearbyMarinas = (marinas as any[] || [])
    .map((m) => {
      const dist = haversineNm(lat, lon, m.latitude, m.longitude);
      return { ...m, dist };
    })
    .sort((a, b) => a.dist - b.dist)
    .slice(0, 3)
    .map((m) => `${m.name} (${m.dist.toFixed(1)}nm)`)
    .join(", ");

  const now = new Date();
  const hour = now.getHours();
  const timeOfDay = hour < 6 ? "Natt" : hour < 12 ? "Morgon" : hour < 17 ? "Eftermiddag" : "Kväll";

  return {
    location: `${lat.toFixed(2)}°N ${lon.toFixed(2)}°E`,
    weather: weather
      ? `Vind ${weather.wind_speed_ms}m/s, vågor ${weather.wave_height_m?.toFixed(1) ?? "?"}m, ${weather.temperature_c}°C`
      : "Väder ej tillgängligt",
    boat: boat
      ? `${boat.name}: ${boat.boat_type}, cruise ${boat.cruise_speed_knots || "?"}kn, bränsle ${Math.round(boat.fuel_level_percent || 0)}%`
      : "Ingen båt vald",
    marinas: nearbyMarinas || "Inga marinor nära",
    timeOfDay,
  };
}

export function formatContextForAI(context: AIContext): string {
  return [
    `**Position:** ${context.location}`,
    `**Väder:** ${context.weather}`,
    `**Båt:** ${context.boat}`,
    `**Marinor:** ${context.marinas}`,
    `**Tid:** ${context.timeOfDay}`,
  ].join("\n");
}
