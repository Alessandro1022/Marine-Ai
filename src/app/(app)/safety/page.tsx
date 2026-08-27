"use client";

import { useState } from "react";
import { ShieldAlert, Phone, CheckSquare, Square } from "lucide-react";
import { useGeolocation } from "@/hooks/useGeolocation";
import { useWeather } from "@/hooks/useWeather";
import { useBoatStore } from "@/stores/boatStore";

const GÖTEBORG = { lat: 57.7089, lon: 11.9746 };

const CHECKLIST_KEYS = [
  "PFD för alla",
  "Livslinor säkrade",
  "Radiokontakt funkar",
  "Navigationsutrustning OK",
  "Säkerhetsutrustning kontrollerad",
  "Väderrapport noterad",
];

export default function SafetyPage() {
  const { lat, lon } = useGeolocation();
  const finalLat = lat || GÖTEBORG.lat;
  const finalLon = lon || GÖTEBORG.lon;
  
  const { data: weather } = useWeather(finalLat, finalLon);
  const boat = useBoatStore((s) => s.primaryBoat());
  const [checked, setChecked] = useState<Set<string>>(new Set());

  function toggle(key: string) {
    setChecked((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  const warnings: { text: string; level: "yellow" | "red" }[] = [];
  
  if (weather?.risk === "red") {
    warnings.push({ text: "🔴 Högt väderriskreferens", level: "red" });
  }
  if (weather?.risk === "yellow") {
    warnings.push({ text: "🟡 Måttligt väderriskreferens", level: "yellow" });
  }

  return (
    <div className="space-y-6 p-4 pb-28">
      {/* HEADER */}
      <div>
        <h1 className="text-3xl font-bold text-mist mb-2">Säkerhet</h1>
        <p className="text-mist/60 text-sm">Pre-trip checklista</p>
      </div>

      {/* WARNINGS */}
      {warnings.length > 0 && (
        <div className="space-y-2">
          {warnings.map((w, i) => (
            <div
              key={i}
              className={`p-4 rounded-lg border flex items-center gap-3 ${
                w.level === "red"
                  ? "bg-red-500/10 border-red-500/20"
                  : "bg-yellow-500/10 border-yellow-500/20"
              }`}
            >
              <ShieldAlert
                size={18}
                className={w.level === "red" ? "text-red-500" : "text-yellow-500"}
              />
              <p className="text-sm text-mist">{w.text}</p>
            </div>
          ))}
        </div>
      )}

      {/* SOS BUTTON */}
      <div className="bg-sonar/10 border border-sonar/20 rounded-lg p-4">
        <p className="text-xs text-mist/50 mb-3">NÖDSIGNAL</p>
        <a
          href="tel:112"
          className="block p-4 bg-red-500/20 hover:bg-red-500/30 rounded-lg border border-red-500/30 text-center transition"
        >
          <p className="text-3xl font-bold text-red-500 mb-1">112</p>
          <p className="text-sm text-mist">Ring omedelbar hjälp</p>
        </a>
      </div>

      {/* EMERGENCY CONTACTS */}
      <div>
        <h2 className="text-lg font-semibold text-mist mb-3">Nödkontakter</h2>
        <div className="space-y-2">
          <Contact name="Svenska Räddningsverket (JRCC)" number="112" />
          <Contact name="SSRS (Sjöfartsverket)" number="077-579 00 90" />
          <Contact name="VHF Nödsignal" number="Kanal 16" />
        </div>
      </div>

      {/* SAFETY CHECKLIST */}
      <div>
        <h2 className="text-lg font-semibold text-mist mb-3">Säkerhetschecklista</h2>
        <div className="space-y-2">
          {CHECKLIST_KEYS.map((key) => (
            <button
              key={key}
              onClick={() => toggle(key)}
              className="w-full p-3 bg-sonar/5 border border-sonar/20 rounded-lg hover:bg-sonar/10 transition flex items-center gap-3 text-left"
            >
              {checked.has(key) ? (
                <CheckSquare size={18} className="text-sonar flex-shrink-0" />
              ) : (
                <Square size={18} className="text-mist/40 flex-shrink-0" />
              )}
              <span
                className={`text-sm ${
                  checked.has(key)
                    ? "text-mist/50 line-through"
                    : "text-mist"
                }`}
              >
                {key}
              </span>
            </button>
          ))}
        </div>
        {checked.size === CHECKLIST_KEYS.length && (
          <div className="mt-4 p-3 bg-green-500/10 border border-green-500/30 rounded-lg text-center">
            <p className="text-sm text-green-500 font-semibold">✓ Alla kontroller klara!</p>
          </div>
        )}
      </div>

      {/* BOAT INFO */}
      {boat && (
        <div>
          <h2 className="text-lg font-semibold text-mist mb-3">Båtinformation</h2>
          <div className="bg-sonar/5 border border-sonar/20 rounded-lg p-4 space-y-2">
            <div>
              <p className="text-xs text-mist/50">Båt</p>
              <p className="text-sm text-mist font-semibold">{boat.name}</p>
            </div>
            <div>
              <p className="text-xs text-mist/50">Typ</p>
              <p className="text-sm text-mist">{boat.type}</p>
            </div>
            <div className="grid grid-cols-2 gap-3 mt-3">
              <div>
                <p className="text-xs text-mist/50">Längd</p>
                <p className="text-sm text-mist">{boat.length_m}m</p>
              </div>
              <div>
                <p className="text-xs text-mist/50">Bränsletank</p>
                <p className="text-sm text-mist">{boat.fuel_capacity_liters}L</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Contact({ name, number }: { name: string; number: string }) {
  return (
    <div className="p-3 bg-sonar/5 border border-sonar/20 rounded-lg flex items-center justify-between">
      <span className="text-sm text-mist">{name}</span>
      <span className="text-sm text-sonar font-semibold">{number}</span>
    </div>
  );
}
