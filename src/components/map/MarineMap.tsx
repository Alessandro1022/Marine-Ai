"use client";

import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { useGeolocation } from "@/hooks/useGeolocation";
import { useT } from "@/lib/i18n";
import type { Marina } from "@/types";

const marinaIcon = L.divIcon({
  className: "",
  html: `<div style="width:14px;height:14px;border-radius:50%;background:#2DE0BE;box-shadow:0 0 12px rgba(45,224,190,0.9), 0 0 0 4px rgba(45,224,190,0.18);"></div>`,
  iconSize: [14, 14],
  iconAnchor: [7, 7],
});

const userIcon = L.divIcon({
  className: "",
  html: `<div style="width:16px;height:16px;border-radius:50%;background:#5EA0FF;border:2px solid #E9F4F6;box-shadow:0 0 14px rgba(94,160,255,0.9);"></div>`,
  iconSize: [16, 16],
  iconAnchor: [8, 8],
});

export default function MarineMap() {
  const { lat, lon } = useGeolocation();
  const t = useT();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const { data: marinas } = useQuery({
    queryKey: ["marinas"],
    queryFn: async () => {
      const supabase = createClient();
      const { data } = await supabase.from("marinas").select("*");
      return (data as Marina[]) ?? [];
    },
    staleTime: 30 * 60_000,
  });

  if (!mounted) return null;

  return (
    <div className="holo-panel overflow-hidden" style={{ height: "calc(100dvh - 13rem)" }}>
      <MapContainer
        center={[lat, lon]}
        zoom={9}
        style={{ height: "100%", width: "100%", background: "#060D14" }}
        attributionControl={false}
      >
        <TileLayer url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" />
        <Marker position={[lat, lon]} icon={userIcon}>
          <Popup>{t("map.myLocation")}</Popup>
        </Marker>
        {(marinas ?? []).map((m) => (
          <Marker key={m.id} position={[m.latitude, m.longitude]} icon={marinaIcon}>
            <Popup>
              <strong>{m.name}</strong>
              <br />
              {m.region}
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
