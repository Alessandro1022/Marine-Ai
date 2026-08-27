"use client";

import { MapContainer, TileLayer, Marker, Popup, Polyline } from "react-leaflet";
import { useGeolocation } from "@/hooks/useGeolocation";
import { useTripStore } from "@/stores/tripStore";
import "leaflet/dist/leaflet.css";

const OSM_URL = "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";
const SEAMARKS_URL = "https://tiles.openseamap.org/seamark/{z}/{x}/{y}.png";

export function MarineMap() {
  const { lat, lon, heading, speed } = useGeolocation();
  const { activeTrip, isRecording } = useTripStore();

  const center: [number, number] = lat && lon ? [lat, lon] : [57.7089, 11.9746];

  return (
    <MapContainer
      center={center}
      zoom={11}
      style={{ height: "100%", width: "100%", background: "#0A0E14" }}
    >
      <TileLayer
        url={OSM_URL}
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        maxZoom={19}
      />

      <TileLayer
        url={SEAMARKS_URL}
        attribution="OpenSeaMap"
        minZoom={8}
        opacity={0.9}
        maxZoom={18}
      />

      {lat && lon && (
        <Marker position={[lat, lon]}>
          <Popup>
            <div className="text-xs">
              <p>{lat.toFixed(4)}°, {lon.toFixed(4)}°</p>
              {speed && <p>Fart: {speed.toFixed(1)} kn</p>}
              {heading && <p>Kurs: {heading.toFixed(0)}°</p>}
            </div>
          </Popup>
        </Marker>
      )}

      {isRecording && activeTrip && activeTrip.points.length > 1 && (
        <Polyline
          positions={activeTrip.points.map(p => [p.lat, p.lon])}
          color="#2DE0BE"
          weight={3}
          opacity={0.7}
        />
      )}
    </MapContainer>
  );
}
