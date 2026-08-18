"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import { MapContainer, TileLayer, WMSTileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useQuery } from "@tanstack/react-query";
import { Sparkles } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useGeolocation } from "@/hooks/useGeolocation";
import { useWeather } from "@/hooks/useWeather";
import { useI18n } from "@/lib/i18n";
import { DepthTooltip } from "@/components/map/DepthTooltip";
import { useTilePreload } from "@/hooks/useTilePreload";
import { useMapStore } from "@/stores/mapStore";
import {
  buildChartContext,
  checkRouteAgainstAreas,
  type ProtectedArea,
} from "@/lib/services/ecoService";
import { haversineNm, formatEta, estimateRoute } from "@/lib/services/routeEngine";
import { useBoatStore } from "@/stores/boatStore";
import { useSettingsStore } from "@/stores/settingsStore";
import { ProtectedAreasLayer } from "./ProtectedAreasLayer";
import { RouteLayer } from "./RouteLayer";
import { MeasureLayer } from "./MeasureLayer";
import { LivePositionLayer, type LiveFix } from "./LivePositionLayer";
import { MapAIPanel } from "./MapAIPanel";
import { MapControls } from "./MapControls";
import type { Marina } from "@/types";

const LAND_BASE_URL =
  "https://{s}.basemaps.cartocdn.com/rastertiles/voyager_nolabels/{z}/{x}/{y}{r}.png";
const LABELS_URL =
  "https://{s}.basemaps.cartocdn.com/rastertiles/voyager_only_labels/{z}/{x}/{y}{r}.png";
const EMODNET_URL =
  "https://tiles.emodnet-bathymetry.eu/2020/baselayer/web_mercator/{z}/{x}/{y}.png";
const ENIRO_URL =
  "https://map.eniro.com/geowebcache/service/tms1.0.0/nautical/{z}/{x}/{y}.png";
const SEAMARK_URL = "https://tiles.openseamap.org/seamark/{z}/{x}/{y}.png";
const CONTOURS_WMS = "https://ows.emodnet-bathymetry.eu/wms";
const DARK_URL =
  "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png";

const SMOOTH = {
  keepBuffer: 6,
  updateWhenZooming: false,
  updateWhenIdle: false,
} as const;

const marinaIcon = L.divIcon({
  className: "",
  html: `<div style="width:13px;height:13px;border-radius:50%;background:#2DE0BE;box-shadow:0 0 10px rgba(45,224,190,0.9), 0 0 0 4px rgba(45,224,190,0.16);"></div>`,
  iconSize: [13, 13],
  iconAnchor: [6, 6],
});

function FlyTo({ trigger, lat, lon }: { trigger: number; lat: number; lon: number }) {
  const map = useMap();
  const lastRef = useRef(0);
  if (trigger !== lastRef.current) {
    lastRef.current = trigger;
    map.flyTo([lat, lon], Math.max(map.getZoom(), 11), { duration: 0.8 });
  }
  return null;
}

function TilePreloader() {
  useTilePreload();
  return null;
}

export default function MarineMap() {
  const { t, locale } = useI18n();
  const geo = useGeolocation();
  const store = useMapStore();
  const boat = useBoatStore((s) => s.primaryBoat());
  const fuelPrice = useSettingsStore((s) => s.fuelPriceSek);

  const [fix, setFix] = useState<LiveFix | null>(null);
  const [aiOpen, setAiOpen] = useState(false);
  const [locateTick, setLocateTick] = useState(0);
  const mapRef = useRef<L.Map | null>(null);

  const onFix = useCallback((f: LiveFix) => setFix(f), []);

  const { data: marinas } = useQuery({
    queryKey: ["marinas"],
    queryFn: async () => {
      const supabase = createClient();
      const { data } = await supabase.from("marinas").select("*");
      return (data as Marina[]) ?? [];
    },
    staleTime: 30 * 60_000,
  });

  const { data: areas } = useQuery({
    queryKey: ["protected_areas"],
    queryFn: async () => {
      const supabase = createClient();
      const { data } = await supabase.from("protected_areas").select("*");
      return (data as ProtectedArea[]) ?? [];
    },
    staleTime: 60 * 60_000,
  });

  const lat = fix?.lat ?? geo.lat;
  const lon = fix?.lon ?? geo.lon;
  const { data: weather } = useWeather(lat, lon);

  const hits = useMemo(() => {
    if (!store.routeStart || !store.routeEnd || !areas) return [];
    return checkRouteAgainstAreas(
      store.routeStart.lat,
      store.routeStart.lng,
      store.routeEnd.lat,
      store.routeEnd.lng,
      areas
    );
  }, [store.routeStart, store.routeEnd, areas]);

  const routeStats = useMemo(() => {
    if (!store.routeStart || !store.routeEnd || !weather) return null;
    return estimateRoute({
      fromLat: store.routeStart.lat,
      fromLon: store.routeStart.lng,
      toLat: store.routeEnd.lat,
      toLon: store.routeEnd.lng,
      boat,
      fuelPriceSek: fuelPrice,
      weatherRisk: weather.risk,
    });
  }, [store.routeStart, store.routeEnd, weather, boat, fuelPrice]);

  const chartContext = useMemo(() => {
    const map = mapRef.current;
    const bounds = map?.getBounds();
    const inView = <T extends { latitude: number; longitude: number }>(
      items: T[]
    ) =>
      bounds
        ? items.filter((i) => bounds.contains([i.latitude, i.longitude]))
        : items;

    const routeSummary =
      store.routeStart && store.routeEnd
        ? `${store.routeStart.lat.toFixed(3)},${store.routeStart.lng.toFixed(3)} → ${store.routeEnd.lat.toFixed(3)},${store.routeEnd.lng.toFixed(3)}, ${haversineNm(store.routeStart.lat, store.routeStart.lng, store.routeEnd.lat, store.routeEnd.lng).toFixed(1)} nm${routeStats ? `, ETA ${formatEta(routeStats.eta_minutes)}, fuel ~${routeStats.fuel_liters} L` : ""}`
        : undefined;

    return buildChartContext({
      centerLat: map?.getCenter().lat ?? lat,
      centerLon: map?.getCenter().lng ?? lon,
      zoom: map?.getZoom() ?? 9,
      marinas: inView(marinas ?? []),
      areas: inView(areas ?? []),
      weatherSummary: weather
        ? `wind ${weather.wind_speed_ms} m/s, waves ${weather.wave_height_m ?? "?"} m, visibility ${weather.visibility_m ?? "?"} m, risk ${weather.risk}`
        : undefined,
      routeSummary,
      hits,
    });
  }, [aiOpen, marinas, areas, weather, hits, routeStats, lat, lon, store.routeStart, store.routeEnd]);

  function locate() {
    setLocateTick((n) => n + 1);
  }

  function setAnchorHere() {
    store.setAnchor({ lat, lng: lon, radiusM: 40 });
  }

  return (
    <div
      className="holo-panel relative overflow-hidden"
      style={{ height: "calc(100dvh - 11.5rem)" }}
    >
      <MapContainer
        center={[geo.lat, geo.lon]}
        zoom={9}
        style={{ height: "100%", width: "100%", background: "#BFD8E5" }}
        attributionControl={false}
        preferCanvas
        zoomSnap={0.5}
        zoomDelta={0.5}
        wheelPxPerZoomLevel={90}
        fadeAnimation
        ref={mapRef}
      >
        <TilePreloader />
        <DepthTooltip />

        {store.base === "dark" ? (
          <TileLayer url={DARK_URL} maxZoom={18} maxNativeZoom={18} zIndex={1} {...SMOOTH} />
        ) : store.base === "eniro" ? (
          <>
            <TileLayer
              url={LAND_BASE_URL}
              maxZoom={18}
              maxNativeZoom={18}
              zIndex={1}
              className="land-base"
              {...SMOOTH}
            />
            <TileLayer
              url={ENIRO_URL}
              tms
              maxZoom={18}
              maxNativeZoom={17}
              opacity={1}
              zIndex={2}
              {...SMOOTH}
            />
          </>
        ) : (
          <>
            <TileLayer
              url={LAND_BASE_URL}
              maxZoom={18}
              maxNativeZoom={18}
              detectRetina
              zIndex={1}
              className="land-base"
              {...SMOOTH}
            />
            {store.showDepth ? (
              <>
                <TileLayer
                  url={EMODNET_URL}
                  maxNativeZoom={12}
                  maxZoom={18}
                  zIndex={2}
                  className="depth-layer"
                  {...SMOOTH}
                />
                <WMSTileLayer
                  url={CONTOURS_WMS}
                  layers="emodnet:contours"
                  format="image/png"
                  transparent
                  maxZoom={18}
                  zIndex={3}
                  className="contour-layer"
                  {...SMOOTH}
                />
              </>
            ) : null}
            <TileLayer
              url={LABELS_URL}
              maxZoom={18}
              maxNativeZoom={18}
              zIndex={4}
              {...SMOOTH}
            />
          </>
        )}
        {store.showSeamarks ? (
          <TileLayer
            url={SEAMARK_URL}
            maxZoom={18}
            maxNativeZoom={18}
            minZoom={9}
            zIndex={5}
            {...SMOOTH}
          />
        ) : null}

        {store.showMarinas
          ? (marinas ?? []).map((m) => (
              <Marker key={m.id} position={[m.latitude, m.longitude]} icon={marinaIcon}>
                <Popup>
                  <strong>{m.name}</strong>
                  <br />
                  {m.region}
                  {m.has_fuel ? ` · ⛽` : ""}
                </Popup>
              </Marker>
            ))
          : null}

        {store.showProtected && areas ? <ProtectedAreasLayer areas={areas} /> : null}

        <RouteLayer hits={hits} />
        <MeasureLayer />
        <LivePositionLayer onFix={onFix} />
        <FlyTo trigger={locateTick} lat={lat} lon={lon} />
      </MapContainer>

      <MapControls onLocate={locate} onSetAnchorHere={setAnchorHere} />

      {store.base === "chart" && store.showDepth ? (
        <div className="absolute left-3 top-3 z-[999] flex items-center gap-2 rounded-xl border border-white/12 bg-deep/85 px-2.5 py-1.5 backdrop-blur">
          <span
            className="h-2.5 w-16 rounded-full"
            style={{
              background:
                "linear-gradient(90deg, #DDEFF7 0%, #9CC8E8 35%, #4E8FC7 65%, #1E4E8C 100%)",
            }}
          />
          <span className="instrument-label">{t("chart.depthLegend")}</span>
        </div>
      ) : null}

      <div className="absolute bottom-3 left-3 z-[999] rounded-xl border border-white/12 bg-deep/85 px-3 py-2 backdrop-blur">
        <div className="flex gap-4">
          <div>
            <p className="instrument text-base text-sonar glow-text">
              {fix?.sogKn !== null && fix?.sogKn !== undefined
                ? fix.sogKn.toFixed(1)
                : "0.0"}
            </p>
            <p className="instrument-label">SOG kn</p>
          </div>
          <div>
            <p className="instrument text-base">
              {fix?.cogDeg !== null && fix?.cogDeg !== undefined
                ? `${Math.round(fix.cogDeg)}°`
                : "–"}
            </p>
            <p className="instrument-label">COG</p>
          </div>
          {routeStats ? (
            <div>
              <p className="instrument text-base">{formatEta(routeStats.eta_minutes)}</p>
              <p className="instrument-label">ETA · {routeStats.fuel_liters} L</p>
            </div>
          ) : null}
        </div>
      </div>

      <button
        onClick={() => setAiOpen(true)}
        className="btn-primary absolute bottom-3 right-3 z-[999] !px-4 !py-2.5 text-xs"
      >
        <Sparkles size={14} /> AI
      </button>

      {aiOpen ? (
        <MapAIPanel
          chartContext={chartContext}
          routeActive={!!(store.routeStart && store.routeEnd)}
          hits={hits}
          onClose={() => setAiOpen(false)}
        />
      ) : null}

      <p className="absolute bottom-0 left-1/2 z-[998] -translate-x-1/2 whitespace-nowrap pb-0.5 text-[0.55rem] text-mist/60">
        {t("chart.disclaimer")} · © EMODnet · OpenSeaMap · CARTO/OSM
      </p>
    </div>
  );
}

