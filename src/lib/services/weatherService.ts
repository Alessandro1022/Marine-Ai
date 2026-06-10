
import type { RiskLevel, WeatherSnapshot } from "@/types";

const FORECAST_URL = "https://api.open-meteo.com/v1/forecast";
const MARINE_URL = "https://marine-api.open-meteo.com/v1/marine";

export function scoreRisk(input: {
  windSpeedMs: number;
  waveHeightM: number | null;
  visibilityM: number | null;
  precipitationMm: number;
}): RiskLevel {
  const wave = input.waveHeightM ?? 0;
  const vis = input.visibilityM ?? 50_000;
  if (input.windSpeedMs >= 11 || wave >= 1.5 || vis < 1000) return "red";
  if (
    input.windSpeedMs >= 7 ||
    wave >= 0.8 ||
    vis < 4000 ||
    input.precipitationMm >= 2
  )
    return "yellow";
  return "green";
}

export async function fetchWeather(
  lat: number,
  lon: number
): Promise<WeatherSnapshot> {
  const forecastParams = new URLSearchParams({
    latitude: String(lat),
    longitude: String(lon),
    current:
      "temperature_2m,wind_speed_10m,wind_direction_10m,precipitation,visibility",
    wind_speed_unit: "ms",
    timezone: "auto",
  });

  const marineParams = new URLSearchParams({
    latitude: String(lat),
    longitude: String(lon),
    current: "wave_height",
    timezone: "auto",
  });

  const [forecastRes, marineRes] = await Promise.all([
    fetch(`${FORECAST_URL}?${forecastParams}`),
    fetch(`${MARINE_URL}?${marineParams}`).catch(() => null),
  ]);

  if (!forecastRes.ok) throw new Error("weather_fetch_failed");
  const forecast = await forecastRes.json();
  const marine = marineRes && marineRes.ok ? await marineRes.json() : null;

  const current = forecast.current ?? {};
  const waveHeight: number | null = marine?.current?.wave_height ?? null;

  const snapshot: WeatherSnapshot = {
    temperature_c: current.temperature_2m ?? 0,
    wind_speed_ms: current.wind_speed_10m ?? 0,
    wind_direction_deg: current.wind_direction_10m ?? 0,
    wave_height_m: waveHeight,
    visibility_m: current.visibility ?? null,
    precipitation_mm: current.precipitation ?? 0,
    risk: "green",
    fetched_at: new Date().toISOString(),
  };
  snapshot.risk = scoreRisk({
    windSpeedMs: snapshot.wind_speed_ms,
    waveHeightM: snapshot.wave_height_m,
    visibilityM: snapshot.visibility_m,
    precipitationMm: snapshot.precipitation_mm,
  });
  return snapshot;
}

export function windDirectionLabel(deg: number): string {
  const dirs = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"];
  return dirs[Math.round(deg / 45) % 8];
}
