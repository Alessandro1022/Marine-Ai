"use client";

import { useEffect, useRef } from "react";
import { useMap } from "react-leaflet";
import L from "leaflet";

export function DepthTooltip() {
  const map = useMap();
  const tooltipRef = useRef<L.Popup | null>(null);

  useEffect(() => {
    if (!map) return;
    let pressTimer: NodeJS.Timeout | null = null;
    let isPressed = false;

    const handleMouseDown = (e: L.LeafletMouseEvent) => {
      isPressed = true;
      pressTimer = setTimeout(() => {
        if (isPressed) fetchDepth(e.latlng.lat, e.latlng.lng, map, tooltipRef);
      }, 800);
    };

    const handleMouseUp = () => {
      isPressed = false;
      if (pressTimer) clearTimeout(pressTimer);
    };

    map.on("mousedown", handleMouseDown);
    map.on("mouseup", handleMouseUp);
    map.on("mousemove", handleMouseUp);

    return () => {
      map.off("mousedown", handleMouseDown);
      map.off("mouseup", handleMouseUp);
      map.off("mousemove", handleMouseUp);
    };
  }, [map]);

  return null;
}

async function fetchDepth(
  lat: number,
  lng: number,
  map: L.Map,
  tooltipRef: React.MutableRefObject<L.Popup | null>
) {
  try {
    const url = new URL("https://ows.emodnet-bathymetry.eu/wms");
    url.searchParams.append("service", "WMS");
    url.searchParams.append("version", "1.1.1");
    url.searchParams.append("request", "GetFeatureInfo");
    url.searchParams.append("layers", "emodnet:mean_std_spring");
    url.searchParams.append("query_layers", "emodnet:mean_std_spring");
    url.searchParams.append("info_format", "application/json");
    url.searchParams.append("bbox", `${lng - 0.01},${lat - 0.01},${lng + 0.01},${lat + 0.01}`);
    url.searchParams.append("width", "1");
    url.searchParams.append("height", "1");
    url.searchParams.append("crs", "EPSG:4326");
    url.searchParams.append("x", "0");
    url.searchParams.append("y", "0");

    const res = await fetch(url.toString());
    if (!res.ok) throw new Error();
    const data = await res.json();
    const features = data.features || [];

    if (features.length > 0) {
      const depth = Math.abs(features[0].properties?.MEAN_STD_SPRING ?? 0);

      if (tooltipRef.current) map.removeLayer(tooltipRef.current);

      const popup = L.popup({
        className: "depth-tooltip",
        autoClose: false,
        closeButton: false,
      })
        .setLatLng([lat, lng])
        .setContent(
          `<div style="font-family: monospace; color: #2DE0BE; text-align: center;">
            <strong>${depth.toFixed(1)}m</strong>
          </div>`
        )
        .openOn(map);

      tooltipRef.current = popup;
      setTimeout(() => {
        if (tooltipRef.current) map.removeLayer(tooltipRef.current);
      }, 3000);
    }
  } catch (err) {
    console.error("[Depth]", err);
  }
}
