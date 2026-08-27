"use client";

import { useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from "react-leaflet";
import { useGeolocation } from "@/hooks/useGeolocation";
import { useTripStore } from "@/stores/tripStore";
import { Polyline } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

const OSM_URL = "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";
const SEAMARKS_URL = "https://tiles.openseamap.org/seamark/{z}/{x}/{y}.png";
const BATHYMETRY_URL = "https://tiles.emodnet-bathymetry.eu/2020/baselayer/web_mercator/{z}/{x}/{y}.png";

export function MarineMap() {
  const { lat, lon, heading, speed } = useGeolocation();
  const { activeTrip, isRecording } = useTripStore();

  const center: [number, number] = lat && lon ? [lat, lon] : [58.3, 11.97]; // Göteborg default

  return (
    <MapContainer
      center={center}
      zoom={11}
      style={{ height: "100%", width: "100%", background: "#0A0E14" }}
      className="map-container"
    >
      {/* Base layers */}
      <TileLayer
        url={OSM_URL}
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        maxZoom={19}
      />

      {/* Bathymetry */}
      <TileLayer
        url={BATHYMETRY_URL}
        attribution="EMODnet Bathymetry"
        opacity={0.4}
        maxZoom={16}
      />

      {/* Sea marks */}
      <TileLayer
        url={SEAMARKS_URL}
        attribution="OpenSeaMap"
        minZoom={8}
        opacity={0.9}
        maxZoom={18}
      />

      {/* Current position marker */}
      {lat && lon && (
        <Marker position={[lat, lon]}>
          <Popup>
            <div className="text-xs">
              <p>Position: {lat.toFixed(4)}°, {lon.toFixed(4)}°</p>
              {speed && <p>Fart: {speed.toFixed(1)} kn</p>}
              {heading && <p>Kurs: {heading.toFixed(0)}°</p>}
            </div>
          </Popup>
        </Marker>
      )}

      {/* Trip polyline */}
      {isRecording && activeTrip && activeTrip.points.length > 1 && (
        <Polyline
          positions={activeTrip.points.map(p => [p.lat, p.lon])}
          color="#2DE0BE"
          weight={3}
          opacity={0.7}
        />
      )}

      {/* Zoom controls */}
      <MapControls lat={lat} lon={lon} heading={heading} speed={speed} />
    </MapContainer>
  );
}

function MapControls({ lat, lon, heading, speed }: any) {
  useMapEvents({
    click: (e) => {
      console.log("Clicked at:", e.latlng);
    },
  });

  if (!lat || !lon) return null;

  return (
    <div className="absolute bottom-20 left-3 z-40 bg-deep/80 backdrop-blur-sm border border-sonar/20 rounded-lg p-3 text-xs space-y-1">
      <div className="text-sonar font-semibold">
        {Math.round(speed || 0)} kn
      </div>
      <div className="text-mist/70">
        {Math.round(heading || 0)}° COG
      </div>
      <div className="text-mist/70">
        {lat.toFixed(3)}°<br />
        {lon.toFixed(3)}°
      </div>
    </div>
  );
}
