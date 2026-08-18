"use client";

import { useEffect } from "react";
import { preloadTiles } from "@/lib/services/tileCache";
import { useMap } from "react-leaflet";

export function useTilePreload() {
  const map = useMap();

  useEffect(() => {
    if (!map) return;

    const handleMoveEnd = async () => {
      const center = map.getCenter();
      const zoom = Math.round(map.getZoom());
      await preloadTiles(center, Math.max(zoom - 1, 8), 2);
    };

    void handleMoveEnd();

    map.on("moveend", handleMoveEnd);

    return () => {
      map.off("moveend", handleMoveEnd);
    };
  }, [map]);
}
