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
EOF
cat > "src/app/(app)/map/page.tsx" << 'EOF'
"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { Anchor } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { LoadingScreen } from "@/components/ui/LoadingScreen";
import { useT } from "@/lib/i18n";

const MarineMap = dynamic(() => import("@/components/map/MarineMap"), {
  ssr: false,
  loading: () => <LoadingScreen />,
});

export default function MapPage() {
  const t = useT();
  return (
    <div>
      <PageHeader
        title={t("map.title")}
        action={
          <Link href="/marinas" className="btn-ghost !px-4 !py-2 text-xs">
            <Anchor size={14} /> {t("marinas.title")}
          </Link>
        }
      />
      <MarineMap />
    </div>
  );
}
EOF
# ---- Marinas directory ----
cat > "src/app/(app)/marinas/page.tsx" << 'EOF'
"use client";

import { useState } from "react";
import { Heart, Fuel, Utensils, Zap, Droplets, Wifi, Anchor } from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { PageHeader } from "@/components/ui/PageHeader";
import { EmptyState } from "@/components/ui/EmptyState";
import { createClient } from "@/lib/supabase/client";
import { useT } from "@/lib/i18n";
import type { Marina } from "@/types";

export default function MarinasPage() {
  const t = useT();
  const [search, setSearch] = useState("");
  const queryClient = useQueryClient();

  const { data: marinas } = useQuery({
    queryKey: ["marinas"],
    queryFn: async () => {
      const supabase = createClient();
      const { data } = await supabase.from("marinas").select("*").order("name");
      return (data as Marina[]) ?? [];
    },
  });

  const { data: favorites } = useQuery({
    queryKey: ["favorite_marinas"],
    queryFn: async () => {
      const supabase = createClient();
      const { data } = await supabase.from("favorite_marinas").select("marina_id");
      return new Set((data ?? []).map((f) => f.marina_id as string));
    },
  });

  async function toggleFavorite(marinaId: string) {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;
    if (favorites?.has(marinaId)) {
      await supabase.from("favorite_marinas").delete().eq("marina_id", marinaId).eq("user_id", user.id);
    } else {
      await supabase.from("favorite_marinas").insert({ user_id: user.id, marina_id: marinaId });
    }
    void queryClient.invalidateQueries({ queryKey: ["favorite_marinas"] });
  }

  const filtered = (marinas ?? []).filter(
    (m) =>
      m.name.toLowerCase().includes(search.toLowerCase()) ||
      (m.region ?? "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <PageHeader title={t("marinas.title")} />
      <input
        className="input-field mb-4"
        placeholder={t("common.search")}
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />
      <div className="flex flex-col gap-3">
        {filtered.length === 0 ? (
          <EmptyState text={t("common.empty")} />
        ) : (
          filtered.map((m) => (
            <div key={m.id} className="glass-card p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-display font-semibold">{m.name}</p>
                  <p className="text-xs text-mist">{m.region}</p>
                </div>
                <button onClick={() => toggleFavorite(m.id)} aria-label="Favorite">
                  <Heart
                    size={18}
                    className={favorites?.has(m.id) ? "fill-sonar text-sonar" : "text-mist"}
                  />
                </button>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                {m.has_fuel ? <Tag icon={Fuel} label={t("marinas.fuel")} /> : null}
                {m.has_restaurant ? <Tag icon={Utensils} label={t("marinas.restaurant")} /> : null}
                {m.has_electricity ? <Tag icon={Zap} label={t("marinas.electricity")} /> : null}
                {m.is_guest_harbor ? <Tag icon={Anchor} label={t("marinas.guestHarbor")} /> : null}
                {m.has_water ? <Tag icon={Droplets} label={t("marinas.water")} /> : null}
                {m.has_wifi ? <Tag icon={Wifi} label={t("marinas.wifi")} /> : null}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function Tag({ icon: Icon, label }: { icon: typeof Fuel; label: string }) {
  return (
    <span className="flex items-center gap-1.5 rounded-full border border-sonar/20 bg-sonar/5 px-2.5 py-1 text-[0.65rem] text-sonar">
      <Icon size={11} /> {label}
    </span>
  );
}
