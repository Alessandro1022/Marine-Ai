
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
EOF
# ---- Route engine ----
cat > src/lib/services/routeEngine.ts << 'EOF'
import type { Boat, RiskLevel, RouteEstimate } from "@/types";
import { estimateFuel } from "./fuelCalculator";

const ROUTING_FACTOR = 1.18; // real water routes are longer than great-circle

export function haversineNm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 3440.065; // earth radius in nautical miles
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

export function estimateRoute(params: {
  fromLat: number;
  fromLon: number;
  toLat: number;
  toLon: number;
  boat: Pick<Boat, "boat_type" | "cruise_speed_knots"> | null;
  fuelPriceSek: number;
  weatherRisk: RiskLevel;
}): RouteEstimate {
  const distance =
    haversineNm(params.fromLat, params.fromLon, params.toLat, params.toLon) *
    ROUTING_FACTOR;
  const speed = params.boat?.cruise_speed_knots || 18;
  const etaMinutes = (distance / speed) * 60;
  const fuel = estimateFuel({
    distanceNm: distance,
    boatType: params.boat?.boat_type ?? "motorboat",
    cruiseSpeedKnots: speed,
    fuelPriceSek: params.fuelPriceSek,
  });

  return {
    distance_nm: round1(distance),
    eta_minutes: Math.round(etaMinutes),
    fuel_liters: round1(fuel.consumption_liters),
    fuel_cost_sek: Math.round(fuel.cost_sek),
    risk: params.weatherRisk,
  };
}

export function formatEta(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = Math.round(minutes % 60);
  return h > 0 ? `${h}h ${m}min` : `${m}min`;
}

const round1 = (n: number) => Math.round(n * 10) / 10;
EOF
# ---- Fuel calculator ----
cat > src/lib/services/fuelCalculator.ts << 'EOF'
import type { BoatType, FuelEstimate } from "@/types";

// Baseline liters per nautical mile at reference cruise speed
const BASELINE: Record<BoatType, { lPerNm: number; refSpeed: number }> = {
  motorboat: { lPerNm: 1.2, refSpeed: 20 },
  fishing_boat: { lPerNm: 1.0, refSpeed: 16 },
  pwc: { lPerNm: 0.9, refSpeed: 30 },
  sailboat: { lPerNm: 0.35, refSpeed: 6 }, // engine-assisted
};

const RESERVE_RATIO = 0.2; // recommended 20% safety reserve

export function estimateFuel(params: {
  distanceNm: number;
  boatType: BoatType;
  cruiseSpeedKnots: number;
  fuelPriceSek: number;
}): FuelEstimate {
  const base = BASELINE[params.boatType] ?? BASELINE.motorboat;
  // Consumption rises non-linearly with speed above reference
  const speedFactor = Math.max(
    0.6,
    Math.pow(params.cruiseSpeedKnots / base.refSpeed, 1.5)
  );
  const consumption = params.distanceNm * base.lPerNm * speedFactor;
  const reserve = consumption * RESERVE_RATIO;

  return {
    consumption_liters: round1(consumption),
    cost_sek: round1(consumption * params.fuelPriceSek),
    reserve_liters: round1(reserve),
    total_recommended_liters: round1(consumption + reserve),
  };
}

const round1 = (n: number) => Math.round(n * 10) / 10;
EOF
# ---- SignalK marine electronics client (Garmin/Raymarine etc via gateway) ----
cat > src/lib/services/signalk.ts << 'EOF'
// Connects to onboard marine electronics (Garmin, Raymarine, Simrad/Navico,
// Lowrance, B&G and any NMEA 2000/0183 network) through a SignalK gateway on
// the boat's WiFi (e.g. Yacht Devices YDWG-02, Raspberry Pi SignalK server,
// or chartplotters with SignalK support).
//
// Note: connecting to a local ws:// gateway from an https PWA is blocked by
// browsers (mixed content). Live telemetry works in the wrapped native app
// (WKWebView/WebView allows it) or when the gateway exposes wss://.

export interface Telemetry {
  speedOverGroundKn: number | null;
  courseOverGroundDeg: number | null;
  depthM: number | null;
  windSpeedApparentMs: number | null;
  headingDeg: number | null;
  updatedAt: number;
}

type Listener = (t: Telemetry) => void;

const MS_TO_KN = 1.94384;
const RAD_TO_DEG = 180 / Math.PI;

export class SignalKClient {
  private ws: WebSocket | null = null;
  private telemetry: Telemetry = {
    speedOverGroundKn: null,
    courseOverGroundDeg: null,
    depthM: null,
    windSpeedApparentMs: null,
    headingDeg: null,
    updatedAt: 0,
  };

  connect(host: string, onUpdate: Listener, onStatus: (s: "connecting" | "open" | "closed" | "error") => void) {
    this.disconnect();
    const secure = typeof window !== "undefined" && window.location.protocol === "https:";
    const proto = secure ? "wss" : "ws";
    const url = `${proto}://${host}/signalk/v1/stream?subscribe=none`;

    onStatus("connecting");
    try {
      this.ws = new WebSocket(url);
    } catch {
      onStatus("error");
      return;
    }

    this.ws.onopen = () => {
      onStatus("open");
      this.ws?.send(
        JSON.stringify({
          context: "vessels.self",
          subscribe: [
            { path: "navigation.speedOverGround" },
            { path: "navigation.courseOverGroundTrue" },
            { path: "navigation.headingTrue" },
            { path: "environment.depth.belowTransducer" },
            { path: "environment.wind.speedApparent" },
          ],
        })
      );
    };

    this.ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        const updates = msg.updates ?? [];
        for (const update of updates) {
          for (const v of update.values ?? []) {
            switch (v.path) {
              case "navigation.speedOverGround":
                this.telemetry.speedOverGroundKn = v.value * MS_TO_KN;
                break;
              case "navigation.courseOverGroundTrue":
                this.telemetry.courseOverGroundDeg = v.value * RAD_TO_DEG;
                break;
              case "navigation.headingTrue":
                this.telemetry.headingDeg = v.value * RAD_TO_DEG;
                break;
              case "environment.depth.belowTransducer":
                this.telemetry.depthM = v.value;
                break;
              case "environment.wind.speedApparent":
                this.telemetry.windSpeedApparentMs = v.value;
                break;
            }
          }
        }
        this.telemetry.updatedAt = Date.now();
        onUpdate({ ...this.telemetry });
      } catch {
        // ignore malformed frames
      }
    };

    this.ws.onerror = () => onStatus("error");
    this.ws.onclose = () => onStatus("closed");
  }

  disconnect() {
    this.ws?.close();
    this.ws = null;
  }
}

export const INTEGRATION_PROVIDERS = [
  { id: "garmin", name: "Garmin", note: "Via NMEA 2000 gateway / SignalK" },
  { id: "raymarine", name: "Raymarine", note: "Via SeaTalkNG–N2K gateway / SignalK" },
  { id: "simrad", name: "Simrad (Navico)", note: "Via NMEA 2000 gateway / SignalK" },
  { id: "lowrance", name: "Lowrance", note: "Via NMEA 2000 gateway / SignalK" },
  { id: "bg", name: "B&G", note: "Via NMEA 2000 gateway / SignalK" },
  { id: "yachtdevices", name: "Yacht Devices", note: "YDWG-02 WiFi gateway (direct)" },
  { id: "signalk", name: "SignalK Server", note: "Raspberry Pi / onboard server (direct)" },
] as const;
EOF
# ---- Geo + hooks ----
cat > src/hooks/useGeolocation.ts << 'EOF'
"use client";

import { useEffect, useState } from "react";

// Default: Stockholm archipelago
const FALLBACK = { lat: 59.32, lon: 18.55 };

export function useGeolocation() {
  const [position, setPosition] = useState<{ lat: number; lon: number }>(FALLBACK);
  const [isFallback, setIsFallback] = useState(true);

  useEffect(() => {
    if (!("geolocation" in navigator)) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setPosition({ lat: pos.coords.latitude, lon: pos.coords.longitude });
        setIsFallback(false);
      },
      () => setIsFallback(true),
      { enableHighAccuracy: false, timeout: 8000, maximumAge: 300_000 }
    );
  }, []);

  return { ...position, isFallback };
}
EOF
cat > src/hooks/useWeather.ts << 'EOF'
"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchWeather } from "@/lib/services/weatherService";

export function useWeather(lat: number, lon: number) {
  return useQuery({
    queryKey: ["weather", Math.round(lat * 100), Math.round(lon * 100)],
    queryFn: () => fetchWeather(lat, lon),
    staleTime: 10 * 60_000,
    refetchInterval: 10 * 60_000,
  });
}
