"use client";

import { Wind, Waves, Thermometer, Eye } from "lucide-react";
import type { WeatherSnapshot } from "@/types";
import { useI18n } from "@/lib/i18n";

const riskColor = { green: "text-risk-green", yellow: "text-risk-yellow", red: "text-risk-red" };
const riskDot = { green: "risk-dot-green", yellow: "risk-dot-yellow", red: "risk-dot-red" };

export function WeatherCard({ weather }: { weather: WeatherSnapshot }) {
  const { t } = useI18n();
  return (
    <section className="glass-card p-4">
      <div className="flex items-center justify-between">
        <span className="instrument-label">{t("home.currentWeather")}</span>
        <span className="flex items-center gap-2">
          <span className={riskDot[weather.risk]} />
          <span className={`instrument-label ${riskColor[weather.risk]}`}>
            {t(`home.risk${weather.risk.charAt(0).toUpperCase() + weather.risk.slice(1)}`)}
          </span>
        </span>
      </div>
      <div className="mt-4 grid grid-cols-4 gap-3">
        <div className="flex flex-col items-center gap-1">
          <Wind size={16} className="text-mist" strokeWidth={1.5} />
          <p className="instrument text-xl">{weather.wind_speed_ms.toFixed(1)}</p>
          <p className="instrument-label">{t("home.wind")} m/s</p>
        </div>
        <div className="flex flex-col items-center gap-1">
          <Waves size={16} className="text-mist" strokeWidth={1.5} />
          <p className="instrument text-xl">{weather.wave_height_m?.toFixed(1) ?? "—"}</p>
          <p className="instrument-label">{t("home.waves")} m</p>
        </div>
        <div className="flex flex-col items-center gap-1">
          <Thermometer size={16} className="text-mist" strokeWidth={1.5} />
          <p className="instrument text-xl">{Math.round(weather.temperature_c)}°</p>
          <p className="instrument-label">{t("home.temperature")}</p>
        </div>
        <div className="flex flex-col items-center gap-1">
          <Eye size={16} className="text-mist" strokeWidth={1.5} />
          <p className="instrument text-xl">
            {weather.visibility_m ? (weather.visibility_m / 1000).toFixed(1) : "—"}
          </p>
          <p className="instrument-label">km</p>
        </div>
      </div>
    </section>
  );
}
